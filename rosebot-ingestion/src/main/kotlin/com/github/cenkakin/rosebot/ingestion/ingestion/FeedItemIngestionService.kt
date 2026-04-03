package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.summary.SummaryService

class FeedItemIngestionService(
    private val feedService: FeedService,
    private val summaryService: SummaryService,
) {
    fun ingest(
        sourceId: Long,
        draft: FeedItemDraft,
    ): Boolean {
        val id = feedService.insert(sourceId, draft) ?: return false
        draft.feedSummary?.let { summaryService.insert(id, it) }
        return true
    }
}
