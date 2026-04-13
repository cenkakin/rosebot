package com.github.cenkakin.rosebot.ingestion.ai.embedding

import java.time.OffsetDateTime

data class EmbeddingRow(
    val feedItemId: Long,
    val aiSummary: String,
    val publishedAt: OffsetDateTime,
    val vector: List<Float>,
)
