package com.github.cenkakin.rosebot.ingestion.ai.language

data class LanguageDetectedEvent(
    val feedItemId: Long,
    val language: String, // ISO 639-1 code or "und" — never null
    val title: String,
    val snippet: String?,
    val content: String?,
)
