package jooq.tables

import jooq.Public
import jooq.keys.ARTICLES_PKEY
import jooq.tables.records.ArticlesRecord
import org.jooq.ForeignKey
import org.jooq.Identity
import org.jooq.Name
import org.jooq.Record
import org.jooq.Table
import org.jooq.TableField
import org.jooq.TableOptions
import org.jooq.UniqueKey
import org.jooq.impl.DSL
import org.jooq.impl.SQLDataType
import org.jooq.impl.TableImpl
import java.time.OffsetDateTime

open class Articles private constructor(
    alias: Name,
    child: Table<out Record>?,
    path: ForeignKey<out Record, ArticlesRecord>?,
    aliased: Table<ArticlesRecord>?
) : TableImpl<ArticlesRecord>(
    alias,
    Public,
    child,
    path,
    aliased,
    null,
    DSL.comment(""),
    TableOptions.table()
) {
    companion object {
        val ARTICLES: Articles = Articles(DSL.name("articles"), null, null, null)
    }

    val ID: TableField<ArticlesRecord, Long?> =
        createField(DSL.name("id"), SQLDataType.BIGINT.nullable(false).identity(true), this, "")

    val TITLE: TableField<ArticlesRecord, String?> =
        createField(DSL.name("title"), SQLDataType.CLOB.nullable(false), this, "")

    val CONTENT: TableField<ArticlesRecord, String?> =
        createField(DSL.name("content"), SQLDataType.CLOB.nullable(false), this, "")

    val CREATED_AT: TableField<ArticlesRecord, OffsetDateTime?> =
        createField(DSL.name("created_at"), SQLDataType.TIMESTAMPWITHTIMEZONE(6).nullable(false), this, "")

    val UPDATED_AT: TableField<ArticlesRecord, OffsetDateTime?> =
        createField(DSL.name("updated_at"), SQLDataType.TIMESTAMPWITHTIMEZONE(6).nullable(false), this, "")

    override fun getRecordType(): Class<ArticlesRecord> = ArticlesRecord::class.java

    override fun getIdentity(): Identity<ArticlesRecord, *> = super.getIdentity()!!

    override fun getPrimaryKey(): UniqueKey<ArticlesRecord> = ARTICLES_PKEY

    override fun `as`(alias: String): Articles = Articles(DSL.name(alias), null, null, this)

    override fun `as`(alias: Name): Articles = Articles(alias, null, null, this)
}
