package com.github.cenkakin.rosebot.repository

import jooq.Tables.ARTICLES
import jooq.tables.records.ArticlesRecord
import org.jooq.DSLContext
import org.springframework.stereotype.Repository

@Repository
class ArticleRepository(private val dsl: DSLContext) {

    fun findAll(): List<ArticlesRecord> =
        dsl.selectFrom(ARTICLES).orderBy(ARTICLES.CREATED_AT.desc()).fetchInto(ArticlesRecord::class.java)

    fun findById(id: Long): ArticlesRecord? =
        dsl.selectFrom(ARTICLES).where(ARTICLES.ID.eq(id)).fetchOneInto(ArticlesRecord::class.java)

    fun create(title: String, content: String): ArticlesRecord =
        dsl.insertInto(ARTICLES)
            .set(ARTICLES.TITLE, title)
            .set(ARTICLES.CONTENT, content)
            .returning()
            .fetchOneInto(ArticlesRecord::class.java)!!

    fun update(id: Long, title: String, content: String): ArticlesRecord? =
        dsl.update(ARTICLES)
            .set(ARTICLES.TITLE, title)
            .set(ARTICLES.CONTENT, content)
            .set(ARTICLES.UPDATED_AT, java.time.OffsetDateTime.now())
            .where(ARTICLES.ID.eq(id))
            .returning()
            .fetchOneInto(ArticlesRecord::class.java)

    fun delete(id: Long): Boolean =
        dsl.deleteFrom(ARTICLES).where(ARTICLES.ID.eq(id)).execute() > 0
}
