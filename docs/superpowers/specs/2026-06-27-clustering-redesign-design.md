# Clustering Redesign + AI Document View — Design

**Date:** 2026-06-27
**Status:** Approved (design); pending implementation plan

## Problem

The clustering page (horizontal Kanban of cluster columns, each a list of dense
`FeedCard`s) has two problems:

1. **The date is unreadable.** `relativeTime()` returns `"Mon, Jun 22"` for items
   older than 48h. In a 320px column, that string is right-aligned next to the
   save star and wraps onto three lines (`Mon,` / `Jun` / `22`).
2. **The layout is dense and hard to scan/read.** Every article is a full card
   (source badge + category chip + favicon + source name + date + star, then
   title + 3-line summary + thumbnail), so a column shows only a couple of
   articles and the cluster's "story" is lost in the noise.

Separately, AI summaries are generated per article (`feed_item.ai_summary`) but
are only shown truncated to three lines inside cards. There is no focused view
that surfaces the AI summary when a user opens a document, and the clustering
page's article click is currently a no-op.

## Goals

- Make the clustering page both **scannable** and **readable**.
- Fix the date so it never wraps and reads clearly.
- Surface the **AI summary** (paragraph + key-point bullets) in a focused
  document view, reused across Clusters, Feed, and Saved.

## Non-Goals

- No change to clustering/embedding/labelling algorithms.
- No change to the Feed page's richer card (it keeps thumbnails + 3-line summary).
- No new authentication, routing, or navigation structure.

## Design

### 1. Clustering page — dual switchable view

A segmented toggle (`▦ Columns` / `☰ Digest`) is added to `ClustersToolbar`,
positioned to the right of the existing Language/Category filters. The active
view persists in the URL query param (e.g. `?view=digest`) and `localStorage`,
so reloads and shared links preserve it.

**Default view: Digest.**

#### Digest (default)

Vertical, scrollable list of cluster "story" cards. Each card renders from the
existing `ClusterResponse` data:

- Cluster `label` (headline) + `windowStart` date + `articleCount`.
- Category pill (`category`) + language chips (`languages`).
- The existing `cluster.summary` AI paragraph as the visual centerpiece.
- A source-favicon row derived from `sourceMix` (e.g. `Evrensel, Cumhuriyet,
  +6 sources`).
- The top ~3 articles as **compact rows** (see below).
- A `Show all N articles →` affordance that expands the remaining items
  (reusing the existing `useClusterItems` paged fetch).

#### Columns (refined Kanban)

Today's horizontal columns, decluttered:

- Column header: `label`, `articleCount`, category pill, language chips, and a
  one-line AI summary (`cluster.summary`, truncated) with a subtle accent rule.
- The first article is a slightly larger "lead" row (title + favicon + source +
  date).
- Remaining articles are **compact rows**.

#### Compact article row (both modes)

A single-line, low-chrome row that replaces the full `FeedCard` *inside
clusters*:

- Title (1-2 lines, clamped).
- Favicon + source name.
- A date that **never wraps** (`white-space: nowrap`).
- Save star retained.

The Feed page continues to use the existing rich `FeedCard`. The compact row is
a new component scoped to clusters.

### 2. Date fix

Keep `relativeTime()` for recent items (`"3h ago"`, `"Yesterday"`). For older
items it already returns an absolute date; the wrapping was a layout problem,
not a format problem. The compact row places the date in a `nowrap` element so
`"Jun 22"` stays on one line. Format stays `{ month: 'short', day: 'numeric' }`
(`"Jun 22"`); the weekday is dropped from the cluster context to save width.

### 3. AI document view — centered reading modal

Clicking any article (Digest, Columns, Feed, Saved) opens a single shared
document view. On desktop it is a **centered reading modal** (scrim + focused
overlay, wider measure). On mobile it remains the existing bottom-sheet
`Drawer`. This replaces/extends today's right-drawer `ContentPanel`.

Layout, top to bottom:

1. **Header:** source-type badge, category pill, language chip, `source · date`,
   close (✕).
2. **AI Summary card** (accented): the `ai_summary` paragraph followed by
   key-point bullets (see §4). If bullets are absent, only the paragraph shows.
3. **Full article text:** collapsible section ("▾ Full article text") that loads
   the existing `content` endpoint on demand.
4. **Footer:** `↗ Open full article` linking to `item.url`.

The clustering page article click — currently `onContentClick={() => {}}` — is
wired to open this modal.

### 4. Backend — key-point bullets

The one pipeline change. Document-level AI summaries gain structured key-point
bullets alongside the existing paragraph.

- **`SummarisationService`** switches to structured output, returning
  `{ summary: String, bullets: List<String> }` (2-3 bullets) instead of a bare
  `String`. The prompt is updated to request both; the English-snippet
  short-circuit path (`resolveWithKnownLanguage`) yields empty bullets.
- **Schema:** add `ai_summary_bullets JSONB` to `feed_item` in
  `V1__create_schema.sql` (fresh-start single-migration approach). Stores a JSON
  array of strings.
- **Persistence:** `FeedService.saveAiSummary` and `FeedItemRepository.saveAiSummary`
  updated to accept and persist `summary` + `bullets`. JOOQ regenerated for the
  new column.
- **API:** `FeedItemResponse` (and the content response consumed by the modal)
  gains `bullets: string[]`, defaulting to `[]`.
- **Frontend:** the modal renders bullets when present; empty array → paragraph
  only (backward-safe).

## Data Model Summary

Existing, no change:
- `cluster.summary` (TEXT) — already powers Digest/Columns cluster summaries.
- `cluster.sourceMix` (`Record<String, Int>`) — powers the source-favicon row.
- `feed_item.ai_summary` (TEXT) — document summary paragraph.
- `feed_item_content.content` (TEXT) — full article text, loaded on demand.

New:
- `feed_item.ai_summary_bullets` (JSONB) — JSON array of 2-3 strings.
- `FeedItemResponse.bullets: string[]` (frontend type + API DTO).

## Scope

- **Frontend-only:** §1 (dual view + toolbar toggle), §2 (date/compact row), §3
  (reading modal, wiring clusters click).
- **Full-stack:** §4 (bullets) — ingestion AI → domain → schema/JOOQ → API → frontend.

## Risks / Notes

- Structured-output reliability: the chat model must return parseable structured
  data. Use Spring AI structured output / entity mapping; on parse failure, fall
  back to `{ summary, bullets: [] }` so summarisation never hard-fails.
- View toggle must not refetch clusters (same query, different render), to keep
  switching instant.
- Mobile parity: the modal degrades to the existing bottom-sheet drawer; verify
  the AI summary card and collapsible full-text both work there.
