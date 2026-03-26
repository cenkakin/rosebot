instead of passing the `ObjectMapper` instance, you can create a new one in the file using jacksonObjectMapper() but the rest sounds good

# Plan 02 — Backend Refactoring

Two independent deduplication tasks. They can be done together in one pass.

---

## Task A — Extract `toJooqEnum()` to a shared location

### Problem

`SourceType.toJooqEnum()` is a private extension function that converts the domain enum to the JOOQ
generated enum. It currently lives (identically) in both `SourceRepository` and
`SavedItemRepository`. Every new repository that needs to filter by source type will duplicate it
again.

### Fix

Create `source/JooqExtensions.kt` with a single internal package-level function:

```kotlin
package com.github.cenkakin.rosebot.source

internal fun SourceType.toJooqEnum(): jooq.enums.SourceType =
    jooq.enums.SourceType.valueOf(name)
```

`internal` visibility makes it available to any class in the same Gradle module without becoming
part of the public API.

Remove the private copy from both `SourceRepository` and `SavedItemRepository`.

### Files Touched

| File | Change |
|---|---|
| `source/JooqExtensions.kt` | **New file** — package-level `toJooqEnum()` |
| `source/SourceRepository.kt` | Remove private `toJooqEnum()` |
| `saved/SavedItemRepository.kt` | Remove private `toJooqEnum()` |

---

## Task B — Unify `Record.toFeedItemResponse()` across services

### Problem

`FeedService` and `SavedItemService` each have a private `Record.toResponse()` /
`Record.toFeedResponse()` extension that maps a JOOQ record to `FeedItemResponse`. They are
identical except for how `saved` is set:

- `FeedService`: `saved = get("saved", Boolean::class.java) ?: false` (reads from LEFT JOIN result)
- `SavedItemService`: `saved = true` (always true, items come from the `saved_item` table)

If a column is renamed or a new field is added to `FeedItemResponse`, both functions need updating.
This has already happened once (with `savedAt` if Plan 01 is applied).

### Fix

Add a package-level function in the `feed` package:

```kotlin
// feed/FeedItemRecordExtensions.kt
package com.github.cenkakin.rosebot.feed

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.cenkakin.rosebot.feed.dto.FeedItemResponse
import jooq.Tables.FEED_ITEM
import jooq.Tables.SOURCE
import org.jooq.Record

internal fun Record.toFeedItemResponse(objectMapper: ObjectMapper, saved: Boolean): FeedItemResponse {
    val engagement =
        get(FEED_ITEM.ENGAGEMENT)
            ?.let { objectMapper.readValue<Map<String, Any>>(it.data()) }
    return FeedItemResponse(
        id = get(FEED_ITEM.ID)!!,
        sourceId = get(FEED_ITEM.SOURCE_ID)!!,
        sourceType = get(SOURCE.TYPE)!!.literal,
        sourceName = get(SOURCE.NAME)!!,
        title = get(FEED_ITEM.TITLE)!!,
        content = get(FEED_ITEM.CONTENT),
        url = get(FEED_ITEM.URL)!!,
        thumbnailUrl = get(FEED_ITEM.THUMBNAIL_URL),
        author = get(FEED_ITEM.AUTHOR),
        engagement = engagement,
        publishedAt = get(FEED_ITEM.PUBLISHED_AT)!!.toInstant().toString(),
        saved = saved,
    )
}
```

**`FeedService`** calls it as:
```kotlin
it.toFeedItemResponse(objectMapper, saved = get("saved", Boolean::class.java) ?: false)
```

**`SavedItemService`** calls it as:
```kotlin
it.toFeedItemResponse(objectMapper, saved = true)
```

Both services drop their private `toResponse()` / `toFeedResponse()` extensions entirely.

### Note on `ObjectMapper`

The shared function receives `objectMapper` as a parameter rather than capturing it from the service
instance. This keeps it a pure function with no dependency on the caller's context, and makes it
straightforward to test in isolation.

### Files Touched

| File | Change |
|---|---|
| `feed/FeedItemRecordExtensions.kt` | **New file** — shared `Record.toFeedItemResponse()` |
| `feed/FeedService.kt` | Remove private extension, call shared function |
| `saved/SavedItemService.kt` | Remove private extension, call shared function |
