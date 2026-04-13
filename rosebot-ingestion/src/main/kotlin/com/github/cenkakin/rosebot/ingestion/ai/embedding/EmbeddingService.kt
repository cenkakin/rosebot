package com.github.cenkakin.rosebot.ingestion.ai.embedding

import org.springframework.ai.embedding.EmbeddingModel
import java.time.OffsetDateTime

class EmbeddingService(
    private val embeddingRepository: EmbeddingRepository,
    private val embeddingModel: EmbeddingModel,
) {
    companion object {
        private const val MODEL_NAME = "nomic-embed-text"
    }

    fun embedAndSave(
        feedItemId: Long,
        text: String,
    ) = embeddingRepository.save(feedItemId, embed(text), MODEL_NAME)

    private fun embed(text: String): List<Float> = embeddingModel.embed(text).toList()

    /** Items that have an ai_summary but no embedding yet. */
    fun findUnembedded(limit: Int): List<UnembeddedItem> = embeddingRepository.findUnembedded(limit)

    /**
     * Loads all (feedItemId, aiSummary, publishedAt, vector) rows for feed items
     * published within [windowHours] hours that have an embedding.
     * Used by ClusteringJob to build the HDBSCAN input matrix.
     */
    fun loadWindow(windowHours: Long): List<EmbeddingRow> {
        val since = OffsetDateTime.now().minusHours(windowHours)
        return embeddingRepository.loadWindow(since = since)
    }
}
