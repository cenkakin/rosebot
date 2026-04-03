package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.content.ContentService
import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.feed.FeedService

class FeedItemIngestionService(
    private val feedService: FeedService,
    private val contentService: ContentService,
) {
    fun ingest(
        sourceId: Long,
        draft: FeedItemDraft,
    ): Boolean {
        val id = feedService.insert(sourceId, draft) ?: return false
        draft.content?.let { contentService.insert(id, it) }
        return true
    }
}
