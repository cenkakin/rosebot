package com.github.cenkakin.rosebot.content

import com.github.cenkakin.rosebot.content.dto.ContentResponse

class ContentService(
    private val contentRepository: ContentRepository,
) {
    fun get(feedItemId: Long): ContentResponse =
        contentRepository
            .findByFeedItem(feedItemId)
            ?.let { ContentResponse(it) }
            ?: throw NoSuchElementException("No content for feed item $feedItemId")

    fun getExistingIds(itemIds: List<Long>): List<Long> = contentRepository.findIdsByFeedItemIds(itemIds)

    fun insert(
        feedItemId: Long,
        content: String,
    ) = contentRepository.insert(feedItemId, content)
}
