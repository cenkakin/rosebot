package com.github.cenkakin.rosebot.source

import com.github.cenkakin.rosebot.source.dto.SourceResponse
import jooq.tables.records.SourceRecord

fun SourceRecord.toResponse() =
    SourceResponse(
        id = id!!,
        type = type!!.literal,
        name = name!!,
        url = url!!,
        homepage = homepage!!,
        enabled = enabled!!,
        createdAt = createdAt!!.toInstant().toString(),
    )

fun SourceRecord.toDomain() =
    Source(
        id = id!!,
        type = SourceType.valueOf(type!!.literal),
        name = name!!,
        url = url!!,
        homepage = homepage!!,
        enabled = enabled!!,
        createdAt = createdAt!!,
    )
