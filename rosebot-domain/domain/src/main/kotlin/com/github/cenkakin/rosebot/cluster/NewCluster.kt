package com.github.cenkakin.rosebot.cluster

import java.time.OffsetDateTime

data class NewCluster(
    val label: String,
    val summary: String,
    val articleCount: Int,
    val windowStart: OffsetDateTime,
    val windowEnd: OffsetDateTime,
    val feedItemIds: List<Long>,
)
