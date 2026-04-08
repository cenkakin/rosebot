package com.github.cenkakin.rosebot.source.dto

import com.github.cenkakin.rosebot.source.SourceType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SourceRequest(
    val type: SourceType,
    @field:NotBlank
    @field:Size(max = 128)
    val name: String,
    @field:NotBlank
    @field:Size(max = 2048)
    val url: String,
    @field:NotBlank
    @field:Size(max = 2048)
    val homepage: String,
)
