package com.github.cenkakin.rosebot.source

import java.time.OffsetDateTime

data class Source(
    val id: Long,
    val type: SourceType,
    val name: String,
    val url: String,
    val homepage: String,
    val enabled: Boolean,
    val createdAt: OffsetDateTime,
)
