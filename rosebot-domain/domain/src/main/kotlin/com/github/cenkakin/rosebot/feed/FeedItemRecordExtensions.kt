package com.github.cenkakin.rosebot.feed

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import jooq.tables.records.FeedItemRecord
import jooq.tables.references.FEED_ITEM
import jooq.tables.references.SOURCE
import org.jooq.JSONB
import org.jooq.Record
import java.time.ZoneOffset

private val objectMapper = jacksonObjectMapper()

internal fun FeedItemDraft.toFeedItemRecord(sourceId: Long): FeedItemRecord =
    FeedItemRecord(
        sourceId = sourceId,
        externalId = externalId,
        title = title,
        content = content,
        url = url,
        thumbnailUrl = thumbnailUrl,
        author = author,
        engagement = engagement?.let { JSONB.jsonb(objectMapper.writeValueAsString(it)) },
        publishedAt = publishedAt.atOffset(ZoneOffset.UTC),
        updatedAt = updatedAt?.atOffset(ZoneOffset.UTC),
    )

internal fun Record.toFeedItemResponse(
    saved: Boolean,
    savedAt: String?,
): FeedItemResponse {
    val engagement =
        get(FEED_ITEM.ENGAGEMENT)
            ?.let { objectMapper.readValue<Map<String, Any>>(it.data()) }
    return FeedItemResponse(
        id = get(FEED_ITEM.ID)!!,
        sourceId = get(FEED_ITEM.SOURCE_ID)!!,
        sourceType = get(SOURCE.TYPE)!!.literal,
        sourceName = get(SOURCE.NAME)!!,
        title = get(FEED_ITEM.TITLE)!!,
        content = get(FEED_ITEM.CONTENT),
        url = get(FEED_ITEM.URL)!!,
        thumbnailUrl = get(FEED_ITEM.THUMBNAIL_URL),
        author = get(FEED_ITEM.AUTHOR),
        engagement = engagement,
        publishedAt = get(FEED_ITEM.PUBLISHED_AT)!!.toInstant().toString(),
        saved = saved,
        savedAt = savedAt,
    )
}
