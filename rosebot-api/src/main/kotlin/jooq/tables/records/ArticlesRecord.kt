package jooq.tables.records

import jooq.tables.Articles
import org.jooq.impl.UpdatableRecordImpl
import java.time.OffsetDateTime

open class ArticlesRecord() : UpdatableRecordImpl<ArticlesRecord>(Articles.ARTICLES) {

    var id: Long?
        set(value): Unit = set(0, value)
        get(): Long? = get(0) as Long?

    var title: String?
        set(value): Unit = set(1, value)
        get(): String? = get(1) as String?

    var content: String?
        set(value): Unit = set(2, value)
        get(): String? = get(2) as String?

    var createdAt: OffsetDateTime?
        set(value): Unit = set(3, value)
        get(): OffsetDateTime? = get(3) as OffsetDateTime?

    var updatedAt: OffsetDateTime?
        set(value): Unit = set(4, value)
        get(): OffsetDateTime? = get(4) as OffsetDateTime?
}
