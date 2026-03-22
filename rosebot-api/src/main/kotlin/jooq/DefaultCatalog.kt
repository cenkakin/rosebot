package jooq

import org.jooq.Schema
import org.jooq.impl.CatalogImpl

object DefaultCatalog : CatalogImpl("") {
    override fun getSchemas(): List<Schema> = listOf(Public)
}
