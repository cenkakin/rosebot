package com.github.cenkakin.rosebot.ingestion.ai.embedding

import com.github.cenkakin.rosebot.feed.AISummarisedItem
import jooq.tables.references.EMBEDDING
import jooq.tables.references.FEED_ITEM
import org.jooq.DSLContext
import java.time.OffsetDateTime

class EmbeddingRepository(
    private val dsl: DSLContext,
) {
    fun save(
        feedItemId: Long,
        vector: List<Float>,
        modelName: String,
    ) {
        dsl
            .insertInto(EMBEDDING)
            .set(EMBEDDING.FEED_ITEM_ID, feedItemId)
            .set(EMBEDDING.MODEL, modelName)
            .set(EMBEDDING.VECTOR, Array(vector.size) { vector[it] })
            .onConflict(EMBEDDING.FEED_ITEM_ID, EMBEDDING.MODEL)
            .doNothing()
            .execute()
    }

    fun findUnembedded(limit: Int): List<AISummarisedItem> =
        dsl
            .select(FEED_ITEM.ID, FEED_ITEM.AI_SUMMARY)
            .from(FEED_ITEM)
            .leftJoin(EMBEDDING)
            .on(EMBEDDING.FEED_ITEM_ID.eq(FEED_ITEM.ID))
            .where(
                FEED_ITEM.AI_SUMMARY.isNotNull
                    .and(EMBEDDING.ID.isNull),
            ).orderBy(FEED_ITEM.INGESTED_AT.asc())
            .limit(limit)
            .fetch()
            .map { r -> AISummarisedItem(r.get(FEED_ITEM.ID)!!, r.get(FEED_ITEM.AI_SUMMARY)!!) }

    fun loadWindow(since: OffsetDateTime): List<EmbeddingRow> =
        dsl
            .select(
                FEED_ITEM.ID,
                FEED_ITEM.AI_SUMMARY,
                FEED_ITEM.PUBLISHED_AT,
                EMBEDDING.VECTOR,
            ).from(FEED_ITEM)
            .join(EMBEDDING)
            .on(EMBEDDING.FEED_ITEM_ID.eq(FEED_ITEM.ID))
            .where(FEED_ITEM.PUBLISHED_AT.gt(since))
            .fetch()
            .map { r ->
                EmbeddingRow(
                    feedItemId = r.get(FEED_ITEM.ID)!!,
                    aiSummary = r.get(FEED_ITEM.AI_SUMMARY)!!,
                    publishedAt = r.get(FEED_ITEM.PUBLISHED_AT)!!,
                    vector = r.get(EMBEDDING.VECTOR)!!.map { it!! },
                )
            }
}
