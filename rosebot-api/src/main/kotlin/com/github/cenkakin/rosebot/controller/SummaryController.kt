package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.summary.SummaryService
import com.github.cenkakin.rosebot.summary.dto.SummaryResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/summaries")
class SummaryController(
    private val service: SummaryService,
) {
    @GetMapping("/{feedItemId}")
    fun get(
        @PathVariable feedItemId: Long,
    ): SummaryResponse = service.get(feedItemId)
}
