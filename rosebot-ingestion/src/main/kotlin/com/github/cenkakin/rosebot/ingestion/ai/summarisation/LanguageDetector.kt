package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import dev.failsafe.Failsafe
import dev.failsafe.Fallback
import dev.failsafe.RetryPolicy
import dev.failsafe.function.CheckedSupplier
import java.time.Duration
import java.util.Locale
import java.util.concurrent.Semaphore
import org.springframework.ai.chat.client.ChatClient

class LanguageDetector(
    private val chatClient: ChatClient,
    private val semaphore: Semaphore,
) {
    companion object {
        const val UNDETERMINED = "und"
        private const val MIN_TEXT_LENGTH = 20
        private const val MAX_TEXT_LENGTH = 300
        private val LANGUAGES = Locale.getISOLanguages().toHashSet()
        private val SYSTEM_PROMPT =
            """
            You are a language identifier. Reply with exactly the ISO 639-1 two-letter language code
            (e.g. "en", "tr", "de") of the text below. No punctuation, no explanation, only the code.
            """.trimIndent()
        private val retry: RetryPolicy<String> =
            RetryPolicy
                .builder<String>()
                .handle(Exception::class.java)
                .withDelay(Duration.ofMillis(500))
                .withMaxRetries(3)
                .build()
        private val fallback: Fallback<String> =
            Fallback
                .builder(UNDETERMINED)
                .build()
    }

    fun detectLanguage(text: String): String {
        if (text.length < MIN_TEXT_LENGTH) return UNDETERMINED
        val truncated = text.take(MAX_TEXT_LENGTH)
        semaphore.acquire()
        return try {
            Failsafe.with(fallback, retry).get(
                CheckedSupplier {
                    val response =
                        chatClient
                            .prompt()
                            .system(SYSTEM_PROMPT)
                            .user(truncated)
                            .call()
                            .content()!!
                            .trim()
                            .lowercase()
                    response.takeIf { languageCode ->
                        LANGUAGES.any { it == languageCode } } ?: UNDETERMINED
                },
            )
        } finally {
            semaphore.release()
        }
    }
}
