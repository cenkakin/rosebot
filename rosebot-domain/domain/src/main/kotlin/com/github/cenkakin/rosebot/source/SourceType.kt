package com.github.cenkakin.rosebot.source

enum class SourceType {
    NEWS,
    REDDIT,
    TWITTER,
    ;

    companion object {
        fun fromString(type: String): SourceType? = entries.find { it.name.equals(type, ignoreCase = true) }
    }
}
