package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.auth.AuthenticatedUser
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/feed")
class FeedController(
    private val service: FeedService,
) {
    @GetMapping
    fun getFeed(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(required = false) sourceId: Long?,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) language: String?,
        @RequestParam(required = false) category: String?,
    ): List<FeedItemResponse> = service.getFeed(user.id, before, limit.coerceAtMost(50), sourceId, type, language, category)

    @GetMapping("/languages")
    fun getLanguages(): List<String> = service.getLanguages()

    @GetMapping("/{id}")
    fun getOne(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: Long,
    ): FeedItemResponse = service.getById(user.id, id)
}
