# Plan: Filter Saved Items by Source via Sidebar

## Root Cause

Three independent gaps prevent filtering from working on the Saved page:

1. **Frontend — Sidebar forcibly redirects away from `/saved`.**
   `setFilter()` in `Sidebar.tsx` contains `if (location.pathname !== '/') navigate('/')`.
   Clicking any source filter on the Saved page silently sends the user back to the Feed.

2. **Frontend — `SavedPage` ignores URL search params.**
   Even if a user lands on `/saved?type=NEWS`, `useInfiniteSaved` passes no filter params to the API.

3. **Backend — `GET /api/saved` has no filter params.**
   The endpoint only accepts `before` and `limit`. `sourceId` and `type` are not supported.

Additionally, the sidebar currently shows all configured sources regardless of page context. On the Saved page, source sections should be **dynamic** — only types and individual sources that have at least one saved item for the user should appear.

---

## Backend Changes

### 1. `SavedItemRepository` — add filter conditions to `findByUser`

Remove default values from the signature (no default parameter values in production code):

```kotlin
// Before
fun findByUser(userId: Long, before: OffsetDateTime?, limit: Int): List<Record>

// After
fun findByUser(
    userId: Long,
    before: OffsetDateTime?,
    limit: Int,
    sourceId: Long?,
    type: SourceType?,
): List<Record>
```

Append two extra `.and(...)` conditions after the existing `SAVED_ITEM.USER_ID.eq(userId)` clause — same pattern as `FeedItemRepository.findFeed`:

```kotlin
.and(sourceId?.let { FEED_ITEM.SOURCE_ID.eq(it) } ?: DSL.noCondition())
.and(type?.let { SOURCE.TYPE.eq(it.toJooqEnum()) } ?: DSL.noCondition())
```

Add a private `SourceType.toJooqEnum()` extension — copy from `FeedItemRepository` for now. (If it ends up in a third place, extract to a shared file.)

### 2. `SavedItemRepository` — new `findSourcesByUser` query

New method that returns only the sources that have at least one saved item for the user. Used to power dynamic sidebar filters on the Saved page:

```kotlin
fun findSourcesByUser(userId: Long): List<Record>
```

Query:

```kotlin
dsl.selectDistinct(SOURCE.asterisk())
    .from(SAVED_ITEM)
    .join(FEED_ITEM).on(FEED_ITEM.ID.eq(SAVED_ITEM.FEED_ITEM_ID))
    .join(SOURCE).on(SOURCE.ID.eq(FEED_ITEM.SOURCE_ID))
    .where(SAVED_ITEM.USER_ID.eq(userId))
    .orderBy(SOURCE.TYPE, SOURCE.NAME)
    .fetch()
```

Returns `SOURCE.*` columns, which map cleanly to the existing `SourceResponse` DTO already used by `SourceService`.

### 3. `SavedItemService` — thread filters through `getSaved`

No default values:

```kotlin
// Before
fun getSaved(userId: Long, before: String?, limit: Int): List<FeedItemResponse>

// After
fun getSaved(
    userId: Long,
    before: String?,
    limit: Int,
    sourceId: Long?,
    type: String?,
): List<FeedItemResponse>
```

Parse `type` to `SourceType` enum the same way `FeedService` does, then pass both to the repository. Callers always supply explicit `null` when no filter is active.

### 4. `SavedItemService` — new `getSavedSources` method

```kotlin
fun getSavedSources(userId: Long): List<SourceResponse> =
    savedItemRepository.findSourcesByUser(userId).map { record ->
        SourceResponse(
            id = record.get(SOURCE.ID)!!,
            name = record.get(SOURCE.NAME)!!,
            type = record.get(SOURCE.TYPE)!!.literal,
            enabled = record.get(SOURCE.ENABLED)!!,
        )
    }
```

Reuses the existing `SourceResponse` DTO so the frontend needs no new type.

### 5. `SavedItemController` — expose the two new endpoints

**Filter params on `GET /api/saved`:**

```kotlin
@GetMapping
fun getSaved(
    @AuthenticationPrincipal user: AuthenticatedUser,
    @RequestParam(required = false) before: String?,
    @RequestParam(defaultValue = "20") limit: Int,
    @RequestParam(required = false) sourceId: Long?,   // NEW
    @RequestParam(required = false) type: String?,     // NEW
): List<FeedItemResponse> =
    service.getSaved(user.id, before, limit.coerceAtMost(50), sourceId, type)
```

**New `GET /api/saved/sources`:**

```kotlin
@GetMapping("/sources")
fun getSavedSources(
    @AuthenticationPrincipal user: AuthenticatedUser,
): List<SourceResponse> = service.getSavedSources(user.id)
```

