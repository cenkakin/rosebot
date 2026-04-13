package com.github.cenkakin.rosebot.ingestion.ai.embedding

import com.github.cenkakin.rosebot.feed.SummaryCreatedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component

@Component
class EmbeddingListener(
    private val embeddingService: EmbeddingService,
) {
    private val log = LoggerFactory.getLogger(EmbeddingListener::class.java)

    @Async
    @EventListener
    fun onSummaryCreated(event: SummaryCreatedEvent) {
        runCatching {
            embeddingService.embedAndSave(event.feedItemId, event.aiSummary)
        }.onFailure {
            log.warn("[embedding] feedItemId={} failed: {}", event.feedItemId, it.message)
        }
    }
}
