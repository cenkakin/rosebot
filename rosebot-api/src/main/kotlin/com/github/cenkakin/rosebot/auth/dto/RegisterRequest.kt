package com.github.cenkakin.rosebot.auth.dto

data class RegisterRequest(
    val email: String,
    val password: String,
)
