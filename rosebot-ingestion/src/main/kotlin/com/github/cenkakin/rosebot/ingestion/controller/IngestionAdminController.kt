package com.github.cenkakin.rosebot.ingestion.controller

import com.github.cenkakin.rosebot.ingestion.ai.clustering.ClusteringJob
import com.github.cenkakin.rosebot.ingestion.ai.embedding.EmbeddingJob
import com.github.cenkakin.rosebot.ingestion.ai.summarisation.SummarisationJob
import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import com.github.cenkakin.rosebot.source.SourceType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/admin/ingestion")
class IngestionAdminController(
    private val ingestionService: IngestionService,
    private val summarisationJob: SummarisationJob,
    private val embeddingJob: EmbeddingJob,
    private val clusteringJob: ClusteringJob,
) {
    @PostMapping("/poll")
    fun pollAll(
        @RequestParam(required = false) source: String?,
    ): ResponseEntity<String?> {
        val sourceType =
            source?.let {
                SourceType.fromString(it) ?: return ResponseEntity.badRequest().body("Invalid source type")
            }
        CoroutineScope(Dispatchers.IO).launch {
            if (sourceType == null) {
                ingestionService.pollAll()
            } else {
                ingestionService.ingest(sourceType)
            }
        }
        return ResponseEntity.ok("Polling is triggered")
    }

    @PostMapping("/summarise")
    fun triggerSummarisation(): ResponseEntity<String> {
        CoroutineScope(Dispatchers.IO).launch {
            summarisationJob.recover()
        }
        return ResponseEntity.ok("Summarisation is triggered")
    }

    @PostMapping("/embed")
    fun triggerEmbedding(): ResponseEntity<String> {
        CoroutineScope(Dispatchers.IO).launch {
            embeddingJob.recover()
        }
        return ResponseEntity.ok("Embedding is triggered")
    }

    @PostMapping("/cluster")
    fun triggerClustering(): ResponseEntity<String> {
        CoroutineScope(Dispatchers.IO).launch {
            clusteringJob.run()
        }
        return ResponseEntity.ok("Clustering is triggered")
    }
}
