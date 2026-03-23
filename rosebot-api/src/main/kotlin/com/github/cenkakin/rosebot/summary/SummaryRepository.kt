package com.github.cenkakin.rosebot.summary

import jooq.Tables.SUMMARY
import jooq.tables.records.SummaryRecord
import org.jooq.DSLContext

class SummaryRepository(
    private val dsl: DSLContext,
) {
    fun findByFeedItem(feedItemId: Long): SummaryRecord? =
        dsl
            .selectFrom(SUMMARY)
            .where(SUMMARY.FEED_ITEM_ID.eq(feedItemId))
            .fetchOne()
}
