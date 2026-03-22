package com.github.cenkakin.rosebot.service

import com.github.cenkakin.rosebot.dto.ArticleRequest
import com.github.cenkakin.rosebot.dto.ArticleResponse
import com.github.cenkakin.rosebot.repository.ArticleRepository
import jooq.tables.records.ArticlesRecord
import org.springframework.stereotype.Service

@Service
class ArticleService(
    private val repository: ArticleRepository,
) {
    fun findAll(): List<ArticleResponse> = repository.findAll().map { it.toResponse() }

    fun findById(id: Long): ArticleResponse =
        repository.findById(id)?.toResponse()
            ?: throw NoSuchElementException("Article not found: $id")

    fun create(request: ArticleRequest): ArticleResponse = repository.create(request.title, request.content).toResponse()

    fun update(
        id: Long,
        request: ArticleRequest,
    ): ArticleResponse =
        repository.update(id, request.title, request.content)?.toResponse()
            ?: throw NoSuchElementException("Article not found: $id")

    fun delete(id: Long) {
        if (!repository.delete(id)) throw NoSuchElementException("Article not found: $id")
    }

    private fun ArticlesRecord.toResponse() =
        ArticleResponse(
            id = id!!,
            title = title!!,
            content = content!!,
            createdAt = createdAt!!.toInstant().toString(),
            updatedAt = updatedAt!!.toInstant().toString(),
        )
}
