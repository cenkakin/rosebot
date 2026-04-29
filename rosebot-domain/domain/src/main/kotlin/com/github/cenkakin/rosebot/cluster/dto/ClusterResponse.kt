package com.github.cenkakin.rosebot.cluster.dto

import java.time.OffsetDateTime

data class ClusterResponse(
    val id: Long,
    val label: String,
    val summary: String,
    val articleCount: Int,
    val windowStart: OffsetDateTime,
    val windowEnd: OffsetDateTime,
    val sourceMix: Map<String, Int>,
    val category: String?,
    val languages: List<String>,
)
