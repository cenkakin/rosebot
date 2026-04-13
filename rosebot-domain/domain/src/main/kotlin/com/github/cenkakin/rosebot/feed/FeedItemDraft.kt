package com.github.cenkakin.rosebot.feed

import java.time.Instant

data class FeedItemDraft(
    val externalId: String,
    val title: String,
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: Instant,
    val updatedAt: Instant?,
    val summary: String?,
    val content: String?,
)
