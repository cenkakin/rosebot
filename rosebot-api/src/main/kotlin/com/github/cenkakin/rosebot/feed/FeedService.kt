package com.github.cenkakin.rosebot.feed

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.source.SourceType
import jooq.Tables.FEED_ITEM
import jooq.Tables.SOURCE
import org.jooq.Record
import java.time.OffsetDateTime

class FeedService(
    private val feedItemRepository: FeedItemRepository,
    private val objectMapper: ObjectMapper,
) {
    fun getFeed(
        userId: Long,
        before: String?,
        limit: Int,
        sourceId: Long?,
        type: String?,
    ): List<FeedItemResponse> {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        val sourceType = type?.let { SourceType.valueOf(it) }
        return feedItemRepository
            .findFeed(userId, beforeDt, limit, sourceId, sourceType)
            .map { it.toResponse() }
    }

    fun getById(
        userId: Long,
        id: Long,
    ): FeedItemResponse =
        feedItemRepository.findByIdForUser(userId, id)?.toResponse()
            ?: throw NoSuchElementException("Feed item $id not found")

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
            saved = get("saved", Boolean::class.java) ?: false,
        )
    }
}
