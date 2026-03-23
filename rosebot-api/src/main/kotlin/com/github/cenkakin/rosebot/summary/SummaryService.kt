package com.github.cenkakin.rosebot.summary

import com.github.cenkakin.rosebot.summary.dto.SummaryResponse

class SummaryService(
    private val summaryRepository: SummaryRepository,
) {
    fun get(feedItemId: Long): SummaryResponse =
        summaryRepository
            .findByFeedItem(feedItemId)
            ?.let { SummaryResponse(it.content!!, it.model!!, it.generatedAt!!.toInstant().toString()) }
            ?: throw NoSuchElementException("No summary for feed item $feedItemId")
}
