package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.auth.AuthenticatedUser
import com.github.cenkakin.rosebot.cluster.ClusterService
import com.github.cenkakin.rosebot.cluster.dto.ClusterItemsResponse
import com.github.cenkakin.rosebot.cluster.dto.ClusterMetaResponse
import com.github.cenkakin.rosebot.cluster.dto.ClusterResponse
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clusters")
class ClusterController(
    private val service: ClusterService,
) {
    @GetMapping
    fun listActive(): List<ClusterResponse> = service.getActiveClusters()

    @GetMapping("/{id}/items")
    fun getItems(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: Long,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int,
    ): ClusterItemsResponse = service.getClusterItems(id, user.id, before, limit.coerceAtMost(50))

    @GetMapping("/just-in")
    fun getJustIn(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestParam(required = false) before: String?,
        @RequestParam(defaultValue = "20") limit: Int,
    ): ClusterItemsResponse = service.getJustIn(user.id, before, limit.coerceAtMost(50))

    @GetMapping("/meta")
    fun getMeta(): ClusterMetaResponse = service.getMeta()
}
