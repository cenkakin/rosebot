package com.github.cenkakin.rosebot.feed

import jooq.tables.references.FEED_ITEM
import jooq.tables.references.SAVED_ITEM
import jooq.tables.references.SOURCE
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.SelectOnConditionStep

/**
 * Shared query builder for feed item queries with SOURCE and SAVED_ITEM joins.
 * Provides a consistent base query that can be extended with additional conditions.
 */
object FeedItemQueryBuilder {
    /**
     * Creates a base SELECT query for feed items with:
     * - All FEED_ITEM columns
     * - SOURCE.TYPE, SOURCE.NAME, SOURCE.HOMEPAGE
     * - "saved" boolean flag based on SAVED_ITEM existence
     * - Optional "savedAt" timestamp
     *
     * @param dsl The DSL context
     * @param userId The user ID for saved item lookup
     * @param includeSavedAt Whether to include the savedAt timestamp in the result
     * @return A SelectOnConditionStep that can be extended with WHERE, ORDER BY, etc.
     */
    fun baseQuery(
        dsl: DSLContext,
        userId: Long,
        includeSavedAt: Boolean = false,
    ): SelectOnConditionStep<Record> {
        val fields =
            mutableListOf(
                FEED_ITEM.asterisk(),
                SOURCE.TYPE,
                SOURCE.NAME,
                SOURCE.HOMEPAGE,
                SAVED_ITEM.ID.isNotNull.`as`("saved"),
            )
        if (includeSavedAt) {
            fields.add(SAVED_ITEM.SAVED_AT.`as`("savedAt"))
        }

        return dsl
            .select(fields)
            .from(FEED_ITEM)
            .join(SOURCE)
            .on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
            .leftJoin(SAVED_ITEM)
            .on(
                SAVED_ITEM.FEED_ITEM_ID
                    .eq(FEED_ITEM.ID)
                    .and(SAVED_ITEM.USER_ID.eq(userId)),
            )
    }
}
