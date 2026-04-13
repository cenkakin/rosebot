package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.feed.FeedService
import java.util.concurrent.TimeUnit
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class SummarisationJob(
    private val summarisationService: SummarisationService,
    private val feedService: FeedService,
) {
    private val log = LoggerFactory.getLogger(SummarisationJob::class.java)

    @Scheduled(timeUnit = TimeUnit.MINUTES, fixedDelay = 2L)
    fun recover() {
        val pending = feedService.findUnsummarised(limit = 10)
        if (pending.isEmpty()) return

        log.info("[summarisation-job] processing {} items", pending.size)
        pending.forEach { item ->
            runCatching {
                val summary =
                    summarisationService.resolveWithKnownLanguage(
                        item.language ?: LanguageDetector.UNDETERMINED,
                        item.title,
                        item.snippet,
                        item.content,
                    )
                feedService.saveAiSummary(item.id, summary)
            }.onFailure {
                log.error("[summarisation-job] feedItemId={} failed: {}", item.id, it.message)
            }
        }
    }
}
