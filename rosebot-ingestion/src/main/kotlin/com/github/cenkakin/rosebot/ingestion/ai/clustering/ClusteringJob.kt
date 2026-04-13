package com.github.cenkakin.rosebot.ingestion.ai.clustering

import com.github.cenkakin.rosebot.cluster.ClusterService
import com.github.cenkakin.rosebot.cluster.NewCluster
import com.github.cenkakin.rosebot.ingestion.ai.embedding.EmbeddingService
import dev.failsafe.Failsafe
import dev.failsafe.Fallback
import dev.failsafe.RetryPolicy
import dev.failsafe.function.CheckedSupplier
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.tribuo.MutableDataset
import org.tribuo.clustering.ClusteringFactory
import org.tribuo.clustering.hdbscan.HdbscanTrainer
import org.tribuo.datasource.ListDataSource
import org.tribuo.impl.ArrayExample
import org.tribuo.math.distance.DistanceType
import org.tribuo.math.neighbour.NeighboursQueryFactoryType
import org.tribuo.provenance.SimpleDataSourceProvenance
import java.time.Duration
import org.springframework.stereotype.Component

@Component
class ClusteringJob(
    private val embeddingService: EmbeddingService,
    private val clusterLabellingService: ClusterLabellingService,
    private val clusterService: ClusterService,
) {
    private val log = LoggerFactory.getLogger(ClusteringJob::class.java)

    companion object {
        private const val MIN_CLUSTER_SIZE = 3
        private const val INITIAL_K = 5
        private const val WINDOW_HOURS = 24L
        private const val LABEL_SAMPLE_SIZE = 10
        private const val OUTLIER_CLUSTER_ID = -1 // Tribuo outlier ID
        private val FACTORY = ClusteringFactory()
        private val MISC_LABEL = ClusterLabel("Miscellaneous", "Various news articles from this period.")
        private val labelRetry: RetryPolicy<ClusterLabel> =
            RetryPolicy
                .builder<ClusterLabel>()
                .handle(Exception::class.java)
                .withDelay(Duration.ofSeconds(2))
                .withMaxRetries(2)
                .build()
        private val labelFallback: Fallback<ClusterLabel> =
            Fallback
                .builder(MISC_LABEL)
                .build()
    }

    @Scheduled(cron = "0 0 * * * *") // top of every hour
    fun run() {
        val start = System.currentTimeMillis()
        val items = embeddingService.loadWindow(WINDOW_HOURS)

        if (items.size < MIN_CLUSTER_SIZE * 2) {
            log.info("[clustering] only {} items in window — skipping", items.size)
            return
        }

        val trainer =
            HdbscanTrainer(
                MIN_CLUSTER_SIZE,
                DistanceType.L2.distance,
                INITIAL_K,
                1,
                NeighboursQueryFactoryType.BRUTE_FORCE,
            )

        val examples =
            items.map { row ->
                val featureNames = Array(row.vector.size) { i -> "f$i" }
                val featureValues = DoubleArray(row.vector.size) { i -> row.vector[i].toDouble() }
                ArrayExample(ClusteringFactory.UNASSIGNED_CLUSTER_ID, featureNames, featureValues)
            }
        val dataSource = ListDataSource(examples, FACTORY, SimpleDataSourceProvenance("feed-items", FACTORY))
        val dataset = MutableDataset(dataSource)

        val assignments: List<Int> = trainer.train(dataset).clusterLabels

        val groups = mutableMapOf<Int, MutableList<Int>>()
        var outlierCount = 0
        assignments.forEachIndexed { idx, clusterId ->
            if (clusterId == OUTLIER_CLUSTER_ID) {
                outlierCount++
            } else {
                groups.getOrPut(clusterId) { mutableListOf() } += idx
            }
        }

        log.info(
            "[clustering] HDBSCAN: {} clusters, {} outliers, {} total items",
            groups.size,
            outlierCount,
            items.size,
        )

        val windowStart = items.minOf { it.publishedAt }
        val windowEnd = items.maxOf { it.publishedAt }

        val pendingClusters =
            groups.values.mapNotNull { indices ->
                runCatching {
                    val sorted = indices.sortedByDescending { items[it].publishedAt }
                    val sample = sorted.take(LABEL_SAMPLE_SIZE).map { items[it].aiSummary }
                    val label =
                        Failsafe
                            .with(labelFallback, labelRetry)
                            .get(CheckedSupplier { clusterLabellingService.label(sample) })
                    val itemIds = sorted.map { items[it].feedItemId }
                    NewCluster(
                        label = label.label,
                        summary = label.summary,
                        articleCount = itemIds.size,
                        windowStart = windowStart,
                        windowEnd = windowEnd,
                        feedItemIds = itemIds,
                    )
                }.onFailure { log.error("[clustering] labelling failed: {}", it.message) }
                    .getOrNull()
            }

        clusterService.promoteAll(pendingClusters)

        log.info(
            "[clustering] done in {}ms — {} clusters active",
            System.currentTimeMillis() - start,
            pendingClusters.size,
        )
    }
}
