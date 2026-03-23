package com.github.cenkakin.rosebot.auth

import org.springframework.security.core.context.SecurityContext

data class AuthenticatedUser(
    val id: Long,
    val email: String,
)

fun SecurityContext.currentUser(): AuthenticatedUser = authentication!!.principal as AuthenticatedUser
