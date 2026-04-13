package com.github.cenkakin.rosebot.ingestion.ai.embedding

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

@Component
class EmbeddingJob(
    private val embeddingService: EmbeddingService,
) {
    private val log = LoggerFactory.getLogger(EmbeddingJob::class.java)

    @Scheduled(timeUnit = TimeUnit.MINUTES, fixedDelay = 2L)
    fun recover() {
        val pending = embeddingService.findUnembedded(limit = 20)
        if (pending.isEmpty()) return

        log.info("[embedding-job] processing {} items", pending.size)
        pending.forEach { item ->
            runCatching {
                embeddingService.embedAndSave(item.feedItemId, item.aiSummary)
            }.onFailure {
                log.error("[embedding-job] feedItemId={} failed: {}", item.feedItemId, it.message)
            }
        }
    }
}
