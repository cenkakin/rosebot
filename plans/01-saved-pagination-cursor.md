Go for Option C.

# Plan 01 — Saved Item Pagination Cursor Fix

## Problem

`SavedItemRepository.findByUser` orders by `SAVED_ITEM.SAVED_AT.desc()` and uses
`SAVED_ITEM.SAVED_AT.lt(before)` as the cursor. But `useInfiniteSaved` on the frontend sends
`FeedItemResponse.publishedAt` as the cursor. Those are different timestamps — pagination past page
1 silently returns wrong or skipped items.

---

## Options

### Option A — Add `savedAt` to `FeedItemResponse`, use it as the cursor (recommended)

Keep ordering by `saved_at` (which is the natural UX order: "most recently saved first"). Add
`savedAt` to the response so the frontend has the right timestamp to use as cursor.

**Backend changes:**
- `FeedItemResponse.kt` — add `val savedAt: String?` (nullable so the Feed page, which doesn't
  join `SAVED_ITEM`, can leave it null)
- `SavedItemRepository.findByUser` — already selects `SAVED_ITEM.SAVED_AT`; just include it in the
  mapped response
- `SavedItemService.toFeedResponse()` — set `savedAt = get(SAVED_ITEM.SAVED_AT)!!.toInstant().toString()`
- `FeedService.toFeedResponse()` — set `savedAt = null` (Feed items don't carry a saved timestamp)

**Frontend changes:**
- `types/feedItem.ts` — add `savedAt?: string`
- `useInfiniteSaved.ts` — change cursor to use `savedAt` instead of `publishedAt`:
  ```ts
  getNextPageParam: (lastPage) =>
    lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].savedAt
  ```

**Pros:** Semantically correct. The sort order (most recently saved first) stays intact.
**Cons:** `FeedItemResponse` grows a nullable field that only applies on the Saved page.

---

### Option B — Change sort to `publishedAt`, keep frontend cursor as-is

Change `SavedItemRepository` to order by `FEED_ITEM.PUBLISHED_AT.desc()` and use
`FEED_ITEM.PUBLISHED_AT.lt(before)` as the cursor. No DTO or frontend changes needed.

**Backend changes:**
- `SavedItemRepository.findByUser` — swap `.orderBy(SAVED_ITEM.SAVED_AT.desc())` to
  `.orderBy(FEED_ITEM.PUBLISHED_AT.desc())` and swap the cursor condition to match.

**Pros:** Minimal change (one file, two lines).
**Cons:** Changes the UX semantics — the Saved list now sorts by when items were *published*, not
when *you saved* them. An article saved today but published a year ago appears at the bottom.
This is almost certainly not what users expect.

---

### Option C — Expose both timestamps, sort by `savedAt`, cursor uses `savedAt`

Same as Option A, but additionally surface `savedAt` in the UI on each card ("Saved 2 days ago").
This also fixes the separate UX issue where the card shows `publishedAt` but the list is ordered by
`savedAt`, which makes the ordering seem arbitrary.

**Changes:** Same as Option A, plus a small display change in `FeedCard` or `SavedPage` to show
`savedAt` alongside the publication date when it is present.

**Pros:** Fixes both the bug and the UX confusion about ordering in one go.
**Cons:** Slightly more frontend work.

---

## Recommendation

**Option C** — it fixes the bug *and* the related UX confusion from the review in one coherent
change. Option A is acceptable if you want to defer the UI label for later. Option B should be
avoided since it changes sort semantics in a user-unfriendly way.

---

## Files Touched (Option A / C)

| File | Change |
|---|---|
| `feed/dto/FeedItemResponse.kt` | Add `savedAt: String?` |
| `saved/SavedItemRepository.kt` | Select `SAVED_ITEM.SAVED_AT` into the response |
| `saved/SavedItemService.kt` | Map `savedAt` field |
| `feed/FeedService.kt` | Set `savedAt = null` |
| `types/feedItem.ts` | Add `savedAt?: string` |
| `useInfiniteSaved.ts` | Use `savedAt` as the cursor |
| *(Option C only)* `FeedCard.tsx` or `SavedPage.tsx` | Display "Saved X ago" label |
