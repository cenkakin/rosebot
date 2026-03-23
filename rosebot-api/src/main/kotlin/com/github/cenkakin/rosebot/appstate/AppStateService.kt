package com.github.cenkakin.rosebot.appstate

import com.github.cenkakin.rosebot.appstate.dto.AppStateResponse
import java.time.OffsetDateTime

class AppStateService(
    private val appStateRepository: AppStateRepository,
) {
    fun get(userId: Long): AppStateResponse =
        AppStateResponse(lastVisitedAt = appStateRepository.findByUser(userId)?.toInstant()?.toString())

    fun markVisited(userId: Long): AppStateResponse {
        val now = OffsetDateTime.now()
        appStateRepository.upsertVisited(userId, now)
        return AppStateResponse(lastVisitedAt = now.toInstant().toString())
    }
}
