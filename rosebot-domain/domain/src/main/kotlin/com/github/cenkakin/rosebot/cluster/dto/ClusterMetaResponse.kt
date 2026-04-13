package com.github.cenkakin.rosebot.cluster.dto

import java.time.OffsetDateTime

data class ClusterMetaResponse(
    val lastClusteredAt: OffsetDateTime?,
    val nextClusterAt: OffsetDateTime?,
    val justInCount: Int,
    val uncategorisedCount: Int,
)
