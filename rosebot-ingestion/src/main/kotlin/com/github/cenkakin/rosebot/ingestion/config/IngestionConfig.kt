package com.github.cenkakin.rosebot.ingestion.config

import com.github.cenkakin.rosebot.cluster.ClusterRepository
import com.github.cenkakin.rosebot.cluster.ClusterService
import com.github.cenkakin.rosebot.content.ContentRepository
import com.github.cenkakin.rosebot.content.ContentService
import com.github.cenkakin.rosebot.feed.FeedItemRepository
import com.github.cenkakin.rosebot.feed.FeedService
import com.github.cenkakin.rosebot.ingestion.ai.categorisation.CategorizationService
import com.github.cenkakin.rosebot.ingestion.ai.clustering.ClusterLabellingService
import com.github.cenkakin.rosebot.ingestion.ai.embedding.EmbeddingRepository
import com.github.cenkakin.rosebot.ingestion.ai.embedding.EmbeddingService
import com.github.cenkakin.rosebot.ingestion.ai.summarisation.LanguageDetector
import com.github.cenkakin.rosebot.ingestion.ai.summarisation.SummarisationService
import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.ingestion.connector.news.RssConnector
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemIngestionService
import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import com.github.cenkakin.rosebot.ingestion.scheduler.IngestionScheduler
import com.github.cenkakin.rosebot.source.SourceRepository
import com.github.cenkakin.rosebot.source.SourceService
import java.util.concurrent.Semaphore
import org.jooq.DSLContext
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.ollama.OllamaEmbeddingModel
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync

@Configuration
@EnableAsync
class IngestionConfig(
    private val eventPublisher: ApplicationEventPublisher,
) {
    @Bean
    fun llmSemaphore(): Semaphore = Semaphore(2)

    @Bean
    fun rssConnector(): SourceConnector = RssConnector()

    @Bean
    fun feedService(dsl: DSLContext) = FeedService(FeedItemRepository(dsl), eventPublisher)

    @Bean
    fun feedItemIngestionService(
        feedService: FeedService,
        dsl: DSLContext,
        eventPublisher: ApplicationEventPublisher,
    ) = FeedItemIngestionService(
        feedService,
        ContentService(ContentRepository(dsl)),
        eventPublisher,
    )

    @Bean
    fun ingestionService(
        dsl: DSLContext,
        feedItemIngestionService: FeedItemIngestionService,
        connectors: List<SourceConnector>,
    ) = IngestionService(SourceService(SourceRepository(dsl)), feedItemIngestionService, connectors)

    @Bean
    fun ingestionScheduler(ingestionService: IngestionService) = IngestionScheduler(ingestionService)

    @Bean
    fun languageDetector(
        chatClientBuilder: ChatClient.Builder,
        llmSemaphore: Semaphore,
    ) = LanguageDetector(chatClientBuilder.build(), llmSemaphore)

    @Bean
    fun summarisationService(
        chatClientBuilder: ChatClient.Builder,
        llmSemaphore: Semaphore,
    ) = SummarisationService(chatClientBuilder.build(), llmSemaphore)

    @Bean
    fun embeddingService(
        dsl: DSLContext,
        embeddingModel: OllamaEmbeddingModel,
    ) = EmbeddingService(EmbeddingRepository(dsl), embeddingModel)

    @Bean
    fun clusterLabellingService(
        chatClientBuilder: ChatClient.Builder,
        llmSemaphore: Semaphore,
    ) = ClusterLabellingService(chatClientBuilder.build(), llmSemaphore)

    @Bean
    fun categorizationService(
        chatClientBuilder: ChatClient.Builder,
        llmSemaphore: Semaphore,
    ) = CategorizationService(chatClientBuilder.build(), llmSemaphore)

    @Bean
    fun clusterService(dsl: DSLContext) = ClusterService(ClusterRepository(dsl))
}