---

## Frontend Changes

### 6. `api/saved.ts` — extend `SavedParams` and add `getSavedSources`

```ts
interface SavedParams {
  before?: string
  limit?: number
  sourceId?: number   // NEW
  type?: string       // NEW
}

// NEW — reuses the existing SourceResponse type
export const getSavedSources = (): Promise<SourceResponse[]> =>
  client.get<SourceResponse[]>('/saved/sources').then((r) => r.data)
```

`getSaved` already passes `params` as Axios query params, so no other change needed there.

### 7. `useInfiniteSaved.ts` — accept and forward filters

```ts
interface SavedFilters {
  type?: string | null
  sourceId?: string | null
}

export function useInfiniteSaved({ type, sourceId }: SavedFilters)
```

- Include filters in `queryKey` so React Query re-fetches on change:
  `queryKey: ['saved', { type, sourceId }]`
- Forward to `getSaved`:
  ```ts
  queryFn: ({ pageParam }) =>
    getSaved({
      before: pageParam ?? undefined,
      limit: 20,
      type: type ?? undefined,
      sourceId: sourceId ? Number(sourceId) : undefined,
    })
  ```

### 8. `SavedPage.tsx` — read search params and pass filters

```tsx
const [searchParams] = useSearchParams()
const type = searchParams.get('type')
const sourceId = searchParams.get('sourceId')

const { data, ... } = useInfiniteSaved({ type, sourceId })
```

No changes to the render logic — filtered results arrive naturally.

### 9. `Sidebar.tsx` — dynamic sources on Saved page + remove forced redirect

**Remove the redirect from `setFilter`:**

```ts
// Before
const setFilter = (params: { type?: string; sourceId?: string }) => {
  if (location.pathname !== '/') navigate('/')   // DELETE THIS LINE
  setSearchParams(params as Record<string, string>)
}
```

**Fetch saved sources when on the Saved page:**

Add a second query alongside the existing `sources` query:

```ts
const { data: savedSources = [] } = useQuery({
  queryKey: ['saved-sources'],
  queryFn: getSavedSources,
  enabled: isSavedActive,          // only fetches when on /saved
  staleTime: 30_000,
})

const visibleSources = isSavedActive ? savedSources : sources
```

Pass `visibleSources` into `renderSection` and `byType` instead of the current `sources`. The existing `byType` filter already handles empty arrays gracefully by returning `null`, so sections with no saved content simply disappear without any extra logic.

---

## Data Flow After Changes

```
User on /saved clicks "All News" in sidebar
  → sidebar shows only types/sources present in their saved items
  → setFilter({ type: 'NEWS' })
  → setSearchParams({ type: 'NEWS' })           (no redirect)
  → URL becomes /saved?type=NEWS
  → SavedPage reads type='NEWS', sourceId=null
  → useInfiniteSaved({ type: 'NEWS' })
  → GET /api/saved?type=NEWS&limit=20
  → SavedItemRepository: WHERE user_id=? AND source.type='NEWS'
  → Returns only saved NEWS items

User navigates to sidebar on /saved (initial load)
  → GET /api/saved/sources
  → Returns only sources with ≥1 saved item for this user
  → Sidebar renders only those type sections and source rows
```

---

## What Does NOT Change

- Feed page filter behaviour is completely unaffected.
- The "Feed" and "Saved" nav items in the sidebar are unaffected.
- Pagination (`before` cursor) works alongside filters unchanged.
- `FeedItemRepository` and `FeedService` are not touched.
- No database migrations needed — the existing JOINs already expose `SOURCE.*`.
- `SourceResponse` DTO is reused as-is for the new `/saved/sources` endpoint.

---

## File Checklist

| File | Change |
|------|--------|
| `rosebot-api/.../saved/SavedItemRepository.kt` | Add `sourceId`/`type` params to `findByUser`; add new `findSourcesByUser` query |
| `rosebot-api/.../saved/SavedItemService.kt` | Add `sourceId`/`type` params to `getSaved`; add `getSavedSources` method |
| `rosebot-api/.../controller/SavedItemController.kt` | Add two `@RequestParam` to `getSaved`; add `GET /sources` endpoint |
| `rosebot-web-app/src/api/saved.ts` | Extend `SavedParams`; add `getSavedSources` function |
| `rosebot-web-app/src/features/saved/useInfiniteSaved.ts` | Accept filters, include in queryKey, forward to API |
| `rosebot-web-app/src/features/saved/SavedPage.tsx` | Read search params, pass to hook |
| `rosebot-web-app/src/features/layout/Sidebar.tsx` | Remove `navigate('/')` redirect; fetch `savedSources` when on `/saved`; swap source list based on active page |
