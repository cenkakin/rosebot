package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.feed.FeedService
import org.slf4j.LoggerFactory
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
    fun onLanguageDetected(event: LanguageDetectedEvent) {
        runCatching {
            val summary =
                summarisationService.resolveWithKnownLanguage(
                    event.language,
                    event.title,
                    event.snippet,
                    event.content,
                )
            feedService.saveAiSummary(event.feedItemId, summary)
        }.onFailure {
            log.warn("[summarisation] feedItemId={} failed: {}", event.feedItemId, it.message)
            // Recovery handled by SummarisationJob
        }
    }
}
