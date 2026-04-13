package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.feed.FeedService
import java.util.concurrent.TimeUnit
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class LanguageDetectionJob(
    private val languageDetector: LanguageDetector,
    private val feedService: FeedService,
) {
    private val log = LoggerFactory.getLogger(LanguageDetectionJob::class.java)

    @Scheduled(timeUnit = TimeUnit.MINUTES, fixedDelay = 2L)
    fun recover() {
        val undetected = feedService.findUndetected(limit = 10)
        if (undetected.isEmpty()) return

        log.info("[language-detection-job] processing {} items", undetected.size)
        undetected.forEach { item ->
            runCatching {
                val text = item.snippet ?: item.content ?: item.title
                val language = languageDetector.detectLanguage(text)
                feedService.saveLanguage(item.id, language)
            }.onFailure {
                log.error("[language-detection-job] feedItemId={} failed: {}", item.id, it.message)
            }
        }
    }
}
