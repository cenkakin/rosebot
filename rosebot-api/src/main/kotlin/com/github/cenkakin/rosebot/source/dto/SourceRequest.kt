package com.github.cenkakin.rosebot.source.dto

import com.github.cenkakin.rosebot.source.SourceType

data class SourceRequest(
    val type: SourceType,
    val name: String,
    val url: String,
)
