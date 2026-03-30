package com.github.cenkakin.rosebot.summary.dto

data class SummaryResponse(
    val content: String,
    val model: String,
    val generatedAt: String,
)
