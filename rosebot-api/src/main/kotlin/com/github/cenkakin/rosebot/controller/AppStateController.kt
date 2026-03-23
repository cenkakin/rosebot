package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.appstate.AppStateService
import com.github.cenkakin.rosebot.appstate.dto.AppStateResponse
import com.github.cenkakin.rosebot.auth.AuthenticatedUser
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/app-state")
class AppStateController(
    private val service: AppStateService,
) {
    @GetMapping
    fun get(
        @AuthenticationPrincipal user: AuthenticatedUser,
    ): AppStateResponse = service.get(user.id)

    @PutMapping("/visited")
    fun markVisited(
        @AuthenticationPrincipal user: AuthenticatedUser,
    ): AppStateResponse = service.markVisited(user.id)
}
