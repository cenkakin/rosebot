package com.github.cenkakin.rosebot.auth.dto

data class LoginRequest(
    val email: String,
    val password: String,
)
