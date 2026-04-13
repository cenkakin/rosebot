package com.github.cenkakin.rosebot.content

import jooq.tables.references.FEED_ITEM_CONTENT
import org.jooq.DSLContext

class ContentRepository(
    private val dsl: DSLContext,
) {
    fun findByFeedItem(feedItemId: Long): String? =
        dsl
            .select(FEED_ITEM_CONTENT.CONTENT)
            .from(FEED_ITEM_CONTENT)
            .where(FEED_ITEM_CONTENT.FEED_ITEM_ID.eq(feedItemId))
            .fetchOne(FEED_ITEM_CONTENT.CONTENT)

    fun findIdsByFeedItemIds(ids: List<Long>): List<Long> {
        if (ids.isEmpty()) return emptyList()
        return dsl
            .select(FEED_ITEM_CONTENT.FEED_ITEM_ID)
            .from(FEED_ITEM_CONTENT)
            .where(FEED_ITEM_CONTENT.FEED_ITEM_ID.`in`(ids))
            .fetch(FEED_ITEM_CONTENT.FEED_ITEM_ID)
            .filterNotNull()
    }

    fun insert(
        feedItemId: Long,
        content: String,
    ) {
        dsl
            .insertInto(FEED_ITEM_CONTENT)
            .set(FEED_ITEM_CONTENT.FEED_ITEM_ID, feedItemId)
            .set(FEED_ITEM_CONTENT.CONTENT, content)
            .onConflict(FEED_ITEM_CONTENT.FEED_ITEM_ID)
            .doNothing()
            .execute()
    }
}
