# My review over your review

Actions:

1)  Saved item pagination cursor is wrong

Make feed scrollable by savedAt. Maybe adding savedAt should be enough. Give me options.


2) toJooqEnum() is duplicated across repositories
   Do what you suggest

3) Record.toFeedResponse() is duplicated between FeedService and SavedItemService
   Do what you suggest

4) SummaryService has no concept of "pending"

We will do sth else here. Skip for now.


5) AppStateService.markVisited has a last-write-wins race

Skip that, not important.


Security & Reliability


1) No index on user.email

Do this change, but change the existing V1__create_schema.sql file, not as a different sql migration file

2) No input validation on request DTOs

Add reasonable input validations

3) Auth endpoints have no rate limiting

Ignore this

4) Seed data runs on every environment

Ignore this as well



Frontend
Bugs
1) No error states rendered anywhere

Do what you suggest


Refactoring Points

All points you made make sense, apply them


UX / UI


All points you made make sense to me, but I want to see experience each improvement solely. Apply them one by one and let me try first.


# Rosebot — Code Review

## Overall Impression

The architecture is clean and disciplined. Layer separation (repo → service → controller) is
consistent, bean registration is explicit, JOOQ gives compile-time SQL safety, and Testcontainers
gives real integration tests. The frontend has a good feature-based structure, strict TypeScript, and
TanStack Query is used well. These are solid foundations. The notes below are improvements on top of
that baseline.

---

## Backend

### Bugs

#### 🔴 Saved item pagination cursor is wrong

`SavedItemRepository.findByUser` orders by `SAVED_ITEM.SAVED_AT.desc()` and uses
`SAVED_ITEM.SAVED_AT.lt(before)` as the cursor condition. But `useInfiniteSaved` on the frontend
sends `publishedAt` as the cursor — the last item's `FeedItemResponse.publishedAt`. Those are
different timestamps. Pagination past page 1 in the Saved list silently returns wrong results.

**Fix:** Either add `savedAt` to `FeedItemResponse` and use that as the cursor, or change the sort
in `SavedItemRepository` to `FEED_ITEM.PUBLISHED_AT.desc()` and update the cursor condition to
match.

---

### Refactoring Points

#### `toJooqEnum()` is duplicated across repositories

The private extension `SourceType.toJooqEnum()` now exists in both `SourceRepository` and
`SavedItemRepository`. Extract it to a package-level function in the `source` package (e.g.
`JooqExtensions.kt`). No new bean needed — just a top-level function.

#### `Record.toFeedResponse()` is duplicated between `FeedService` and `SavedItemService`

These two private extensions are ~95% identical. The only difference is how `saved` is set:
hardcoded `true` in `SavedItemService` vs. read from the record in `FeedService`. A shared extension
in the `feed` package — e.g. `Record.toFeedItemResponse(saved: Boolean)` — removes the duplication
and means a column rename only needs fixing once.

#### `SummaryService` has no concept of "pending"

Summaries are pre-generated. If a feed item has no summary, `GET /api/summaries/{id}` returns 404.
The frontend `SummaryPanel` has no explicit handling for this — the panel either goes blank or shows
an indefinite skeleton. Consider a response envelope with `status: "ready" | "pending" |
"unavailable"` so the frontend can show a useful message instead of silently failing.

#### `AppStateService.markVisited` has a last-write-wins race

Two browser tabs calling `PUT /api/app-state/visited` simultaneously will overwrite each other. For
correctness, the upsert should only advance the timestamp forward: add a `WHERE last_visited_at <
NOW()` condition or use `GREATEST`. Low priority for a personal tool, but worth noting.

---

### Security & Reliability

#### No index on `user.email`

Every login performs a full table scan. Add a unique index:

```sql
CREATE UNIQUE INDEX ON "user"(email);
```

This also enforces uniqueness at the DB level — currently only enforced in application code.

#### No input validation on request DTOs

`LoginRequest`, `RegisterRequest`, and `SourceRequest` have no `@NotBlank` / `@Size` / `@Email`
constraints. Someone can register with `email = ""` or a 10,000-character password. Add `@Valid` at
the controller parameter level and Bean Validation annotations on the DTOs.

#### Auth endpoints have no rate limiting

`POST /api/auth/login` can be brute-forced. A simple bucket-based limiter (e.g. Bucket4j) or even a
deliberate delay on failed attempts closes the obvious attack vector.

#### Seed data runs on every environment

`V2__seed_data.sql` runs on startup in any environment including production. It creates a test user
with a known password. Gate it with a Spring profile condition, or document clearly that it must be
removed before any production deployment.

---

## Frontend

### Bugs

#### 🔴 No error states rendered anywhere

When `isError` is true on any query, the component renders an empty list or blank panel with no
feedback. The user cannot distinguish a network failure from genuinely empty data. Add a simple
`<Alert severity="error">` conditional on `isError` in `FeedPage`, `SavedPage`, and `SummaryPanel`.

---

### Refactoring Points

#### `FeedPage` and `SavedPage` share ~70% of their structure

Both pages render an infinite list of `FeedCard`s, embed a `SummaryPanel`, manage `activePanelId`,
and wire up the `toggleSave` mutation identically. Only the data source hook and the time-grouping
logic differ. A shared `ItemListPage` component accepting a hook and an optional header slot would
cut the duplication and make both pages consistent by default.

