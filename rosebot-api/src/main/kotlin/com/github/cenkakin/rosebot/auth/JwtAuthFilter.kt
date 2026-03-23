package com.github.cenkakin.rosebot.auth

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthFilter(
    private val jwtService: JwtService,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val token =
            request
                .getHeader("Authorization")
                ?.takeIf { it.startsWith("Bearer ") }
                ?.substring(7)

        if (token != null && jwtService.isValid(token)) {
            val auth =
                UsernamePasswordAuthenticationToken(
                    AuthenticatedUser(jwtService.extractUserId(token), jwtService.extractEmail(token)),
                    null,
                    emptyList(),
                )
            SecurityContextHolder.getContext().authentication = auth
        }

        chain.doFilter(request, response)
    }
}
