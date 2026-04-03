# Plan 10 — Ingestion Module

## Goal

Create `rosebot-ingestion`: a standalone Spring Boot application that polls enabled sources,
fetches content via external APIs / crawlers, and writes deduplicated `feed_item` rows to the
shared PostgreSQL database.

---

## Current module layout (after Phase 0)

```
rosebot/
├── pom.xml
├── rosebot-domain/
│   ├── infrastructure/    (rosebot-infrastructure) — JOOQ sources, Flyway SQL
│   ├── domain/            (rosebot-domain-core)    — user, source, feed, saved, summary, appstate
│   └── auth/              (rosebot-auth)            — JwtService, AuthService, AuthenticatedUser
├── rosebot-api/           — controllers, SecurityConfig, JwtAuthFilter, RosebotApiConfig
├── rosebot-ingestion/     ← NEW (this plan)
└── rosebot-web-app/
```

---

## `rosebot-ingestion` dependencies

- `rosebot-infrastructure` — JOOQ + DB access
- `rosebot-domain-core` — SourceRepository, FeedItemRepository, etc.
- `spring-boot-starter` (no web, no security — ingestion has no HTTP endpoints)
- `jackson-module-kotlin`
- Testcontainers (test scope)

Does **not** depend on `rosebot-auth` (no JWT, no user context needed).

---

## Architecture

```
rosebot-ingestion/
└── src/main/kotlin/com/github/cenkakin/rosebot/ingestion/
    ├── IngestionApplication.kt
    ├── config/
    │   └── IngestionConfig.kt          ← explicit bean registration (same rule as api)
    ├── connector/
    │   ├── SourceConnector.kt          ← interface
    │   ├── FeedItemDraft.kt            ← shared output model
    │   ├── news/
    │   │   └── RssConnector.kt         ← Rome RSS/Atom parser
    │   └── reddit/
    │       └── RedditConnector.kt      ← Reddit public JSON API
    ├── ingestion/
    │   ├── IngestionService.kt         ← orchestrates: load sources → connector → write
    │   └── FeedItemWriter.kt           ← upsert via ON CONFLICT DO NOTHING
    └── scheduler/
        └── IngestionScheduler.kt       ← @Scheduled polling
```

---

## Phase 1 — Module skeleton

- `rosebot-ingestion/pom.xml`: parent = root rosebot, no `spring-boot-starter-web`, no security
- Register `rosebot-ingestion` in root `pom.xml` modules
- `IngestionApplication.kt` with `@SpringBootApplication`
- `application.yml` + `application-dev.properties` / secrets (same pattern as api)
- `IngestionConfig.kt`: explicit bean wiring, no `@Service`/`@Component` annotations

---

## Phase 2 — `SourceConnector` interface + `FeedItemDraft`

```kotlin
interface SourceConnector {
    val type: SourceType
    fun fetch(source: SourceRecord): List<FeedItemDraft>
}

data class FeedItemDraft(
    val externalId: String,
    val title: String,
    val content: String?,
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: Instant,
)
```

---

## Phase 3 — News/RSS connector

Library: `com.rometools:rome`

- Parse RSS/Atom feed at `source.url`
- Map each `SyndEntry` → `FeedItemDraft`
- `externalId`: entry URI or link (stable per article)
- Handle missing `publishedDate` gracefully (fall back to `updatedDate` → `now()`)

---

## Phase 4 — Reddit connector

Reddit public JSON API — no auth required for public subreddits:

- `GET https://www.reddit.com/r/{subreddit}.json?limit=25`
- `source.url` stores the subreddit listing URL
- `externalId`: post `id` (e.g. `t3_abc123`)
- `engagement`: `{ "score": N, "num_comments": N, "upvote_ratio": 0.95 }`
- Rely on deduplication (`ON CONFLICT DO NOTHING`) rather than cursor tracking
- Set a descriptive `User-Agent` header (Reddit requirement)

---

## Phase 5 — `FeedItemWriter` + deduplication

```kotlin
dsl.insertInto(FEED_ITEM)
   .set(...)
   .onConflict(FEED_ITEM.SOURCE_ID, FEED_ITEM.EXTERNAL_ID)
   .doNothing()
   .execute()
```

No exception on duplicate — silently skipped. Log counts per run:
```
[ingestion] source=HackerNews new=12 dupes=3 duration=840ms
```

---

## Phase 6 — Scheduling + error isolation

```kotlin
@Scheduled(fixedDelayString = "\${ingestion.poll-interval-ms:300000}")
fun pollAll() { ... }
```

