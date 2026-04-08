package com.github.cenkakin.rosebot.source

import com.github.cenkakin.rosebot.source.dto.SourceRequest
import com.github.cenkakin.rosebot.source.dto.SourceResponse
import com.github.cenkakin.rosebot.source.dto.UpdateSourceRequest
import jooq.tables.records.SourceRecord

class SourceService(
    private val sourceRepository: SourceRepository,
) {
    fun findAll(): List<SourceResponse> = sourceRepository.findAll().map { it.toResponse() }

    fun findAllEnabled(): List<SourceRecord> = sourceRepository.findAllEnabled()

    fun findEnabledBySourceType(sourceType: SourceType): List<SourceRecord> =
        sourceRepository.findEnabledBySourceType(sourceType.toJooqEnum())

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

    private fun SourceRecord.toResponse() =
        SourceResponse(
            id = id!!,
            type = type!!.literal,
            name = name!!,
            url = url!!,
            homepage = homepage!!,
            enabled = enabled!!,
            createdAt = createdAt!!.toInstant().toString(),
        )
}
