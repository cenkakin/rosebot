package com.github.cenkakin.rosebot.ingestion.config

import com.github.cenkakin.rosebot.content.ContentRepository
import com.github.cenkakin.rosebot.content.ContentService
import com.github.cenkakin.rosebot.feed.FeedItemRepository
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.ingestion.connector.news.RssConnector
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemIngestionService
import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import com.github.cenkakin.rosebot.ingestion.scheduler.IngestionScheduler
import com.github.cenkakin.rosebot.source.SourceRepository
import com.github.cenkakin.rosebot.source.SourceService
import org.jooq.DSLContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class IngestionConfig {
    @Bean
    fun rssConnector(): SourceConnector = RssConnector()

    @Bean
    fun feedItemIngestionService(dsl: DSLContext) =
        FeedItemIngestionService(
            FeedService(FeedItemRepository(dsl)),
            ContentService(ContentRepository(dsl)),
        )

    @Bean
    fun ingestionService(
        dsl: DSLContext,
        feedItemIngestionService: FeedItemIngestionService,
        connectors: List<SourceConnector>,
    ) = IngestionService(SourceService(SourceRepository(dsl)), feedItemIngestionService, connectors)

    @Bean
    fun ingestionScheduler(ingestionService: IngestionService) = IngestionScheduler(ingestionService)
}
