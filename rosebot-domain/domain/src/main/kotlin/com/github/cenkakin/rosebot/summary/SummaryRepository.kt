package com.github.cenkakin.rosebot.summary

import jooq.tables.records.SummaryRecord
import jooq.tables.references.SUMMARY
import org.jooq.DSLContext

class SummaryRepository(
    private val dsl: DSLContext,
) {
    fun findByFeedItem(feedItemId: Long): SummaryRecord? =
        dsl
            .selectFrom(SUMMARY)
            .where(SUMMARY.FEED_ITEM_ID.eq(feedItemId))
            .fetchOne()

    fun findByFeedItemIds(ids: List<Long>): List<SummaryRecord> {
        if (ids.isEmpty()) return emptyList()
        return dsl
            .selectFrom(SUMMARY)
            .where(SUMMARY.FEED_ITEM_ID.`in`(ids))
            .fetch()
    }

    fun insert(
        feedItemId: Long,
        content: String,
    ) {
        dsl
            .insertInto(SUMMARY)
            .set(SUMMARY.FEED_ITEM_ID, feedItemId)
            .set(SUMMARY.CONTENT, content)
            .onConflict(SUMMARY.FEED_ITEM_ID)
            .doNothing()
            .execute()
    }
}
