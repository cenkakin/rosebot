package com.github.cenkakin.rosebot.ingestion.connector

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.source.SourceType
import jooq.tables.records.SourceRecord

interface SourceConnector {
    val type: SourceType

    fun fetch(source: SourceRecord): List<FeedItemDraft>
}
