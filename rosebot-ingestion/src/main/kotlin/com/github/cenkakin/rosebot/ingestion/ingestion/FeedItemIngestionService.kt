package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.content.ContentService
import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemSavedEvent
import org.springframework.context.ApplicationEventPublisher

class FeedItemIngestionService(
    private val feedService: FeedService,
    private val contentService: ContentService,
    private val eventPublisher: ApplicationEventPublisher,
) {
    fun ingest(
        sourceId: Long,
        draft: FeedItemDraft,
    ): Boolean {
        val feedItemId = feedService.insert(sourceId, draft) ?: return false

        draft.content?.let { contentService.insert(feedItemId, it) }

        eventPublisher.publishEvent(
            FeedItemSavedEvent(
                feedItemId = feedItemId,
                title = draft.title,
                content = draft.content,
                snippet = draft.summary,
            ),
        )
        return true
    }
}
