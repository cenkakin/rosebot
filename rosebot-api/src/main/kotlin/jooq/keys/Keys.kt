package jooq.keys

import jooq.tables.Articles
import jooq.tables.records.ArticlesRecord
import org.jooq.UniqueKey
import org.jooq.impl.Internal

val ARTICLES_PKEY: UniqueKey<ArticlesRecord> = Internal.createUniqueKey(
    Articles.ARTICLES,
    "articles_pkey",
    arrayOf(Articles.ARTICLES.ID),
    true
)
