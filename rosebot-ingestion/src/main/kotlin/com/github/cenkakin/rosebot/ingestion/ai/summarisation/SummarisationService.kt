package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.cenkakin.rosebot.ingestion.ai.clustering.ClusteringJob
import org.springframework.ai.chat.client.ChatClient
import java.util.concurrent.Semaphore
import org.slf4j.LoggerFactory

class SummarisationService(
    private val chatClient: ChatClient,
    private val languageDetector: LanguageDetector,
) {
    companion object {
        private val SYSTEM_PROMPT =
            """
            You are a news summariser. 
            Always respond in English regardless of the article's original language. Be factual and concise.
            """.trimIndent()
        private val SEMAPHORE = Semaphore(2)
        private val log = LoggerFactory.getLogger(SummarisationService::class.java)
    }

    fun resolve(
        title: String,
        snippet: String?,
        content: String?,
    ): String =
        if (!snippet.isNullOrBlank() && languageDetector.isEnglish(snippet)) {
            snippet
        } else {
            summarise(title, content ?: snippet)
        }

    private fun summarise(
        title: String,
        text: String?,
    ): String {
        val content = text?.take(4000) ?: title
        SEMAPHORE.acquire()
        return try {
            val aiSummary = chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .user {
                    it
                        .text(
                            """
                            Summarise the following news article in exactly 2-3 sentences, capturing the key facts and context. Do not add opinions or analysis.
                            Title: {title}
                            Content: {content}
                        """,
                        ).param("title", title)
                        .param("content", content)
                }.call()
                .content()!!
            log.info("[summarisation] title={}, content={}, aiSummary={}", title, content, aiSummary)
            aiSummary
        } finally {
            SEMAPHORE.release()
        }
    }
}
