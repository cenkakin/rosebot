# Plan 10d — Ingestion Module: Detailed Implementation

RSS/Atom ingestion only (no Reddit). Stores summaries from `<summary>` into the `summary` table.

---

## Execution order

1. Update `V1__create_schema.sql` directly (fresh-start approach)
2. Regenerate JOOQ sources
3. Domain-core changes:
   - Remove `model` from `SummaryResponse` + `SummaryService`
   - New `FeedItemDraft`
   - `SourceService.findAllEnabled()`
   - `SummaryService.insert()`
4. Frontend type fix — remove `model` from `SummaryResponse`
5. `rosebot-ingestion` module (pom, sources, config, application.yml, dev.properties, secrets template)
6. Register `rosebot-ingestion` in root pom.xml (modules + dependencyManagement)
7. UI label change in `FeedCard`

---

## Step 1 — Update `V1__create_schema.sql`

**File:** `rosebot-domain/infrastructure/src/main/resources/db/migration/V1__create_schema.sql`

Two changes inline (fresh-start — drop and recreate dev DB):

```sql
CREATE TABLE feed_item (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES source(id) ON DELETE CASCADE,
    external_id   TEXT        NOT NULL,
    title         TEXT        NOT NULL,
    content       TEXT,
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    author        TEXT,
    engagement    JSONB,
    published_at  TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ,                    -- ← new
    ingested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_id, external_id)
);

CREATE TABLE summary (
    id           BIGSERIAL PRIMARY KEY,
    feed_item_id BIGINT NOT NULL UNIQUE REFERENCES feed_item(id) ON DELETE CASCADE,
    content      TEXT   NOT NULL,
    -- model column removed
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Recreate dev DB after editing:

```bash
psql -U rosebot -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Step 2 — Regenerate JOOQ

```bash
mvn -pl rosebot-domain/infrastructure --also-make -P generate-jooq generate-sources
```

Resulting changes in generated sources:
- `FEED_ITEM.UPDATED_AT` added
- `SUMMARY.MODEL` removed

---

## Step 3 — Domain-core changes

### 3a. Remove `model` from `SummaryResponse`

**File:** `rosebot-domain/domain/src/main/kotlin/com/github/cenkakin/rosebot/summary/dto/SummaryResponse.kt`

```kotlin
data class SummaryResponse(
    val content: String,
    val generatedAt: String,
)
```

### 3b. Update `SummaryService` — remove `model`, add `insert`

**File:** `rosebot-domain/domain/src/main/kotlin/com/github/cenkakin/rosebot/summary/SummaryService.kt`

```kotlin
class SummaryService(
    private val summaryRepository: SummaryRepository,
) {
    fun get(feedItemId: Long): SummaryResponse =
        summaryRepository
            .findByFeedItem(feedItemId)
            ?.let { SummaryResponse(it.content!!, it.generatedAt!!.toInstant().toString()) }
            ?: throw NoSuchElementException("No summary for feed item $feedItemId")

    fun getBatch(itemIds: List<Long>): Map<Long, SummaryResponse> =
        summaryRepository
            .findByFeedItemIds(itemIds)
            .associate { record ->
                record.feedItemId!! to SummaryResponse(
                    content = record.content!!,
                    generatedAt = record.generatedAt!!.toInstant().toString(),
                )
            }

    fun insert(feedItemId: Long, content: String) =
        summaryRepository.insert(feedItemId, content)
}
```

### 3c. Add `insert` to `SummaryRepository`

**File:** `rosebot-domain/domain/src/main/kotlin/com/github/cenkakin/rosebot/summary/SummaryRepository.kt`

Add after `findByFeedItemIds()`:

```kotlin
fun insert(feedItemId: Long, content: String) {
    dsl
        .insertInto(SUMMARY)
        .set(SUMMARY.FEED_ITEM_ID, feedItemId)
        .set(SUMMARY.CONTENT, content)
        .onConflict(SUMMARY.FEED_ITEM_ID)
        .doNothing()
        .execute()
}
```

### 3d. New file: `FeedItemDraft.kt`

