package com.github.cenkakin.rosebot.source.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UpdateSourceRequest(
    @field:NotBlank
    @field:Size(max = 128)
    val name: String,
    val enabled: Boolean,
)
