package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemSavedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component

@Component
class LanguageDetectionListener(
    private val languageDetector: LanguageDetector,
    private val feedService: FeedService,
    private val eventPublisher: ApplicationEventPublisher,
) {
    private val log = LoggerFactory.getLogger(LanguageDetectionListener::class.java)

    @Async
    @EventListener
    fun onFeedItemSaved(event: FeedItemSavedEvent) {
        runCatching {
            val text = event.snippet ?: event.content ?: event.title
            val language = languageDetector.detectLanguage(text)
            feedService.saveLanguage(event.feedItemId, language)
            eventPublisher.publishEvent(
                LanguageDetectedEvent(event.feedItemId, language, event.title, event.snippet, event.content),
            )
        }.onFailure {
            log.warn("[language-detection] feedItemId={} failed: {}", event.feedItemId, it.message)
            // Recovery handled by LanguageDetectionJob
        }
    }
}
