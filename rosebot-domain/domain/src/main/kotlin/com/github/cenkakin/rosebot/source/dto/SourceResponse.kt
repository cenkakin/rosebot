package com.github.cenkakin.rosebot.source.dto

data class SourceResponse(
    val id: Long,
    val type: String,
    val name: String,
    val url: String,
    val homepage: String,
    val enabled: Boolean,
    val createdAt: String,
)
