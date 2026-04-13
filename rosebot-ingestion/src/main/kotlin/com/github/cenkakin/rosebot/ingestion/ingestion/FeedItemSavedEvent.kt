package com.github.cenkakin.rosebot.ingestion.ingestion

data class FeedItemSavedEvent(
    val feedItemId: Long,
    val title: String,
    val content: String?,
    val snippet: String?,
)