**File:** `rosebot-domain/domain/src/main/kotlin/com/github/cenkakin/rosebot/feed/FeedItemDraft.kt`

```kotlin
package com.github.cenkakin.rosebot.feed

import java.time.Instant

data class FeedItemDraft(
    val externalId: String,
    val title: String,
    val content: String?,
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: Instant,
    val updatedAt: Instant?,
    val feedSummary: String?,
)
```

### 3e. Add `findAllEnabled` to `SourceRepository` and `SourceService`

**`SourceRepository`** — add after `findAll()`:

```kotlin
fun findAllEnabled(): List<SourceRecord> =
    dsl.selectFrom(SOURCE).where(SOURCE.ENABLED.isTrue).fetch()
```

**`SourceService`** — add:

```kotlin
fun findAllEnabled(): List<SourceRecord> = sourceRepository.findAllEnabled()
```

`SourceService.findAllEnabled()` returns `List<SourceRecord>` intentionally — ingestion passes
the record directly to connectors (url, type, id). This is an internal, non-API method.

---

## Step 4 — Frontend type fix

**File:** `rosebot-web-app/src/types/summary.ts`

Remove `model` — the field is gone from the backend DTO and is not used anywhere in the UI.

```typescript
export interface SummaryResponse {
  feedItemId: number
  content: string
  generatedAt: string
}
```

---

## Step 5 — `rosebot-ingestion` module

### 5a. Directory structure

```
rosebot-ingestion/
├── pom.xml
└── src/
    └── main/
        ├── kotlin/com/github/cenkakin/rosebot/ingestion/
        │   ├── IngestionApplication.kt
        │   ├── config/
        │   │   └── IngestionConfig.kt
        │   ├── connector/
        │   │   ├── SourceConnector.kt
        │   │   └── news/
        │   │       └── RssConnector.kt
        │   ├── ingestion/
        │   │   ├── FeedItemWriter.kt           ← repository (owns DSLContext + SQL)
        │   │   ├── FeedItemIngestionService.kt ← service (wraps writer + summary)
        │   │   └── IngestionService.kt         ← orchestrator (talks to services only)
        │   └── scheduler/
        │       └── IngestionScheduler.kt
        └── resources/
            ├── application.yml
            ├── application-dev.properties
            └── application-dev-secrets.properties.template
```

### 5b. `pom.xml`

Versions for `rome` and `jsoup` come from root `pom.xml` `<dependencyManagement>` (see Step 6).
`spring-boot-starter-web` is included to expose actuator over HTTP on port 8090.

**File:** `rosebot-ingestion/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.github.cenkakin</groupId>
        <artifactId>rosebot</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>

    <artifactId>rosebot-ingestion</artifactId>
    <name>rosebot-ingestion</name>

    <dependencies>
        <!-- Domain (transitively includes rosebot-infrastructure → JOOQ, datasource) -->
        <dependency>
            <groupId>com.github.cenkakin</groupId>
            <artifactId>rosebot-domain-core</artifactId>
        </dependency>

        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Kotlin -->
        <dependency>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-reflect</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.module</groupId>
            <artifactId>jackson-module-kotlin</artifactId>
        </dependency>

        <!-- RSS/Atom parser -->
        <dependency>
            <groupId>com.rometools</groupId>
            <artifactId>rome</artifactId>
        </dependency>

        <!-- HTML tag stripping for <summary> -->
        <dependency>
            <groupId>org.jsoup</groupId>
            <artifactId>jsoup</artifactId>
        </dependency>

        <!-- Database driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <sourceDirectory>${project.basedir}/src/main/kotlin</sourceDirectory>
        <testSourceDirectory>${project.basedir}/src/test/kotlin</testSourceDirectory>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.jetbrains.kotlin</groupId>
                <artifactId>kotlin-maven-plugin</artifactId>
                <configuration>
                    <args>
                        <arg>-Xjsr305=strict</arg>
                    </args>
                    <compilerPlugins>
                        <plugin>spring</plugin>
                    </compilerPlugins>
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>org.jetbrains.kotlin</groupId>
                        <artifactId>kotlin-maven-allopen</artifactId>
                        <version>${kotlin.version}</version>
                    </dependency>
                </dependencies>
                <executions>
                    <execution>
                        <id>compile</id>
                        <goals>
                            <goal>compile</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>test-compile</id>
                        <goals>
                            <goal>test-compile</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>com.github.gantsign.maven</groupId>
                <artifactId>ktlint-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

### 5c. `IngestionApplication.kt`

```kotlin
package com.github.cenkakin.rosebot.ingestion

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class IngestionApplication

