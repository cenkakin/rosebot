package com.github.cenkakin.rosebot.auth

import com.github.cenkakin.rosebot.auth.dto.AuthResponse
import com.github.cenkakin.rosebot.auth.dto.LoginRequest
import com.github.cenkakin.rosebot.auth.dto.RegisterRequest
import com.github.cenkakin.rosebot.user.UserService
import org.springframework.security.crypto.password.PasswordEncoder

class AuthService(
    private val userService: UserService,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
) {
    fun register(request: RegisterRequest): AuthResponse {
        if (userService.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already registered")
        }
        val user = userService.create(request.email, passwordEncoder.encode(request.password)!!)
        return AuthResponse(jwtService.generateToken(user.id, user.email))
    }

    fun login(request: LoginRequest): AuthResponse {
        val user =
            userService.findByEmail(request.email)
                ?: throw IllegalArgumentException("Invalid credentials")

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid credentials")
        }
        return AuthResponse(jwtService.generateToken(user.id, user.email))
    }
}
