package com.github.cenkakin.rosebot.ingestion.ai.clustering

import java.util.concurrent.Semaphore
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.entity

class ClusterLabellingService(
    private val chatClient: ChatClient,
    private val semaphore: Semaphore,
) {
    companion object {
        private const val SYSTEM_PROMPT = "You are a news editor. Respond ONLY with valid JSON."
    }

    fun label(summaries: List<String>): ClusterLabel {
        val summaryList = summaries.joinToString("\n") { "- $it" }
        semaphore.acquire()
        return try {
            chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .user {
                    it
                        .text(
                            """
                        The following article summaries belong to the same news story or topic.
                        Summaries:
                        {summaryList}
                        
                        You should return a JSON object matching this schema:
                        {
                            "label": "string",
                            "summary": "string"
                        }
                        
                        label must be 2-5 words in title case. summary must be 2-3 sentences.
                        """,
                        ).param("summaryList", summaryList)
                }.call()
                .entity<ClusterLabel>()
        } finally {
            semaphore.release()
        }
    }
}
