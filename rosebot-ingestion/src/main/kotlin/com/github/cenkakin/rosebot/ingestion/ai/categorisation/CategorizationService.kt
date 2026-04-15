package com.github.cenkakin.rosebot.ingestion.ai.categorisation

import com.github.cenkakin.rosebot.feed.ArticleCategory
import dev.failsafe.Failsafe
import dev.failsafe.RetryPolicy
import dev.failsafe.function.CheckedSupplier
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import java.time.Duration
import java.util.concurrent.Semaphore

class CategorizationService(
    private val chatClient: ChatClient,
    private val semaphore: Semaphore,
) {
    companion object {
        private val VALID_CATEGORIES = ArticleCategory.entries.map { it.name }.toSet()
        private val log = LoggerFactory.getLogger(CategorizationService::class.java)

        private val retry: RetryPolicy<ArticleCategory?> =
            RetryPolicy
                .builder<ArticleCategory?>()
                .handle(Exception::class.java)
                .withDelay(Duration.ofMillis(500))
                .withMaxRetries(2)
                .build()

        private val SYSTEM_PROMPT =
            """
            You are a news article classifier.
            Respond with ONLY one of these exact values — no punctuation, no explanation:
            POLITICS, BUSINESS, TECHNOLOGY, SCIENCE_AND_HEALTH, WORLD, SOCIETY, ENTERTAINMENT, SPORTS

            Definitions:
            - POLITICS: Government, policy, elections, international relations
            - BUSINESS: Economy, finance, markets, companies, startups
            - TECHNOLOGY: Tech, AI, cybersecurity, internet culture
            - SCIENCE_AND_HEALTH: Scientific research, environment, medicine, public health
            - WORLD: Major international events (non-political focus or general global news)
            - SOCIETY: Crime, education, social issues, culture, lifestyle
            - ENTERTAINMENT: Movies, TV, music, celebrities, gaming
            - SPORTS: All sports and competitions
            """.trimIndent()
    }

    fun classify(summary: String): ArticleCategory? {
        semaphore.acquire()
        return try {
            Failsafe.with(retry).get(
                CheckedSupplier {
                    val raw =
                        chatClient
                            .prompt()
                            .system(SYSTEM_PROMPT)
                            .user { it.text("Classify this news summary:\n{summary}").param("summary", summary) }
                            .call()
                            .content()!!
                            .trim()
                            .uppercase()
                    if (raw in VALID_CATEGORIES) {
                        ArticleCategory.valueOf(raw).also {
                            log.info("[categorisation] summary={}, category={}", summary.take(80), it)
                        }
                    } else {
                        log.warn("[categorisation] unexpected LLM response: {}", raw)
                        null
                    }
                },
            )
        } finally {
            semaphore.release()
        }
    }
}
