package com.github.cenkakin.rosebot.user

// Plain domain object — no JOOQ types leak outside the repository
data class User(
    val id: Long,
    val email: String,
    val passwordHash: String,
)