fun main(args: Array<String>) {
    runApplication<IngestionApplication>(*args)
}
```

### 5d. `SourceConnector.kt`

```kotlin
package com.github.cenkakin.rosebot.ingestion.connector

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.source.SourceType
import jooq.tables.records.SourceRecord

interface SourceConnector {
    val type: SourceType
    fun fetch(source: SourceRecord): List<FeedItemDraft>
}
```

### 5e. `RssConnector.kt`

```kotlin
package com.github.cenkakin.rosebot.ingestion.connector.news

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.source.SourceType
import com.rometools.rome.io.SyndFeedInput
import com.rometools.rome.io.XmlReader
import jooq.tables.records.SourceRecord
import org.jsoup.Jsoup
import java.net.URL
import java.time.Instant

class RssConnector : SourceConnector {
    override val type = SourceType.NEWS

    override fun fetch(source: SourceRecord): List<FeedItemDraft> {
        val feed = SyndFeedInput().build(XmlReader(URL(source.url)))
        return feed.entries.mapNotNull { entry ->
            val externalId = entry.uri ?: entry.link ?: return@mapNotNull null
            val publishedAt = (entry.publishedDate ?: entry.updatedDate)?.toInstant() ?: Instant.now()
            val updatedAt = entry.updatedDate?.toInstant()
            val feedSummary = entry.description?.value
                ?.let { Jsoup.parse(it).text() }
                ?.takeIf { it.isNotBlank() }

            FeedItemDraft(
                externalId = externalId,
                title = Jsoup.parse(entry.title ?: "").text(),
                content = entry.contents.firstOrNull()?.value,
                url = entry.link,
                thumbnailUrl = null,
                author = entry.authors.firstOrNull()?.name
                    ?: entry.author?.takeIf { it.isNotBlank() },
                engagement = null,
                publishedAt = publishedAt,
                updatedAt = updatedAt,
                feedSummary = feedSummary,
            )
        }
    }
}
```

`mapNotNull` skips entries where both `uri` and `link` are null (malformed feed entry).

### 5f. `FeedItemWriter.kt`

Repository — owns all INSERT SQL for `feed_item`. Returns the new row ID or `null` on duplicate.

```kotlin
package com.github.cenkakin.rosebot.ingestion.ingestion

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.cenkakin.rosebot.feed.FeedItemDraft
import jooq.Tables.FEED_ITEM
import org.jooq.DSLContext
import org.jooq.JSONB
import java.time.ZoneOffset

class FeedItemWriter(
    private val dsl: DSLContext,
    private val objectMapper: ObjectMapper,
) {
    fun insert(sourceId: Long, draft: FeedItemDraft): Long? =
        dsl
            .insertInto(FEED_ITEM)
            .set(FEED_ITEM.SOURCE_ID, sourceId)
            .set(FEED_ITEM.EXTERNAL_ID, draft.externalId)
            .set(FEED_ITEM.TITLE, draft.title)
            .set(FEED_ITEM.CONTENT, draft.content)
            .set(FEED_ITEM.URL, draft.url)
            .set(FEED_ITEM.THUMBNAIL_URL, draft.thumbnailUrl)
            .set(FEED_ITEM.AUTHOR, draft.author)
            .set(
                FEED_ITEM.ENGAGEMENT,
                draft.engagement?.let { JSONB.jsonb(objectMapper.writeValueAsString(it)) },
            )
            .set(FEED_ITEM.PUBLISHED_AT, draft.publishedAt.atOffset(ZoneOffset.UTC))
            .set(FEED_ITEM.UPDATED_AT, draft.updatedAt?.atOffset(ZoneOffset.UTC))
            .onConflict(FEED_ITEM.SOURCE_ID, FEED_ITEM.EXTERNAL_ID)
            .doNothing()
            .returning(FEED_ITEM.ID)
            .fetchOne()?.id
}
```

### 5g. `FeedItemIngestionService.kt`

Service — wraps `FeedItemWriter` and `SummaryService`. Returns `true` if new, `false` if duplicate.

```kotlin
package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.feed.FeedItemDraft
import com.github.cenkakin.rosebot.summary.SummaryService

