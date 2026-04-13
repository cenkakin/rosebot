package com.github.cenkakin.rosebot.ingestion.ai.summarisation

import com.github.pemistahl.lingua.api.Language
import com.github.pemistahl.lingua.api.LanguageDetectorBuilder

class LanguageDetector {
    private val detector =
        LanguageDetectorBuilder
            .fromLanguages(Language.ENGLISH, Language.TURKISH, Language.GERMAN)
            .withMinimumRelativeDistance(0.25)
            .build()

    /**
     * Returns true when [text] is confidently detected as English.
     * Texts shorter than 20 characters are unreliable — treated as non-English
     * so they always go through the AI summarisation path.
     */
    fun isEnglish(text: String): Boolean = text.length >= 20 && detector.detectLanguageOf(text) == Language.ENGLISH
}
