package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemSavedEvent
import com.github.cenkakin.rosebot.feed.SummaryCreatedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component

@Component
class SummarisationListener(
    private val summarisationService: SummarisationService,
    private val feedService: FeedService,
) {
    private val log = LoggerFactory.getLogger(SummarisationListener::class.java)

    @Async
    @EventListener
    fun onFeedItemSaved(event: FeedItemSavedEvent) {
        runCatching {
            val aiSummary = summarisationService.resolve(event.title, event.snippet, event.content)
            feedService.saveAiSummary(event.feedItemId, aiSummary)
        }.onFailure {
            log.warn("[summarisation] feedItemId={} failed: {}", event.feedItemId, it.message)
            // Recovery handled by SummarisationJob
        }
    }
}