class FeedItemIngestionService(
    private val feedItemWriter: FeedItemWriter,
    private val summaryService: SummaryService,
) {
    fun ingest(sourceId: Long, draft: FeedItemDraft): Boolean {
        val id = feedItemWriter.insert(sourceId, draft) ?: return false
        draft.feedSummary?.let { summaryService.insert(id, it) }
        return true
    }
}
```

### 5h. `IngestionService.kt`

Orchestrator — calls `SourceService` and `FeedItemIngestionService` only. No repositories.

```kotlin
package com.github.cenkakin.rosebot.ingestion.ingestion

import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.source.SourceService
import jooq.tables.records.SourceRecord
import org.slf4j.LoggerFactory

class IngestionService(
    private val sourceService: SourceService,
    private val feedItemIngestionService: FeedItemIngestionService,
    private val connectors: List<SourceConnector>,
) {
    private val log = LoggerFactory.getLogger(IngestionService::class.java)

    fun pollAll() {
        val sources = sourceService.findAllEnabled()
        sources.forEach { source ->
            runCatching { ingest(source) }
                .onFailure { log.error("[ingestion] source={} failed: {}", source.name, it.message, it) }
        }
    }

    private fun ingest(source: SourceRecord) {
        val connector = connectors.find { it.type.name == source.type!!.literal }
            ?: run {
                log.warn("[ingestion] no connector for source type={}", source.type!!.literal)
                return
            }

        val start = System.currentTimeMillis()
        val drafts = connector.fetch(source)
        var newCount = 0
        var dupeCount = 0

        drafts.forEach { draft ->
            if (feedItemIngestionService.ingest(source.id!!, draft)) newCount++ else dupeCount++
        }

        log.info(
            "[ingestion] source={} new={} dupes={} duration={}ms",
            source.name, newCount, dupeCount, System.currentTimeMillis() - start,
        )
    }
}
```

### 5i. `IngestionScheduler.kt`

```kotlin
package com.github.cenkakin.rosebot.ingestion.scheduler

import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import org.springframework.scheduling.annotation.Scheduled

class IngestionScheduler(
    private val ingestionService: IngestionService,
) {
    @Scheduled(fixedDelayString = "\${ingestion.poll-interval-ms:300000}")
    fun pollAll() {
        ingestionService.pollAll()
    }
}
```

### 5j. `IngestionConfig.kt`

Follows the same inline pattern as `RosebotApiConfig`: repositories are created inline inside their
owning service's `@Bean` method, not as separate beans.

```kotlin
package com.github.cenkakin.rosebot.ingestion.config

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.github.cenkakin.rosebot.ingestion.connector.SourceConnector
import com.github.cenkakin.rosebot.ingestion.connector.news.RssConnector
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemIngestionService
import com.github.cenkakin.rosebot.ingestion.ingestion.FeedItemWriter
import com.github.cenkakin.rosebot.ingestion.ingestion.IngestionService
import com.github.cenkakin.rosebot.ingestion.scheduler.IngestionScheduler
import com.github.cenkakin.rosebot.source.SourceRepository
import com.github.cenkakin.rosebot.source.SourceService
import com.github.cenkakin.rosebot.summary.SummaryRepository
import com.github.cenkakin.rosebot.summary.SummaryService
import org.jooq.DSLContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class IngestionConfig {
    @Bean
    fun rssConnector(): SourceConnector = RssConnector()

    @Bean
    fun feedItemIngestionService(dsl: DSLContext) =
        FeedItemIngestionService(
            FeedItemWriter(dsl, jacksonObjectMapper()),
            SummaryService(SummaryRepository(dsl)),
        )

    @Bean
    fun ingestionService(
        dsl: DSLContext,
        feedItemIngestionService: FeedItemIngestionService,
        connectors: List<SourceConnector>,
    ) = IngestionService(SourceService(SourceRepository(dsl)), feedItemIngestionService, connectors)

    @Bean
    fun ingestionScheduler(ingestionService: IngestionService) = IngestionScheduler(ingestionService)
}
```

### 5k. `application.yml`

**File:** `rosebot-ingestion/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: ${prop.spring.datasource.url}
    username: ${prop.spring.datasource.username}
    password: ${prop.spring.datasource.password}
  jooq:
    sql-dialect: POSTGRES

