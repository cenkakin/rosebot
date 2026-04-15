package com.github.cenkakin.rosebot.ingestion.ai.categorisation

import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.feed.SummaryCreatedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component

@Component
class CategorizationListener(
    private val categorizationService: CategorizationService,
    private val feedService: FeedService,
) {
    private val log = LoggerFactory.getLogger(CategorizationListener::class.java)

    @Async
    @EventListener
    fun onSummaryCreated(event: SummaryCreatedEvent) {
        runCatching {
            val category = categorizationService.classify(event.aiSummary)
            if (category != null) {
                feedService.saveCategory(event.feedItemId, category)
            }
        }.onFailure {
            log.warn("[categorisation] feedItemId={} failed: {}", event.feedItemId, it.message)
            // Recovery handled by CategorizationJob
        }
    }
}
