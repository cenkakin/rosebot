package com.github.cenkakin.rosebot.saved

import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.feed.toFeedItemResponse
import com.github.cenkakin.rosebot.source.SourceType
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import jooq.tables.references.SAVED_ITEM
import jooq.tables.references.SOURCE
import org.jooq.Record
import java.time.OffsetDateTime

class SavedItemService(
    private val savedItemRepository: SavedItemRepository,
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
        return savedItemRepository.findByUser(userId, beforeDt, limit, sourceId, sourceType).map { it.toFeedItemResponse() }
    }

    fun getSavedSources(userId: Long): List<SourceResponse> =
        savedItemRepository.findSourcesByUser(userId).map { record ->
            SourceResponse(
                id = record.get(SOURCE.ID)!!,
                type = record.get(SOURCE.TYPE)!!.literal,
                name = record.get(SOURCE.NAME)!!,
                url = record.get(SOURCE.URL)!!,
                homepage = record.get(SOURCE.HOMEPAGE)!!,
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

    private fun Record.toFeedItemResponse(): FeedItemResponse =
        toFeedItemResponse(
            saved = true,
            savedAt = get(SAVED_ITEM.SAVED_AT)!!.toInstant().toString(),
        )
}
