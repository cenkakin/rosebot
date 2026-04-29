package com.github.cenkakin.rosebot.feed

import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import com.github.cenkakin.rosebot.source.SourceType
import java.time.OffsetDateTime
import org.jooq.Record
import org.springframework.context.ApplicationEventPublisher

class FeedService(
    private val feedItemRepository: FeedItemRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {
    fun getFeed(
        userId: Long,
        before: String?,
        limit: Int,
        sourceId: Long?,
        type: String?,
        language: String?,
        category: String?,
    ): List<FeedItemResponse> {
        val beforeDt = before?.let { OffsetDateTime.parse(it) }
        val sourceType = type?.let { SourceType.valueOf(it) }
        val articleCategory = category?.let {
            runCatching { ArticleCategory.valueOf(it) }.getOrElse {
                throw IllegalArgumentException("Unknown category: $category")
            }
        }
        return feedItemRepository
            .findFeed(userId, beforeDt, limit, sourceId, sourceType, language, articleCategory)
            .map { it.toResponse() }
    }

    fun getLanguages(): List<String> = feedItemRepository.findLanguages()

    fun getById(
        userId: Long,
        id: Long,
    ): FeedItemResponse =
        feedItemRepository.findByIdForUser(userId, id)?.toResponse()
            ?: throw NoSuchElementException("Feed item $id not found")

    fun insert(
        sourceId: Long,
        draft: FeedItemDraft,
    ): Long? {
        val feedItemRecord = draft.toFeedItemRecord(sourceId)
        return feedItemRepository.insert(feedItemRecord)?.id
    }

    fun findUndetected(limit: Int): List<FeedItemForSummarisation> = feedItemRepository.findUndetected(limit)

    fun findUnsummarised(limit: Int): List<FeedItemForSummarisation> = feedItemRepository.findUnsummarised(limit)

    fun saveLanguage(
        feedItemId: Long,
        language: String,
    ) = feedItemRepository.saveLanguage(feedItemId, language)

    fun saveAiSummary(
        feedItemId: Long,
        aiSummary: String,
    ) {
        feedItemRepository.saveAiSummary(feedItemId, aiSummary)
        eventPublisher.publishEvent(SummaryCreatedEvent(feedItemId, aiSummary))
    }

    fun findUncategorised(limit: Int): List<AISummarisedItem> = feedItemRepository.findUncategorised(limit)

    fun saveCategory(
        feedItemId: Long,
        category: ArticleCategory,
    ) = feedItemRepository.saveCategory(feedItemId, category)

    private fun Record.toResponse(): FeedItemResponse =
        toFeedItemResponse(
            saved = get("saved", Boolean::class.java) ?: false,
            savedAt = null,
        )
}
