package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.content.ContentService
import com.github.cenkakin.rosebot.content.dto.ContentResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/content")
class ContentController(private val service: ContentService) {

    @GetMapping("/{feedItemId}")
    fun get(
        @PathVariable feedItemId: Long,
    ): ContentResponse = service.get(feedItemId)

    @GetMapping("/batch")
    fun getBatch(
        @RequestParam itemIds: List<Long>,
    ): List<Long> {
        require(itemIds.size <= 50) { "itemIds must not exceed 50" }
        return service.getExistingIds(itemIds)
    }
}
