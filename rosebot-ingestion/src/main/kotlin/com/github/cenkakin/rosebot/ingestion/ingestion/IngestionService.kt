package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.source.SourceService
import com.github.cenkakin.rosebot.source.SourceType
import jooq.tables.Source
import jooq.tables.records.SourceRecord
import org.slf4j.LoggerFactory

class IngestionService(
    private val sourceService: SourceService,
    private val feedItemIngestionService: FeedItemIngestionService,
    private val connectors: List<SourceConnector>,
) {
    private val log = LoggerFactory.getLogger(IngestionService::class.java)

    fun pollAll() {
        sourceService
            .findAllEnabled()
            .ingest()
    }

    fun ingest(sourceType: SourceType) {
        sourceService
            .findEnabledBySourceType(sourceType)
            .ingest()
    }

    private fun List<SourceRecord>.ingest() {
        forEach { source ->
            runCatching { ingest(source) }
                .onFailure { log.error("[ingestion] source={} failed: {}", source.name, it.message, it) }
        }
    }

    private fun ingest(source: SourceRecord) {
        val connector =
            connectors.find { it.type.name == source.type!!.literal }
                ?: run {
                    log.warn("[ingestion] no connector for source type={}", source.type!!.literal)
                    return
                }

        val start = System.currentTimeMillis()
        val drafts = connector.fetch(source)
        var newCount = 0
        var dupeCount = 0

        drafts.forEach { draft ->
            if (feedItemIngestionService.ingest(source.id!!, draft)) newCount++ else dupeCount++
        }

        log.info(
            "[ingestion] source={} new={} dupes={} duration={}ms",
            source.name,
            newCount,
            dupeCount,
            System.currentTimeMillis() - start,
        )
    }
}
