package com.github.cenkakin.rosebot.source

import com.github.cenkakin.rosebot.source.dto.SourceRequest
import jooq.enums.SourceType
import jooq.tables.records.SourceRecord
import jooq.tables.references.SOURCE
import org.jooq.DSLContext

class SourceRepository(
    private val dsl: DSLContext,
) {
    fun findAll(): List<SourceRecord> = dsl.selectFrom(SOURCE).orderBy(SOURCE.CREATED_AT.asc()).fetch()

    fun findAllEnabled(): List<SourceRecord> = dsl.selectFrom(SOURCE).where(SOURCE.ENABLED.isTrue).fetch()

    fun findById(id: Long): SourceRecord? = dsl.selectFrom(SOURCE).where(SOURCE.ID.eq(id)).fetchOne()

    fun findEnabledBySourceType(sourceType: SourceType): List<SourceRecord> =
        dsl
            .selectFrom(SOURCE)
            .where(
                SOURCE.TYPE
                    .eq(sourceType)
                    .and(SOURCE.ENABLED.isTrue),
            ).fetch()

    fun create(request: SourceRequest): SourceRecord =
        dsl
            .insertInto(SOURCE)
            .set(SOURCE.TYPE, request.type.toJooqEnum())
            .set(SOURCE.NAME, request.name)
            .set(SOURCE.URL, request.url)
            .set(SOURCE.HOMEPAGE, request.homepage)
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
