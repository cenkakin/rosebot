package com.github.cenkakin.rosebot.feed

import com.github.cenkakin.rosebot.source.SourceType
import java.time.OffsetDateTime
import jooq.tables.records.FeedItemRecord
import jooq.tables.references.FEED_ITEM
import jooq.tables.references.FEED_ITEM_CONTENT
import jooq.tables.references.SOURCE
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL

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
        FeedItemQueryBuilder
            .baseQuery(dsl, userId)
            .where(
                DSL
                    .noCondition()
                    .and(before?.let { FEED_ITEM.PUBLISHED_AT.lt(it) } ?: DSL.noCondition())
                    .and(sourceId?.let { FEED_ITEM.SOURCE_ID.eq(it) } ?: DSL.noCondition())
                    .and(type?.let { SOURCE.TYPE.eq(it.toJooqEnum()) } ?: DSL.noCondition()),
            ).orderBy(FEED_ITEM.PUBLISHED_AT.desc())
            .limit(limit)
            .fetch()

    fun findByIdForUser(
        userId: Long,
        id: Long,
    ): Record? =
        FeedItemQueryBuilder
            .baseQuery(dsl, userId)
            .where(FEED_ITEM.ID.eq(id))
            .fetchOne()

    fun insert(record: FeedItemRecord): FeedItemRecord? =
        dsl
            .insertInto(FEED_ITEM)
            .set(record)
            .onConflict(FEED_ITEM.SOURCE_ID, FEED_ITEM.EXTERNAL_ID)
            .doNothing()
            .returning()
            .fetchOne()

    fun findUndetected(limit: Int): List<FeedItemForSummarisation> =
        dsl
            .select(FEED_ITEM.ID, FEED_ITEM.TITLE, FEED_ITEM.SUMMARY, FEED_ITEM_CONTENT.CONTENT)
            .from(FEED_ITEM)
            .leftJoin(FEED_ITEM_CONTENT)
            .on(FEED_ITEM_CONTENT.FEED_ITEM_ID.eq(FEED_ITEM.ID))
            .where(FEED_ITEM.LANGUAGE.isNull)
            .orderBy(FEED_ITEM.INGESTED_AT.asc())
            .limit(limit)
            .fetch()
            .map { r ->
                FeedItemForSummarisation(
                    id = r.get(FEED_ITEM.ID)!!,
                    title = r.get(FEED_ITEM.TITLE)!!,
                    snippet = r.get(FEED_ITEM.SUMMARY),
                    content = r.get(FEED_ITEM_CONTENT.CONTENT),
                    language = null,
                )
            }

    fun findUnsummarised(limit: Int): List<FeedItemForSummarisation> =
        dsl
            .select(FEED_ITEM.ID, FEED_ITEM.TITLE, FEED_ITEM.SUMMARY, FEED_ITEM.LANGUAGE, FEED_ITEM_CONTENT.CONTENT)
            .from(FEED_ITEM)
            .leftJoin(FEED_ITEM_CONTENT)
            .on(FEED_ITEM_CONTENT.FEED_ITEM_ID.eq(FEED_ITEM.ID))
            .where(FEED_ITEM.AI_SUMMARY.isNull.and(FEED_ITEM.LANGUAGE.isNotNull))
            .orderBy(FEED_ITEM.INGESTED_AT.asc())
            .limit(limit)
            .fetch()
            .map { r ->
                FeedItemForSummarisation(
                    id = r.get(FEED_ITEM.ID)!!,
                    title = r.get(FEED_ITEM.TITLE)!!,
                    snippet = r.get(FEED_ITEM.SUMMARY),
                    content = r.get(FEED_ITEM_CONTENT.CONTENT),
                    language = r.get(FEED_ITEM.LANGUAGE),
                )
            }

    fun saveLanguage(
        feedItemId: Long,
        language: String,
    ) {
        dsl
            .update(FEED_ITEM)
            .set(FEED_ITEM.LANGUAGE, language)
            .where(FEED_ITEM.ID.eq(feedItemId))
            .execute()
    }

    fun saveAiSummary(
        feedItemId: Long,
        aiSummary: String,
    ) {
        dsl
            .update(FEED_ITEM)
            .set(FEED_ITEM.AI_SUMMARY, aiSummary)
            .where(FEED_ITEM.ID.eq(feedItemId))
            .execute()
    }

    private fun SourceType.toJooqEnum(): jooq.enums.SourceType = jooq.enums.SourceType.valueOf(name)
}
