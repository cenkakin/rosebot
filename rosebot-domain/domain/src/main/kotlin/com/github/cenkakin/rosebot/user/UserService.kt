package com.github.cenkakin.rosebot.user

class UserService(
    private val userRepository: UserRepository,
) {
    fun findByEmail(email: String): User? = userRepository.findByEmail(email)

    fun existsByEmail(email: String): Boolean = userRepository.existsByEmail(email)

    fun create(
        email: String,
        passwordHash: String,
    ): User = userRepository.create(email, passwordHash)
}
