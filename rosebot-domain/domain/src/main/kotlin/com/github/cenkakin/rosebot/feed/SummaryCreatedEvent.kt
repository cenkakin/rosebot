package com.github.cenkakin.rosebot.feed

data class SummaryCreatedEvent(
    val feedItemId: Long,
    val aiSummary: String,
)
