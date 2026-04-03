package com.github.cenkakin.rosebot.user

import jooq.tables.records.UserRecord
import jooq.tables.references.USER
import org.jooq.DSLContext

class UserRepository(
    private val dsl: DSLContext,
) {
    fun findByEmail(email: String): User? =
        dsl
            .selectFrom(USER)
            .where(USER.EMAIL.eq(email))
            .fetchOne()
            ?.toDomain()

    fun existsByEmail(email: String): Boolean = dsl.fetchExists(USER, USER.EMAIL.eq(email))

    fun create(
        email: String,
        passwordHash: String,
    ): User =
        dsl
            .insertInto(USER)
            .set(USER.EMAIL, email)
            .set(USER.PASSWORD_HASH, passwordHash)
            .returning()
            .fetchOne()!!
            .toDomain()

    private fun UserRecord.toDomain() = User(id!!, email!!, passwordHash!!)
}
