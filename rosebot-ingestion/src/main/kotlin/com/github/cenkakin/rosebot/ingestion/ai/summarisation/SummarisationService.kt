package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.entity
import java.util.Locale
import java.util.concurrent.Semaphore

data class AiSummaryResult(
    val summary: String,
    val bullets: List<String>,
)

class SummarisationService(
    private val chatClient: ChatClient,
    private val semaphore: Semaphore,
) {
    companion object {
        private val SYSTEM_PROMPT =
            """
            You are a news summariser.
            Always respond in English regardless of the article's original language. Be factual and concise.
            """.trimIndent()
        private val log = LoggerFactory.getLogger(SummarisationService::class.java)
    }

    internal fun resolveWithKnownLanguage(
        language: String,
        title: String,
        snippet: String?,
        content: String?,
    ): AiSummaryResult =
        if (language == Locale.ENGLISH.language && !snippet.isNullOrBlank()) {
            AiSummaryResult(snippet, emptyList())
        } else {
            summarise(title, content ?: snippet)
        }

    private fun summarise(
        title: String,
        text: String?,
    ): AiSummaryResult {
        val content = text?.take(4000) ?: title
        semaphore.acquire()
        return try {
            chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .user {
                    it
                        .text(
                            """
                                Summarise the following news article.
                                Return:
                                - "summary": exactly 2-3 sentences capturing the key facts and context.
                                - "bullets": 2-3 short key-point bullets (each under 12 words). Use an empty list only if the article is too thin for bullets.
                                Do not add opinions or analysis.
                                Title: {title}
                                Content: {content}
                            """,
                        ).param("title", title)
                        .param("content", content)
                }.call()
                .entity()!!
        } catch (e: Exception) {
            log.warn("[summarisation] structured parse failed for title={}: {}", title, e.message)
            AiSummaryResult(content, emptyList())
        } finally {
            semaphore.release()
        }
    }
}
