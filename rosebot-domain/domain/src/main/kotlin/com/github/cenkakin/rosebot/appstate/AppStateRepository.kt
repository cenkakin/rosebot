package com.github.cenkakin.rosebot.appstate

import jooq.tables.references.APP_STATE
import org.jooq.DSLContext
import java.time.OffsetDateTime

class AppStateRepository(
    private val dsl: DSLContext,
) {
    fun findByUser(userId: Long): OffsetDateTime? =
        dsl
            .selectFrom(APP_STATE)
            .where(APP_STATE.USER_ID.eq(userId))
            .fetchOne()
            ?.lastVisitedAt

    fun upsertVisited(
        userId: Long,
        now: OffsetDateTime,
    ) {
        dsl
            .insertInto(APP_STATE)
            .set(APP_STATE.USER_ID, userId)
            .set(APP_STATE.LAST_VISITED_AT, now)
            .set(APP_STATE.UPDATED_AT, now)
            .onConflict(APP_STATE.USER_ID)
            .doUpdate()
            .set(APP_STATE.LAST_VISITED_AT, now)
            .set(APP_STATE.UPDATED_AT, now)
            .execute()
    }
}
