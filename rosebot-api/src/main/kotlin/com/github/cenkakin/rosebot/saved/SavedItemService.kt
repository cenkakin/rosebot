package com.github.cenkakin.rosebot.saved

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
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
    ): List<FeedItemResponse> {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        return savedItemRepository.findByUser(userId, beforeDt, limit).map { it.toResponse() }
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

    private fun Record.toResponse(): FeedItemResponse {
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
