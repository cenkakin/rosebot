package com.github.cenkakin.rosebot.dto

data class ArticleResponse(
    val id: Long,
    val title: String,
    val content: String,
    val createdAt: String,
    val updatedAt: String
)
