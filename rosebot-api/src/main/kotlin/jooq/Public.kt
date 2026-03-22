package jooq

import jooq.tables.Articles
import org.jooq.Table
import org.jooq.impl.SchemaImpl

object Public : SchemaImpl("public", DefaultCatalog) {
    override fun getTables(): List<Table<*>> = listOf(Articles.ARTICLES)
}