#### Dark theme colors are hardcoded in components

`#1c0a0a`, `#7a4040`, `#d4607a`, `#3a1010` appear directly in `AppBar.tsx`, `LoginPage.tsx`, and
`Sidebar.tsx` rather than in `theme.ts`. If the brand color changes, every file needs updating.
Move these into `theme.palette` as custom tokens.

#### Two competing filter UIs

`FilterChips` inside `FeedPage` and the source sections in `Sidebar` both filter by type. Clicking
"News" in the chips and "All News" in the sidebar does the same thing — sets `?type=NEWS`. Having
both controls visible simultaneously is confusing. Consider removing `FilterChips` entirely, or
repurposing it for mobile only when the sidebar is hidden.

#### `staleTime: Infinity` on sources

Sources added or deleted in another session/tab will never reflect in the UI. `5 * 60 * 1000`
(5 min) is more reasonable. Any future mutation that creates/updates/deletes a source should also
call `queryClient.invalidateQueries(['sources'])`.

#### `relativeTime` is defined inline in `FeedCard.tsx`

This is a pure, testable utility. Move it to `src/utils/time.ts`. It will likely be needed in other
places (e.g. showing `savedAt` on the Saved page).

#### JWT stored in `localStorage`

`AuthContext` reads and writes the token from `localStorage`. This is XSS-vulnerable — any injected
script can steal the token. For a personal tool this is acceptable, but `httpOnly` cookies with a
`/api/auth/refresh` endpoint is the production-safe pattern if this ever becomes multi-user.

#### `ProtectedRoute` doesn't guard against the unauthenticated flash

On page load, before the auth state is determined, `ProtectedRoute` may briefly render `null` or
flash to the login page. Render a loading spinner until the initial token check resolves.

---

## UX / UI

#### No feedback on save / unsave

The star icon toggles state but there is no micro-animation, colour pulse, or toast to confirm the
action. A brief `Snackbar` ("Saved" / "Removed from saved") or a subtle animation on the icon would
make the interaction feel complete.

#### Summary chip label is unclear

"📋 Summary ▸" is not immediately self-explanatory for a first-time user. "AI Summary" or
"Summarize" is more discoverable and sets accurate expectations.

#### Saved page shows publication date, not the date it was saved

The list is sorted by `saved_at` but each card shows `publishedAt`. An item saved today but
published a year ago will appear at the top with a stale date, making the ordering seem random. A
"Saved 2 days ago" label alongside the publish date would make this clear.

#### AppBar (dark) vs. Sidebar (white) vs. Content (light grey) feel disconnected

Three distinct background tones with no clear relationship. Either extend the dark theme into the
sidebar (a standard pattern for feed/reader apps), or lighten the AppBar to blend with the rest of
the layout. Right now the header and the content feel like two different products.

#### Login page → main app transition is jarring

The login page background is `#1c0a0a` (near black); the main app is `#f5f5f5` (near white). A
brief fade transition on the route change, or a main app background closer to the brand's dark
palette, would smooth this out.

#### No empty state illustration

"Nothing saved yet." is plain text. A small illustration — even the rosebot logo at reduced opacity
— makes the state feel intentional rather than broken.

#### The sidebar has no collapse / responsive behaviour

At 220px fixed width the sidebar dominates small screens and cannot be hidden. A toggle button on
the AppBar, collapsing to a hamburger-accessible drawer on mobile, is the standard pattern.

#### Summary panel has no mobile handling

The panel is a fixed-width 360px right-side overlay. On a 768px screen the main content is left
with ~400px. On mobile this needs to be a bottom sheet or full-screen overlay.

#### No pagination depth indicator

With infinite scroll, users have no sense of how deep they are in the feed. A subtle "Showing 40
items" label near the bottom sentinel, or a progress indicator, would help with orientation.

---

## Priority Summary

| Priority | Area | Item |
|---|---|---|
| 🔴 Critical | Backend | Saved item pagination cursor mismatch — wrong results on page 2+ |
| 🔴 Critical | Frontend | No error states rendered — failures look identical to empty data |
| 🟠 High | Backend | No DB index on `user.email` — full scan on every login |
| 🟠 High | Backend | No input validation on request DTOs |
| 🟡 Medium | Backend | `toJooqEnum()` and `toFeedResponse()` duplicated across services |
| 🟡 Medium | Frontend | Dark theme colors scattered in components instead of in `theme.ts` |
| 🟡 Medium | Frontend | `FeedPage` / `SavedPage` structural duplication |
| 🟡 Medium | UX | No save/unsave feedback (toast or animation) |
| 🟡 Medium | UX | Saved page shows publish date, not saved date |
| 🟡 Medium | UX | AppBar / Sidebar / Content colour fragmentation |
| 🟢 Low | Backend | Seed data (`V2`) runs on all environments |
| 🟢 Low | Backend | Auth endpoints have no rate limiting |
| 🟢 Low | Frontend | Filter chips duplicate sidebar type filtering |
| 🟢 Low | UX | No sidebar collapse / mobile responsive layout |
| 🟢 Low | UX | Summary panel not adapted for mobile |
