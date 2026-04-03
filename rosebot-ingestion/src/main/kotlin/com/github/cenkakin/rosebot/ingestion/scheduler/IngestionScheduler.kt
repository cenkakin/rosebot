package com.github.cenkakin.rosebot.ingestion.scheduler

import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import org.springframework.scheduling.annotation.Scheduled
import java.util.concurrent.TimeUnit

class IngestionScheduler(
    private val ingestionService: IngestionService,
) {
    @Scheduled(timeUnit = TimeUnit.HOURS, fixedDelay = 1L)
    fun pollAll() {
        ingestionService.pollAll()
    }
}
