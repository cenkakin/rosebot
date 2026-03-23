package com.github.cenkakin.rosebot.controller

import com.github.cenkakin.rosebot.auth.AuthService
import com.github.cenkakin.rosebot.auth.dto.AuthResponse
import com.github.cenkakin.rosebot.auth.dto.LoginRequest
import com.github.cenkakin.rosebot.auth.dto.RegisterRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(
        @RequestBody request: RegisterRequest,
    ): AuthResponse = authService.register(request)

    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest,
    ): AuthResponse = authService.login(request)
}
