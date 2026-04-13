package com.github.cenkakin.rosebot.user

data class User(
    val id: Long,
    val email: String,
    val passwordHash: String,
)
