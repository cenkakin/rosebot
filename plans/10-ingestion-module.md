# Plan 10 — Ingestion Module

## Goal

Create `rosebot-ingestion`: a standalone Spring Boot application that polls enabled sources,
fetches content via external APIs / crawlers, and writes deduplicated `feed_item` rows to the
shared PostgreSQL database.

---

## Current state

- `source` table: `{ id, type (NEWS|REDDIT|TWITTER), name, url, enabled }`
- `feed_item` table: `{ source_id, external_id, title, content, url, thumbnail_url, author, engagement (JSONB), published_at }`
- JOOQ generated sources live inside `rosebot-api/src/main/kotlin/jooq/` — not shared yet
- No deduplication worker exists; the unique constraint `(source_id, external_id)` is the only guard

---

## Module layout (target)

```
rosebot/
├── pom.xml                  ← add rosebot-domain, rosebot-ingestion modules
├── rosebot-domain/          ← NEW: all domain objects, repositories, services, JOOQ sources
├── rosebot-api/             ← HTTP layer only: controllers, security, Spring Boot main
├── rosebot-ingestion/       ← NEW: scheduled ingestion service, connectors
└── rosebot-web-app/
```

---

## Phase 0 — Extract `rosebot-domain`

**Why this first:** the domain layer (repositories, services, JOOQ generated sources, domain
objects) belongs to neither the API nor the ingestion module — it is shared business logic.
Both consuming modules depend on it and add only their own entry-point layer on top.

**What moves into `rosebot-domain`:**
- `jooq/` generated sources (JOOQ codegen profile moves here too)
- All domain packages as-is: `user/`, `auth/`, `source/`, `feed/`, `saved/`, `summary/`,
  `appstate/` — each with its `Repository`, `Service`, `dto/`, and domain objects
- `exception/GlobalExceptionHandler` (shared error contract)
- Flyway migration scripts

**What stays in `rosebot-api`:**
- `controller/` (all `@RestController` classes)
- `config/RosebotApiConfig` (bean wiring for the API context)
- `config/SecurityConfig` + JWT filter chain
- `RosebotApplication.kt`

**`rosebot-domain/pom.xml`:** Kotlin library — `spring-boot-starter-jooq`, `spring-boot-starter-validation`, Jackson, PostgreSQL driver. No `spring-boot-maven-plugin` (not a runnable app). No Spring Security.

**`rosebot-api/pom.xml`:** drops direct JOOQ / domain deps, adds `<dependency>rosebot-domain</dependency>` and keeps Security + JWT + web-app frontend dependency.

---

## Phase 1 — `rosebot-ingestion` module skeleton

**Dependencies:**
- `spring-boot-starter` (no web, no security)
- `rosebot-domain` (all repositories, services, JOOQ, domain objects)
- `jackson-module-kotlin`
- Testcontainers (test scope)

**Application structure:**
```
rosebot-ingestion/
└── src/main/kotlin/com/github/cenkakin/rosebot/ingestion/
    ├── IngestionApplication.kt
    ├── config/
    │   └── IngestionConfig.kt       ← explicit bean registration (same rule as api)
    ├── connector/
    │   ├── SourceConnector.kt       ← interface
    │   ├── news/
    │   ├── reddit/
    │   └── twitter/
    ├── ingestion/
    │   ├── IngestionService.kt      ← orchestrates: load sources → call connector → persist
    │   └── FeedItemWriter.kt        ← upsert to feed_item with ON CONFLICT DO NOTHING
    └── scheduler/
        └── IngestionScheduler.kt    ← @Scheduled polling, one job per source type
```

**Config:** `application.yml` + `application-dev.properties` / secrets (same pattern as api).

---

## Phase 2 — `SourceConnector` interface + News/RSS connector

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

**News connector** (RSS via Rome library `com.rometools:rome`):
- Parse RSS/Atom feed at `source.url`
- Map each `SyndEntry` → `FeedItemDraft`
- `externalId`: entry URI or link (stable per article)
- Handle missing `publishedDate` gracefully (fall back to `updatedDate` → `now()`)

---

## Phase 3 — Reddit connector

Reddit public JSON API — no auth required for public subreddits:
- `GET https://www.reddit.com/r/{subreddit}.json?limit=25&after={cursor}`
- `source.url` stores the subreddit name or full listing URL
- `externalId`: post `id` (e.g. `t3_abc123`)
- `engagement`: `{ "score": N, "num_comments": N, "upvote_ratio": 0.95 }`
- Cursor-based pagination via `after` token stored in `app_state`-like mechanism (or just fetch latest N each run and rely on deduplication)

**Rate limit:** Reddit asks for a descriptive `User-Agent` and allows ~60 req/min unauthenticated.

---

## Phase 4 — Twitter/X connector

Twitter API v2 (Bearer token):
- `GET /2/tweets/search/recent?query=...` or user timeline endpoint
- `source.url` stores the query string or user handle
- `externalId`: tweet `id`
- `engagement`: `{ "like_count": N, "retweet_count": N, "reply_count": N }`
- Requires `TWITTER_BEARER_TOKEN` secret

Note: Twitter API access tiers have changed significantly. Plan around free tier limits (500k tweets/month on Basic tier). If unavailable, this connector is a stub until credentials are sourced.

---

## Phase 5 — Scheduling, deduplication, error handling

**Scheduler:**
```kotlin
@Scheduled(fixedDelayString = "\${ingestion.poll-interval-ms:300000}") // default 5 min
fun pollAll() { ... }
```
- Per-source-type delay configuration
- Log ingested count and skipped (duplicate) count per run

**Deduplication (FeedItemWriter):**
```kotlin
dsl.insertInto(FEED_ITEM)
   .set(...)
   .onConflict(FEED_ITEM.SOURCE_ID, FEED_ITEM.EXTERNAL_ID)
   .doNothing()
   .execute()
```
No exception thrown on duplicate — just silently skipped.

**Error isolation:**
- Failure of one source does not abort other sources in the same run
- Connector exceptions are caught per-source, logged with source name/id, then continue

**Observability:**
- Spring Actuator `/actuator/health` + `/actuator/metrics`
- Log structured summary: `[ingestion] source=HackerNews items=12 dupes=3 duration=840ms`

---

## Open questions (decide before implementing)

1. **Run as separate process or same JVM?**: Separate process (separate Spring Boot app) gives
   independent deploy/scaling. Same JVM saves ops overhead. Current plan assumes separate.

2. **Crawl depth for NEWS**: RSS gives title + excerpt. Do we want full article text?
   If yes, add an optional HTML fetcher step (Jsoup) as a separate enrichment pass.

3. **Twitter tier availability**: Do we have API credentials? If not, skip Phase 4 for now.

4. **Ingestion trigger**: Pure schedule is simplest. Should there also be a manual
   `/api/admin/ingest` endpoint in the API module to trigger on demand?

---

## Dependencies to add (summary)

| Dependency | Module | Purpose |
|---|---|---|
| `com.rometools:rome` | ingestion | RSS/Atom parsing |
| `org.jsoup:jsoup` | ingestion (optional) | Full-text article fetch |
| `spring-boot-starter-web` (optional) | ingestion | Only if adding admin trigger endpoint |
| `spring-retry` | ingestion | Retry transient connector failures |