server:
  port: 8090

ingestion:
  poll-interval-ms: 300000

management:
  endpoints:
    web:
      exposure:
        include: health
```

Note: Flyway is NOT on the classpath — only `rosebot-api` has flyway dependencies.

### 5l. `application-dev.properties`

**File:** `rosebot-ingestion/src/main/resources/application-dev.properties`

```properties
spring.config.import=application-dev-secrets.properties

prop.spring.datasource.url=jdbc:postgresql://localhost:5432/rosebot
prop.spring.datasource.username=rosebot
prop.spring.datasource.password=rosebot
```

### 5m. `application-dev-secrets.properties.template`

**File:** `rosebot-ingestion/src/main/resources/application-dev-secrets.properties.template`

```properties
# Ingestion has no additional secrets beyond the datasource (set in application-dev.properties).
# Copy this file to application-dev-secrets.properties if you need to add local overrides.
```

The actual `application-dev-secrets.properties` is already covered by the root `.gitignore` glob
`*-secrets.properties` — no gitignore change needed.

---

## Step 6 — Root `pom.xml`

### 6a. Add properties

```xml
<properties>
    ...
    <rome.version>2.1.0</rome.version>
    <jsoup.version>1.18.3</jsoup.version>
</properties>
```

### 6b. Add to `<dependencyManagement>`

```xml
<dependency>
    <groupId>com.rometools</groupId>
    <artifactId>rome</artifactId>
    <version>${rome.version}</version>
</dependency>
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>${jsoup.version}</version>
</dependency>
<dependency>
    <groupId>com.github.cenkakin</groupId>
    <artifactId>rosebot-ingestion</artifactId>
    <version>${project.version}</version>
</dependency>
```

### 6c. Add to `<modules>`

```xml
<modules>
    <module>rosebot-web-app</module>
    <module>rosebot-domain</module>
    <module>rosebot-api</module>
    <module>rosebot-ingestion</module>   ← add
</modules>
```

---

## Step 7 — UI label change

**File:** `rosebot-web-app/src/features/feed/FeedCard.tsx`

```tsx
// Before
label={isActive ? '📋 AI Summary ✕' : '📋 AI Summary ▸'}

// After
label={isActive ? '📋 Summary ✕' : '📋 Summary ▸'}
```

---

## What does NOT change

| Thing | Reason |
|---|---|
| `FeedItemResponse` DTO | No new columns exposed via API |
| `FeedService` / feed query | Read path is unchanged |
| `SummaryController` | API shape unchanged (`model` removed from response — see 3a/4) |
| `RosebotApiConfig` | No new beans; existing inline constructors unchanged |
| `rosebot-auth`, `rosebot-infrastructure` | No changes needed |

---

## Post-apply verification

```bash
# Build everything
mvn clean package -DskipTests

# Run api tests (requires Docker)
mvn -pl rosebot-api --also-make test

# Start ingestion locally (requires DB + dev secrets)
mvn -pl rosebot-ingestion spring-boot:run -Dspring-boot.run.profiles=dev
```

Expected ingestion log line after first poll:
```
[ingestion] source=Jacobin new=25 dupes=0 duration=1240ms
```

Health check: `curl http://localhost:8090/actuator/health`
