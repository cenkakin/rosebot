package com.github.cenkakin.rosebot.saved

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.source.SourceType
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import jooq.Tables.FEED_ITEM
import jooq.Tables.SOURCE
import org.jooq.Record
import java.time.OffsetDateTime

class SavedItemService(
    private val savedItemRepository: SavedItemRepository,
    private val objectMapper: ObjectMapper,
) {
    fun getSaved(
        userId: Long,
        before: String?,
        limit: Int,
        sourceId: Long?,
        type: String?,
    ): List<FeedItemResponse> {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        val sourceType = type?.let { SourceType.valueOf(it) }
        return savedItemRepository.findByUser(userId, beforeDt, limit, sourceId, sourceType).map { it.toFeedResponse() }
    }

    fun getSavedSources(userId: Long): List<SourceResponse> =
        savedItemRepository.findSourcesByUser(userId).map { record ->
            SourceResponse(
                id = record.get(SOURCE.ID)!!,
                type = record.get(SOURCE.TYPE)!!.literal,
                name = record.get(SOURCE.NAME)!!,
                url = record.get(SOURCE.URL)!!,
                enabled = record.get(SOURCE.ENABLED)!!,
                createdAt = record.get(SOURCE.CREATED_AT)!!.toInstant().toString(),
            )
        }

    fun save(
        userId: Long,
        feedItemId: Long,
    ) = savedItemRepository.save(userId, feedItemId)

    fun unsave(
        userId: Long,
        feedItemId: Long,
    ) {
        if (!savedItemRepository.delete(userId, feedItemId)) {
            throw NoSuchElementException("Saved item not found")
        }
    }

    private fun Record.toFeedResponse(): FeedItemResponse {
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
            saved = true,
        )
    }
}
