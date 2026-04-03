package com.github.cenkakin.rosebot.summary

import com.github.cenkakin.rosebot.summary.dto.SummaryResponse

class SummaryService(
    private val summaryRepository: SummaryRepository,
) {
    fun get(feedItemId: Long): SummaryResponse =
        summaryRepository
            .findByFeedItem(feedItemId)
            ?.let { SummaryResponse(it.content!!, it.generatedAt!!.toInstant().toString()) }
            ?: throw NoSuchElementException("No summary for feed item $feedItemId")

    fun getBatch(itemIds: List<Long>): Map<Long, SummaryResponse> =
        summaryRepository
            .findByFeedItemIds(itemIds)
            .associate { record ->
                record.feedItemId!! to
                    SummaryResponse(
                        content = record.content!!,
                        generatedAt = record.generatedAt!!.toInstant().toString(),
                    )
            }

    fun insert(
        feedItemId: Long,
        content: String,
    ) = summaryRepository.insert(feedItemId, content)
}