- Configurable per-source-type poll interval
- Connector failure for one source is caught and logged — does not abort other sources
- Spring Actuator `/actuator/health` for liveness

---

## Feed structure analysis — Jacobin (Atom 1.0)

Jacobin publishes Atom 1.0, not RSS 2.0. Rome handles both transparently.

### Fields per entry

| Atom element | Example | Maps to |
|---|---|---|
| `<id>` | `https://jacobin.com/2026/03/muskism-...` | `external_id` |
| `<title type="html">` | `Muskism Is the Specter...` | `title` (strip HTML entities) |
| `<link href>` | same URL as id | `url` |
| `<author><name>` | `Alex Hochuli` | `author` |
| `<published>` | `2026-03-30T13:29:18Z` | `published_at` |
| `<updated>` | `2026-03-30T13:37:42Z` | `updated_at` ← **new column on feed_item** |
| `<summary type="html">` | `<p>In probably the most famous...</p>` | stripped → **`summary` table** with `model = "feed"` |
| `<content type="html">` | full article HTML | `content` on `feed_item` (raw HTML, kept for future reader view) |
| thumbnail | — not present — | `thumbnail_url` = null |
| engagement | — not present — | `engagement` = null |

### Design

`feed_item.content` stores the full article HTML from `<content>` (not rendered in card UI).

`<summary>` is stripped of HTML tags (Jsoup) at ingestion time and written to the `summary` table.
Feed-sourced summaries flow through the same `SummaryService`/`SummaryRepository` path as AI-generated
ones — no new columns on `feed_item`, no API or DTO changes required. The `model` column is removed from
`summary` (not needed). Deduplication: `summary.feed_item_id` is `UNIQUE`, so a second ingestion run does
`ON CONFLICT DO NOTHING`.

### Required changes

**Schema — update `V1__create_schema.sql` directly (fresh-start approach):**
- Add `updated_at TIMESTAMPTZ` to `feed_item`
- Remove `model TEXT NOT NULL` from `summary`

**`FeedItemDraft` (ingestion) — add `updatedAt` + `feedSummary`:**
```kotlin
data class FeedItemDraft(
    val externalId: String,
    val title: String,
    val content: String?,      // raw HTML from <content>, for future reader view
    val url: String,
    val thumbnailUrl: String?,
    val author: String?,
    val engagement: Map<String, Any>?,
    val publishedAt: Instant,
    val updatedAt: Instant?,   // from <updated>
    val feedSummary: String?,  // plain text stripped from <summary>, written to summary table
)
```

**`IngestionService` — after inserting a new `feed_item`, if `feedSummary` is non-null:**
```kotlin
val id = feedItemWriter.insert(source.id!!, draft)
if (id != null) {
    draft.feedSummary?.let { summaryRepository.insert(id, it) }
}
```

**`SummaryRepository` — new `insert` method:**
```kotlin
fun insert(feedItemId: Long, content: String) {
    dsl.insertInto(SUMMARY)
       .set(SUMMARY.FEED_ITEM_ID, feedItemId)
       .set(SUMMARY.CONTENT, content)
       .onConflict(SUMMARY.FEED_ITEM_ID)
       .doNothing()
       .execute()
}
```

**RSS connector — stripping logic:**
Rome's `SyndEntry.description.value` (= `<summary>`) is HTML. Strip tags with Jsoup:
```kotlin
val feedSummary = entry.description?.value
    ?.let { Jsoup.parse(it).text() }
    ?.takeIf { it.isNotBlank() }
val content = entry.contents.firstOrNull()?.value  // raw HTML, store as-is
```

**`FeedCard` UI — rename chip label from "AI Summary" to "Summary":**
```tsx
// Before
label={isActive ? '📋 AI Summary ✕' : '📋 AI Summary ▸'}

// After
label={isActive ? '📋 Summary ✕' : '📋 Summary ▸'}
```

---

## Decisions

- **Twitter connector**: skipped for now — API credential/tier requirements unclear
- **Full article text**: RSS gives title + excerpt only; Jsoup enrichment deferred
- **Admin trigger endpoint**: not planned — pure schedule is sufficient for now
- **Separate process**: `rosebot-ingestion` is a separate Spring Boot app (independent deploy)
- **Flyway**: ingestion does NOT run migrations — `rosebot-api` owns schema lifecycle

---

## Root `pom.xml` additions

```xml
<modules>
    ...
    <module>rosebot-ingestion</module>   ← after rosebot-domain, before or after rosebot-api
</modules>
```

No new `<dependencyManagement>` entries needed (ingestion depends on domain modules already managed).
