package com.github.cenkakin.rosebot.cluster

import com.github.cenkakin.rosebot.feed.FeedItemQueryBuilder
import jooq.tables.references.CLUSTER
import jooq.tables.references.FEED_ITEM
import jooq.tables.references.SOURCE
import jooq.tables.references.SYSTEM_STATE
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL
import java.time.OffsetDateTime
import jooq.enums.ClusterStatus as JooqClusterStatus

class ClusterRepository(
    private val dsl: DSLContext,
) {
    /** Returns all ACTIVE clusters sorted by article_count DESC, with one row per feed item
     *  (for sourceMix aggregation in the service layer). */
    fun findActive(): List<Record> =
        dsl
            .select(
                CLUSTER.ID,
                CLUSTER.LABEL,
                CLUSTER.SUMMARY,
                CLUSTER.ARTICLE_COUNT,
                CLUSTER.WINDOW_START,
                CLUSTER.WINDOW_END,
                SOURCE.TYPE,
            ).from(CLUSTER)
            .leftJoin(FEED_ITEM)
            .on(FEED_ITEM.CLUSTER_ID.eq(CLUSTER.ID))
            .leftJoin(SOURCE)
            .on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
            .where(CLUSTER.STATUS.eq(JooqClusterStatus.ACTIVE))
            .orderBy(CLUSTER.ARTICLE_COUNT.desc())
            .fetch()

    fun findItemsByCluster(
        clusterId: Long?,
        userId: Long,
        before: OffsetDateTime?,
        after: OffsetDateTime?,
        limit: Int,
    ): List<Record> {
        val clusterCondition =
            if (clusterId != null) {
                FEED_ITEM.CLUSTER_ID.eq(clusterId)
            } else {
                FEED_ITEM.CLUSTER_ID.isNull
            }

        return FeedItemQueryBuilder
            .baseQuery(dsl, userId, includeSavedAt = true)
            .where(
                clusterCondition
                    .and(after?.let { FEED_ITEM.PUBLISHED_AT.gt(it) } ?: DSL.noCondition())
                    .and(before?.let { FEED_ITEM.PUBLISHED_AT.lt(it) } ?: DSL.noCondition()),
            ).orderBy(FEED_ITEM.PUBLISHED_AT.desc())
            .limit(limit)
            .fetch()
    }

    fun fetchLastClustered(): OffsetDateTime? =
        dsl
            .select(SYSTEM_STATE.LAST_CLUSTERED_AT)
            .from(SYSTEM_STATE)
            .limit(1)
            .fetchOne(SYSTEM_STATE.LAST_CLUSTERED_AT)

    fun fetchJustInCount(lastClustered: OffsetDateTime?): Int =
        dsl
            .selectCount()
            .from(FEED_ITEM)
            .where(
                FEED_ITEM.CLUSTER_ID.isNull
                    .and(lastClustered?.let { FEED_ITEM.PUBLISHED_AT.gt(it) } ?: DSL.noCondition()),
            ).fetchOne(0, Int::class.java) ?: 0

    fun fetchUncategorisedCount(
        since: OffsetDateTime?,
        lastClustered: OffsetDateTime?,
    ): Int =
        dsl
            .selectCount()
            .from(FEED_ITEM)
            .where(
                FEED_ITEM.CLUSTER_ID.isNull
                    .and(FEED_ITEM.AI_SUMMARY.isNotNull)
                    .and(since?.let { FEED_ITEM.PUBLISHED_AT.gt(it) } ?: DSL.noCondition())
                    .and(lastClustered?.let { FEED_ITEM.PUBLISHED_AT.le(it) } ?: DSL.noCondition()),
            ).fetchOne(0, Int::class.java) ?: 0

    fun insertPending(newClusters: List<NewCluster>): Map<Long, List<Long>> {
        if (newClusters.isEmpty()) return emptyMap()

        val insertedIds =
            dsl
                .insertInto(
                    CLUSTER,
                    CLUSTER.LABEL,
                    CLUSTER.SUMMARY,
                    CLUSTER.STATUS,
                    CLUSTER.ARTICLE_COUNT,
                    CLUSTER.WINDOW_START,
                    CLUSTER.WINDOW_END,
                ).valuesOfRows(
                    newClusters.map { nc ->
                        DSL.row(
                            nc.label,
                            nc.summary,
                            JooqClusterStatus.PENDING,
                            nc.articleCount,
                            nc.windowStart,
                            nc.windowEnd,
                        )
                    },
                ).returning(CLUSTER.ID)
                .fetch(CLUSTER.ID)

        return insertedIds.zip(newClusters).associate { (clusterId, nc) ->
            clusterId!! to nc.feedItemIds
        }
    }

    fun deactivateActive() {
        dsl
            .update(CLUSTER)
            .set(CLUSTER.STATUS, JooqClusterStatus.INACTIVE)
            .where(CLUSTER.STATUS.eq(JooqClusterStatus.ACTIVE))
            .execute()
    }

    fun activatePending(clusterIds: List<Long>) {
        dsl
            .update(CLUSTER)
            .set(CLUSTER.STATUS, JooqClusterStatus.ACTIVE)
            .where(CLUSTER.ID.`in`(clusterIds))
            .execute()
    }

    fun assignFeedItems(clusterToFeedItems: Map<Long, List<Long>>) {
        val feedItemUpdates =
            clusterToFeedItems.map { (clusterId, itemIds) ->
                dsl
                    .update(FEED_ITEM)
                    .set(FEED_ITEM.CLUSTER_ID, clusterId)
                    .where(FEED_ITEM.ID.`in`(itemIds))
            }
        if (feedItemUpdates.isNotEmpty()) dsl.batch(feedItemUpdates).execute()
    }

    fun deleteInactive() {
        dsl.deleteFrom(CLUSTER).where(CLUSTER.STATUS.eq(JooqClusterStatus.INACTIVE)).execute()
    }

    fun updateLastClustered(timestamp: OffsetDateTime) {
        dsl.update(SYSTEM_STATE).set(SYSTEM_STATE.LAST_CLUSTERED_AT, timestamp).execute()
    }
}
