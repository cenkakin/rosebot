package com.github.cenkakin.rosebot.ingestion.connector.news

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.source.Source
import com.github.cenkakin.rosebot.source.SourceType
import com.rometools.rome.io.SyndFeedInput
import com.rometools.rome.io.XmlReader
import org.jsoup.Jsoup
import java.net.URL
import java.time.Instant

class RssConnector : SourceConnector {
    override val type = SourceType.NEWS

    override fun fetch(source: Source): List<FeedItemDraft> {
        val feed = SyndFeedInput().build(XmlReader(URL(source.url)))
        return feed.entries.mapNotNull { entry ->
            val externalId = entry.uri ?: entry.link ?: return@mapNotNull null
            val publishedAt = (entry.publishedDate ?: entry.updatedDate)?.toInstant() ?: Instant.now()
            val updatedAt = entry.updatedDate?.toInstant()
            val summary =
                entry.description
                    ?.value
                    ?.let { Jsoup.parse(it).text() }
                    ?.takeIf { it.isNotBlank() }

            FeedItemDraft(
                externalId = externalId,
                title = Jsoup.parse(entry.title ?: "").text(),
                content = entry.contents.firstOrNull()?.value,
                url = entry.link,
                thumbnailUrl = null,
                author =
                    entry.authors.firstOrNull()?.name
                        ?: entry.author?.takeIf { it.isNotBlank() },
                engagement = null,
                publishedAt = publishedAt,
                updatedAt = updatedAt,
                summary = summary,
            )
        }
    }
}
