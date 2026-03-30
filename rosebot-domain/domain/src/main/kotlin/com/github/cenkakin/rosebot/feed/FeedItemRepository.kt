package com.github.cenkakin.rosebot.feed

import com.github.cenkakin.rosebot.source.SourceType
import jooq.Tables.FEED_ITEM
import jooq.Tables.SAVED_ITEM
import jooq.Tables.SOURCE
import org.jooq.DSLContext
import org.jooq.Record
import java.time.OffsetDateTime

class FeedItemRepository(
    private val dsl: DSLContext,
) {
    fun findFeed(
        userId: Long,
        before: OffsetDateTime?,
        limit: Int,
        sourceId: Long?,
        type: SourceType?,
    ): List<Record> =
        dsl
            .select(
                FEED_ITEM.asterisk(),
                SOURCE.TYPE,
                SOURCE.NAME,
                SAVED_ITEM.ID.isNotNull.`as`("saved"),
            ).from(FEED_ITEM)
            .join(SOURCE)
            .on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
            .leftJoin(SAVED_ITEM)
            .on(
                SAVED_ITEM.FEED_ITEM_ID
                    .eq(FEED_ITEM.ID)
                    .and(SAVED_ITEM.USER_ID.eq(userId)),
            ).where(
                org.jooq.impl.DSL
                    .noCondition()
                    .and(
                        before?.let { FEED_ITEM.PUBLISHED_AT.lt(it) } ?: org.jooq.impl.DSL
                            .noCondition(),
                    ).and(
                        sourceId?.let { FEED_ITEM.SOURCE_ID.eq(it) } ?: org.jooq.impl.DSL
                            .noCondition(),
                    ).and(
                        type?.let { SOURCE.TYPE.eq(it.toJooqEnum()) } ?: org.jooq.impl.DSL
                            .noCondition(),
                    ),
            ).orderBy(FEED_ITEM.PUBLISHED_AT.desc())
            .limit(limit)
            .fetch()

    fun findByIdForUser(
        userId: Long,
        id: Long,
    ): Record? =
        dsl
            .select(
                FEED_ITEM.asterisk(),
                SOURCE.TYPE,
                SOURCE.NAME,
                SAVED_ITEM.ID.isNotNull.`as`("saved"),
            ).from(FEED_ITEM)
            .join(SOURCE)
            .on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
            .leftJoin(SAVED_ITEM)
            .on(
                SAVED_ITEM.FEED_ITEM_ID
                    .eq(FEED_ITEM.ID)
                    .and(SAVED_ITEM.USER_ID.eq(userId)),
            ).where(FEED_ITEM.ID.eq(id))
            .fetchOne()

    private fun SourceType.toJooqEnum(): jooq.enums.SourceType = jooq.enums.SourceType.valueOf(name)
}
