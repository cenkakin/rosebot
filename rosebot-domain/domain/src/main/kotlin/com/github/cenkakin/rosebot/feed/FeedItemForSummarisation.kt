package com.github.cenkakin.rosebot.feed

data class FeedItemForSummarisation(
    val id: Long,
    val title: String,
    val snippet: String?,
    val content: String?,
    val language: String?, // null for findUndetected results; populated for findUnsummarised
)
