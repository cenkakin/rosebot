package com.github.cenkakin.rosebot.saved

import jooq.Tables.FEED_ITEM
import jooq.Tables.SAVED_ITEM
import jooq.Tables.SOURCE
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL
import java.time.OffsetDateTime

class SavedItemRepository(
    private val dsl: DSLContext,
) {
    fun findByUser(
        userId: Long,
        before: OffsetDateTime?,
        limit: Int,
    ): List<Record> =
        dsl
            .select(
                FEED_ITEM.asterisk(),
                SOURCE.TYPE,
                SOURCE.NAME,
                DSL.inline(true).`as`("saved"),
            ).from(SAVED_ITEM)
            .join(FEED_ITEM)
            .on(FEED_ITEM.ID.eq(SAVED_ITEM.FEED_ITEM_ID))
            .join(SOURCE)
            .on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
            .where(SAVED_ITEM.USER_ID.eq(userId))
            .and(before?.let { SAVED_ITEM.SAVED_AT.lt(it) } ?: DSL.noCondition())
            .orderBy(SAVED_ITEM.SAVED_AT.desc())
            .limit(limit)
            .fetch()

    fun save(
        userId: Long,
        feedItemId: Long,
    ) = dsl
        .insertInto(SAVED_ITEM)
        .set(SAVED_ITEM.USER_ID, userId)
        .set(SAVED_ITEM.FEED_ITEM_ID, feedItemId)
        .onConflictDoNothing()
        .execute()

    fun delete(
        userId: Long,
        feedItemId: Long,
    ): Boolean =
        dsl
            .deleteFrom(SAVED_ITEM)
            .where(
                SAVED_ITEM.USER_ID
                    .eq(userId)
                    .and(SAVED_ITEM.FEED_ITEM_ID.eq(feedItemId)),
            ).execute() > 0
}
