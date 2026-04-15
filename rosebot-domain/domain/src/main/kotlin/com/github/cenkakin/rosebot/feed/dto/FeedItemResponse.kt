package com.github.cenkakin.rosebot.feed.dto

data class FeedItemResponse(
    val id: Long,
    val sourceId: Long,
    val sourceType: String,
    val sourceName: String,
    val sourceUrl: String,
    val title: String,
    val summary: String?,
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: String,
    val language: String?,
    val category: String?,
    val saved: Boolean,
    val savedAt: String?,
)
