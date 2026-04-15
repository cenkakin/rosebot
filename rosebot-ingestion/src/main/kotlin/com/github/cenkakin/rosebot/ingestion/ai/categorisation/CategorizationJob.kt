package com.github.cenkakin.rosebot.ingestion.ai.categorisation

import com.github.cenkakin.rosebot.feed.FeedService
import java.util.concurrent.TimeUnit
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class CategorizationJob(
    private val categorizationService: CategorizationService,
    private val feedService: FeedService,
) {
    private val log = LoggerFactory.getLogger(CategorizationJob::class.java)

    @Scheduled(timeUnit = TimeUnit.MINUTES, fixedDelay = 3L)
    fun recover() {
        val pending = feedService.findUncategorised(limit = 10)
        if (pending.isEmpty()) return

        log.info("[categorisation-job] processing {} items", pending.size)
        pending.forEach { item ->
            runCatching {
                val category = categorizationService.classify(item.aiSummary)
                if (category != null) {
                    feedService.saveCategory(item.id, category)
                }
            }.onFailure {
                log.error("[categorisation-job] feedItemId={} failed: {}", item.id, it.message)
            }
        }
    }
}
