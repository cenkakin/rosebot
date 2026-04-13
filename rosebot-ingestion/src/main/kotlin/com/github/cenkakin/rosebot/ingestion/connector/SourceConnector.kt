package com.github.cenkakin.rosebot.ingestion.connector

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.source.Source
import com.github.cenkakin.rosebot.source.SourceType

interface SourceConnector {
    val type: SourceType

    fun fetch(source: Source): List<FeedItemDraft>
}
