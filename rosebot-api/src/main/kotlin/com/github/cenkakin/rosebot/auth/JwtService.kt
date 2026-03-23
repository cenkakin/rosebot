package com.github.cenkakin.rosebot.auth

import com.github.cenkakin.rosebot.config.JwtProperties
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.util.Date
import javax.crypto.SecretKey

class JwtService(
    private val props: JwtProperties,
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(props.secret.toByteArray())
    }

    fun generateToken(
        userId: Long,
        email: String,
    ): String =
        Jwts
            .builder()
            .subject(email)
            .claim("userId", userId)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + props.expirationMs))
            .signWith(key)
            .compact()

    fun extractEmail(token: String): String = parseClaims(token).subject

    fun extractUserId(token: String): Long = (parseClaims(token)["userId"] as Int).toLong()

    fun isValid(token: String): Boolean =
        runCatching {
            parseClaims(token).expiration.after(Date())
        }.getOrDefault(false)

    private fun parseClaims(token: String): Claims =
        Jwts
            .parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
}
