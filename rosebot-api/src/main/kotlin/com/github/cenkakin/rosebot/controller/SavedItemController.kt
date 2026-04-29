package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.auth.AuthenticatedUser
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.saved.SavedItemService
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/saved")
class SavedItemController(
    private val service: SavedItemService,
) {
    @GetMapping
    fun getSaved(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(required = false) sourceId: Long?,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) language: String?,
        @RequestParam(required = false) category: String?,
    ): List<FeedItemResponse> = service.getSaved(user.id, before, limit.coerceAtMost(50), sourceId, type, language, category)

    @GetMapping("/sources")
    fun getSavedSources(
        @AuthenticationPrincipal user: AuthenticatedUser,
    ): List<SourceResponse> = service.getSavedSources(user.id)

    @PostMapping("/{feedItemId}")
    @ResponseStatus(HttpStatus.CREATED)
    fun save(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable feedItemId: Long,
    ) = service.save(user.id, feedItemId)

    @DeleteMapping("/{feedItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unsave(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable feedItemId: Long,
    ) = service.unsave(user.id, feedItemId)
}
