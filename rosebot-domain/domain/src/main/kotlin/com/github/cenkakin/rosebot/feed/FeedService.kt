package com.github.cenkakin.rosebot.feed

import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.source.SourceType
import org.jooq.Record
import java.time.OffsetDateTime

class FeedService(
    private val feedItemRepository: FeedItemRepository,
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

    private fun Record.toResponse(): FeedItemResponse =
        toFeedItemResponse(
            saved = get("saved", Boolean::class.java) ?: false,
            savedAt = null,
        )
}
