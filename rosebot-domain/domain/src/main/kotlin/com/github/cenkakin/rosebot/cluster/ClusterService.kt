package com.github.cenkakin.rosebot.cluster

import com.github.cenkakin.rosebot.cluster.dto.ClusterItemsResponse
import com.github.cenkakin.rosebot.cluster.dto.ClusterMetaResponse
import com.github.cenkakin.rosebot.cluster.dto.ClusterResponse
import com.github.cenkakin.rosebot.feed.toFeedItemResponse
import jooq.tables.references.CLUSTER
import jooq.tables.references.FEED_ITEM
import jooq.tables.references.SAVED_ITEM
import jooq.tables.references.SOURCE
import org.jooq.Record
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Transactional
class ClusterService(
    private val clusterRepository: ClusterRepository,
) {
    fun getActiveClusters(category: String?): List<ClusterResponse> {
        val records = clusterRepository.findActive()
        return records
            .groupBy { it.get(CLUSTER.ID)!! }
            .map { (_, rows) ->
                val first = rows.first()
                val sourceMix = rows.mapNotNull { it.get(SOURCE.TYPE)?.literal }.groupingBy { it }.eachCount()
                val languages = rows.mapNotNull { it.get(FEED_ITEM.LANGUAGE) }.distinct()
                val dominantCategory = rows.mapNotNull { it.get(FEED_ITEM.CATEGORY)?.literal }
                    .groupingBy { it }.eachCount().maxByOrNull { it.value }?.key
                ClusterResponse(
                    id = first.get(CLUSTER.ID)!!,
                    label = first.get(CLUSTER.LABEL)!!,
                    summary = first.get(CLUSTER.SUMMARY)!!,
                    articleCount = first.get(CLUSTER.ARTICLE_COUNT)!!,
                    windowStart = first.get(CLUSTER.WINDOW_START)!!,
                    windowEnd = first.get(CLUSTER.WINDOW_END)!!,
                    sourceMix = sourceMix,
                    category = dominantCategory,
                    languages = languages,
                )
            }.filter { category == null || it.category == category }
    }

    fun getClusterItems(
        clusterId: Long,
        userId: Long,
        before: String?,
        limit: Int,
    ): ClusterItemsResponse {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        val items =
            clusterRepository
                .findItemsByCluster(clusterId = clusterId, userId = userId, before = beforeDt, after = null, limit = limit)
                .map { it.toClusterItemResponse() }
        return ClusterItemsResponse(items = items)
    }

    fun getJustIn(
        userId: Long,
        before: String?,
        limit: Int,
    ): ClusterItemsResponse {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        val lastClustered = clusterRepository.fetchLastClustered()
        val items =
            clusterRepository
                .findItemsByCluster(clusterId = null, userId = userId, before = beforeDt, after = lastClustered, limit = limit)
                .map { it.toClusterItemResponse() }
        return ClusterItemsResponse(items = items)
    }

    fun getMeta(): ClusterMetaResponse {
        val lastClustered = clusterRepository.fetchLastClustered()
        val justInCount = clusterRepository.fetchJustInCount(lastClustered)
        val since = OffsetDateTime.now().minusHours(24)
        val uncategorisedCount = clusterRepository.fetchUncategorisedCount(since = since, lastClustered = lastClustered)
        return ClusterMetaResponse(
            lastClusteredAt = lastClustered,
            nextClusterAt = lastClustered?.plusHours(1),
            justInCount = justInCount,
            uncategorisedCount = uncategorisedCount,
        )
    }

    fun promoteAll(newClusters: List<NewCluster>) {
        val insertedClusterToFeedItems = clusterRepository.insertPending(newClusters)
        clusterRepository.deactivateActive()
        clusterRepository.activatePending(insertedClusterToFeedItems.keys.toList())
        clusterRepository.assignFeedItems(insertedClusterToFeedItems)
        clusterRepository.deleteInactive()
        clusterRepository.updateLastClustered(timestamp = OffsetDateTime.now())
    }

    private fun Record.toClusterItemResponse() =
        toFeedItemResponse(
            saved = get("saved", Boolean::class.java) ?: false,
            savedAt = get(SAVED_ITEM.SAVED_AT)?.toInstant()?.toString(),
        )
}
