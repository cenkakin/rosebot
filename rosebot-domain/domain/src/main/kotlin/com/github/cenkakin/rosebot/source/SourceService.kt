package com.github.cenkakin.rosebot.source

import com.github.cenkakin.rosebot.source.dto.SourceRequest
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import com.github.cenkakin.rosebot.source.dto.UpdateSourceRequest

class SourceService(
    private val sourceRepository: SourceRepository,
) {
    fun findAll(): List<SourceResponse> = sourceRepository.findAll().map { it.toResponse() }

    fun findAllEnabled(): List<Source> = sourceRepository.findAllEnabled().map { it.toDomain() }

    fun findEnabledBySourceType(sourceType: SourceType): List<Source> =
        sourceRepository.findEnabledBySourceType(sourceType.toJooqEnum()).map { it.toDomain() }

    fun create(request: SourceRequest): SourceResponse = sourceRepository.create(request).toResponse()

    fun update(
        id: Long,
        request: UpdateSourceRequest,
    ): SourceResponse =
        sourceRepository.update(id, request.name, request.enabled)?.toResponse()
            ?: throw NoSuchElementException("Source $id not found")

    fun delete(id: Long) {
        if (!sourceRepository.delete(id)) throw NoSuchElementException("Source $id not found")
    }
}
