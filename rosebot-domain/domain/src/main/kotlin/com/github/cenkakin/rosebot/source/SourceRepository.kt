package com.github.cenkakin.rosebot.source

import com.github.cenkakin.rosebot.source.dto.SourceRequest
import jooq.Tables.SOURCE
import jooq.tables.records.SourceRecord
import org.jooq.DSLContext

class SourceRepository(
    private val dsl: DSLContext,
) {
    fun findAll(): List<SourceRecord> = dsl.selectFrom(SOURCE).orderBy(SOURCE.CREATED_AT.asc()).fetch()

    fun findById(id: Long): SourceRecord? = dsl.selectFrom(SOURCE).where(SOURCE.ID.eq(id)).fetchOne()

    fun create(request: SourceRequest): SourceRecord =
        dsl
            .insertInto(SOURCE)
            .set(SOURCE.TYPE, request.type.toJooqEnum())
            .set(SOURCE.NAME, request.name)
            .set(SOURCE.URL, request.url)
            .returning()
            .fetchOne()!!

    fun update(
        id: Long,
        name: String,
        enabled: Boolean,
    ): SourceRecord? =
        dsl
            .update(SOURCE)
            .set(SOURCE.NAME, name)
            .set(SOURCE.ENABLED, enabled)
            .where(SOURCE.ID.eq(id))
            .returning()
            .fetchOne()

    fun delete(id: Long): Boolean = dsl.deleteFrom(SOURCE).where(SOURCE.ID.eq(id)).execute() > 0
}
