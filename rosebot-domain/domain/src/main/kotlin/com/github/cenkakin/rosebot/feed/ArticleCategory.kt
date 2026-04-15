package com.github.cenkakin.rosebot.feed

enum class ArticleCategory {
    POLITICS,
    BUSINESS,
    TECHNOLOGY,
    SCIENCE_AND_HEALTH,
    WORLD,
    SOCIETY,
    ENTERTAINMENT,
    SPORTS,
}

internal fun ArticleCategory.toJooqEnum(): jooq.enums.ArticleCategory =
    jooq.enums.ArticleCategory.valueOf(name)
