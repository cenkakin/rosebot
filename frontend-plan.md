# Frontend Implementation Plan

## Overview

Full replacement of the placeholder `ArticleList`-based scaffold with the mockup UI. Stack: React 19, TypeScript, MUI v7, React Router v7, Vite. The existing `package.json` and toolchain stay unchanged; two packages are added.

---

## New Dependencies

```
axios          — HTTP client (consistent interceptor for JWT injection)
@tanstack/react-query — server-state cache, infinite scroll, background refetch
```

No other additions. Local UI state uses `useState`/`useReducer`. Auth state uses React Context.

---

## File Structure

Complete final structure of `src/`:

```
src/
├── main.tsx                    # Mount point — wraps with QueryClient + AuthProvider + Router
├── App.tsx                     # Route tree
├── theme.ts                    # MUI theme (primary #c62828)
│
├── api/
│   ├── client.ts               # Axios instance, request interceptor (injects Bearer), 401 redirect
│   ├── auth.ts                 # login()
│   ├── feed.ts                 # getFeed(), getFeedItem()
│   ├── sources.ts              # getSources()
│   ├── saved.ts                # getSaved(), saveItem(), unsaveItem()
│   ├── summary.ts              # getSummary()
│   └── appState.ts             # getAppState(), markVisited()
│
├── types/
│   ├── auth.ts                 # LoginRequest, RegisterRequest, AuthResponse
│   ├── feedItem.ts             # FeedItemResponse (matches backend DTO exactly)
│   ├── source.ts               # SourceResponse, SourceRequest, UpdateSourceRequest
│   ├── summary.ts              # SummaryResponse
│   └── appState.ts             # AppStateResponse
│
├── features/
│   ├── auth/
│   │   ├── AuthContext.tsx     # JWT storage, login/logout actions, currentUser
│   │   ├── useAuth.ts          # useContext(AuthContext) shorthand
│   │   └── LoginPage.tsx       # /login route
│   │
│   ├── layout/
│   │   ├── AppBar.tsx          # Logo, date, logout icon
│   │   ├── Sidebar.tsx         # Saved link + sources grouped by type
│   │   └── Layout.tsx          # Composes AppBar + Sidebar + outlet
│   │
│   ├── feed/
│   │   ├── FeedPage.tsx        # Main feed page, owns filter state + panel state
│   │   ├── FeedCard.tsx        # Single card — used by both feed and saved pages
│   │   ├── FilterChips.tsx     # All / News / Reddit / Twitter chips
│   │   ├── NewSinceBanner.tsx  # "14 new items since your last visit"
│   │   ├── TimeDivider.tsx     # New / Earlier Today / Yesterday / [weekday] label
│   │   └── useInfiniteFeed.ts  # useInfiniteQuery wrapping GET /api/feed
│   │
│   ├── saved/
│   │   ├── SavedPage.tsx       # /saved route — reuses FeedCard
│   │   └── useInfiniteSaved.ts # useInfiniteQuery wrapping GET /api/saved
│   │
│   └── summary/
│       ├── SummaryPanel.tsx    # Slide-in panel component
│       └── useSummary.ts       # useQuery wrapping GET /api/summaries/{feedItemId}
│
└── hooks/
    └── useInfiniteScroll.ts    # IntersectionObserver sentinel ref → fetchNextPage
```

**Existing files to delete:** `src/types/article.ts`, `src/services/articleService.ts`, `src/features/articles/` (all 3 files).

---

## Types

Mirror backend DTOs exactly. All timestamps are ISO strings from the backend.

```typescript
// types/feedItem.ts
export interface FeedItemResponse {
  id: number
  sourceId: number
  sourceName: string
  sourceType: 'NEWS' | 'REDDIT' | 'TWITTER'
  externalId: string
  title: string
  url: string
  thumbnailUrl: string | null
  author: string | null
  engagement: Record<string, unknown> | null
  publishedAt: string     // ISO instant string
  saved: boolean
}

// types/source.ts
export interface SourceResponse {
  id: number
  type: 'NEWS' | 'REDDIT' | 'TWITTER'
  name: string
  url: string
  enabled: boolean
  createdAt: string
}

// types/auth.ts
export interface LoginRequest { email: string; password: string }
export interface AuthResponse { token: string }

// types/summary.ts
export interface SummaryResponse { feedItemId: number; content: string; model: string; generatedAt: string }

// types/appState.ts
export interface AppStateResponse { lastVisitedAt: string | null }
```

---

## API Layer

### `api/client.ts`
Single Axios instance with `baseURL: '/api'`. Request interceptor reads JWT from localStorage and sets `Authorization: Bearer <token>`. Response interceptor catches 401 and calls `window.location.replace('/login')`.

### `api/auth.ts`
```
POST /api/auth/login → login(req: LoginRequest): Promise<AuthResponse>
```

### `api/feed.ts`
```
GET /api/feed?before=&limit=20&sourceId=&type= → getFeed(params): Promise<FeedItemResponse[]>
GET /api/feed/{id}                             → getFeedItem(id): Promise<FeedItemResponse>
```

### `api/sources.ts`
```
GET /api/sources → getSources(): Promise<SourceResponse[]>
```

### `api/saved.ts`
```
GET    /api/saved?before=&limit=20 → getSaved(params): Promise<FeedItemResponse[]>
POST   /api/saved/{feedItemId}     → saveItem(feedItemId)
DELETE /api/saved/{feedItemId}     → unsaveItem(feedItemId)
```

### `api/summary.ts`
```
GET /api/summaries/{feedItemId} → getSummary(feedItemId): Promise<SummaryResponse>
```

### `api/appState.ts`
```
GET /api/app-state          → getAppState(): Promise<AppStateResponse>
PUT /api/app-state/visited  → markVisited(): Promise<AppStateResponse>
```

---

## Auth

### Storage
JWT stored in `localStorage` under key `rosebot_token`. On load, `AuthContext` reads and validates it (checks expiry by decoding the payload without a library — `JSON.parse(atob(token.split('.')[1]))`).

### `AuthContext`
```typescript
interface AuthContextValue {
  token: string | null
  login(token: string): void   // stores token, sets state
  logout(): void               // clears storage, redirects /login
}
```

### Protected routes
`ProtectedRoute` wrapper: if no token, `<Navigate to="/login" replace />`.

---

## Routing

```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/"      element={<FeedPage />} />
      <Route path="/saved" element={<SavedPage />} />
    </Route>
  </Route>
</Routes>
```

---

## Theme (`theme.ts`)

```typescript
createTheme({
  palette: {
    primary: { main: '#c62828' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
})
```

Source type colours (not in MUI palette, used directly in components):
- NEWS `#1565c0` (dot) / `#e3f0ff` bg / `#1565c0` text
- REDDIT `#e64a19` (dot) / `#fbe9e7` bg / `#bf360c` text
- TWITTER `#0288d1` (dot) / `#e1f5fe` bg / `#0277bd` text

---

## Component Breakdown

### `Layout.tsx`
Fixed-height viewport (`height: 100vh`). Flex column: AppBar on top, then a flex row below containing Sidebar + `<Outlet />`. No scroll on the outer layout — only the feed column scrolls internally.

### `AppBar.tsx`
- Red background, `🌹 Rosebot` logo
- Right side: today's date formatted as "Sunday, March 22", logout icon button
- Date computed with `Intl.DateTimeFormat`
- On logout: calls `AuthContext.logout()`

### `Sidebar.tsx`
Data: `useQuery(['sources'], getSources)`.

Renders:
1. **Saved** link (star icon, count badge in grey) → navigates to `/saved`
2. **Per-type sections** (NEWS, REDDIT, TWITTER):
   - Section label
   - "All [Type]" item — clicking sets `type` filter, clears `sourceId`
   - Each source as an item with coloured dot — clicking sets `sourceId` filter, clears `type`
   - Counts: not tracked server-side; omitted or shown as the number of items currently loaded for that source
3. The active item (matching current filter) gets the `.active` style
4. Filter state lives in `FeedPage` and is passed down / communicated via URL search params (see below)

Filter state is kept in URL search params (`?type=NEWS` or `?sourceId=3`) so the browser back button works and links are shareable.

### `FeedPage.tsx`
Reads `type` and `sourceId` from URL search params → passes to `useInfiniteFeed`.

On mount:
1. Calls `getAppState()` to get `lastVisitedAt`
2. Calls `markVisited()` to stamp the new visit

State:
- `lastVisitedAt: string | null` (from app-state, kept in local state)
- `activePanelItemId: number | null` (which card has the panel open)

Renders:
- `<FilterChips />` (reads/writes URL params)
- `<NewSinceBanner />` (only if `lastVisitedAt` and there are items newer than it)
- Items grouped into time buckets with `<TimeDivider />` between groups
- Infinite scroll sentinel at bottom
- `<SummaryPanel />` overlaid on right

### `useInfiniteFeed.ts`
```typescript
useInfiniteQuery({
  queryKey: ['feed', { type, sourceId }],
  queryFn: ({ pageParam }) => getFeed({ before: pageParam, limit: 20, type, sourceId }),
  getNextPageParam: (lastPage) =>
    lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].publishedAt,
})
```
Cursor-based: `before` is the `publishedAt` of the last item on the previous page.

### `useInfiniteSaved.ts`
Same pattern, using `getSaved`.

### `useInfiniteScroll.ts`
```typescript
// Returns a ref to attach to a sentinel <div> at the bottom of the list.
// Calls fetchNextPage() when the sentinel enters the viewport.
function useInfiniteScroll(fetchNextPage: () => void, hasNextPage: boolean): RefObject<HTMLDivElement>
```

### `FeedCard.tsx`
Props:
```typescript
interface FeedCardProps {
  item: FeedItemResponse
  isActive: boolean          // panel open for this card
  lastVisitedAt: string | null
  onSummaryClick: (id: number) => void
  onSaveToggle: (id: number, saved: boolean) => void
}
```

Renders:
- Source badge (type colour), source name, relative time (`2h ago`, `Yesterday`)
- Title as a link (`href={item.url}`, `target="_blank"`)
- Content snippet if present
- Thumbnail if `thumbnailUrl` present (right-side, 80×80)
- Footer:
  - Engagement meta: for NEWS → nothing visible in footer meta area; for REDDIT → `{comments} comments · {upvotes} upvotes`; for TWITTER → `{likes} likes · {retweets} retweets` (from `item.engagement`)
  - Save button: ★ red if saved, ☆ grey if not — calls `onSaveToggle`
  - Summary button (NEWS and REDDIT only, not TWITTER): calls `onSummaryClick`

Save toggle: calls `saveItem` or `unsaveItem`, then does `queryClient.invalidateQueries(['feed'])` to refresh saved state. Optimistic update: flip `item.saved` in the cache immediately, revert on error.

### `FilterChips.tsx`
Four chips: All, News, Reddit, Twitter. Reading/writing URL search params. Active chip highlighted red.

### `NewSinceBanner.tsx`
Props: `{ count: number; lastVisitedAt: string }`. Shown only if `count > 0`.
Count: number of items in feed where `publishedAt > lastVisitedAt`.
Banner: red gradient, pulse dot, "**N new items** since your last visit · X ago".

### `TimeDivider.tsx`
Props: `{ label: string }` — outputs a horizontal rule with centred label text.

Grouping logic (in `FeedPage`):
```
items newer than lastVisitedAt         → "New"
items from today (but ≤ lastVisitedAt) → "Earlier Today"
items from yesterday                   → "Yesterday"
older                                  → weekday name, e.g. "Friday"
```
If `lastVisitedAt` is null, no "New" group — all items use date-based grouping only.

### `SummaryPanel.tsx`
Positioned absolutely on the right of `.feed-and-panel`, slides in/out with CSS transform. Width 360px.

Props:
```typescript
interface SummaryPanelProps {
  itemId: number | null     // null = closed
  item: FeedItemResponse | null
  onClose: () => void
}
```

Internally calls `useSummary(itemId)`:
- Loading state: skeleton text
- Error state: "Summary unavailable"
- Success: displays `summary.content`

Footer: "↗ Open full article" button linking to `item.url`.

When `itemId` changes, previous query result stays visible until new one loads (no flash of empty state).

### `useSummary.ts`
```typescript
useQuery({
  queryKey: ['summary', feedItemId],
  queryFn: () => getSummary(feedItemId),
  enabled: feedItemId !== null,
  staleTime: Infinity,   // summaries don't change
})
```

### `LoginPage.tsx`
Centred card layout (MUI `Card`, no sidebar/appbar). Email + password fields. On success: stores token, redirects to `/`. Error message shown inline if credentials are rejected.

### `SavedPage.tsx`
Same layout as `FeedPage` but uses `useInfiniteSaved`. No filter chips. No "new since" banner. No time dividers (or simple date-based dividers). Panel and save toggle work identically.

---

## Vite Proxy

Add to `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```
This avoids CORS during development. Build output is served by the Spring Boot backend in production.

---

## App-State / "New Since" Flow

1. On `FeedPage` mount: fire `getAppState()` and `markVisited()` concurrently.
2. Store the `lastVisitedAt` returned by `getAppState()` in local state (before it gets updated by `markVisited`).
3. Use that stored value for computing "New" group and the banner count.

This ensures the banner reflects the previous visit, not the current one.

---

## Pagination / Infinite Scroll

Both feed and saved use cursor-based infinite scroll:
- `before` param = `publishedAt` ISO string of the last item
- Page size: 20 (matches backend default)
- `useInfiniteScroll` hook attaches a sentinel `<div ref={sentinelRef} />` below the last item and calls `fetchNextPage` when it enters the viewport

---

## Save / Unsave — Optimistic Updates

```typescript
onMutate: async (feedItemId) => {
  await queryClient.cancelQueries(['feed'])
  const snapshot = queryClient.getQueryData(['feed', filters])
  queryClient.setQueryData(['feed', filters], (old) => toggleSavedInPages(old, feedItemId))
  return { snapshot }
},
onError: (_err, _vars, context) => {
  queryClient.setQueryData(['feed', filters], context.snapshot)
},
onSettled: () => queryClient.invalidateQueries(['feed'])
```

---

## Engagement Field Mapping

`item.engagement` is a free-form `Record<string, unknown>` from the backend JSONB field. Per source type:

| Type | Keys read from engagement |
|---|---|
| REDDIT | `comments: number`, `upvotes: number` |
| TWITTER | `likes: number`, `retweets: number` |
| NEWS | (none displayed in footer) |

Access safely: `(item.engagement?.comments as number) ?? 0`.

---

## What Stays / What Goes

| File | Action |
|---|---|
| `src/types/article.ts` | Delete |
| `src/services/articleService.ts` | Delete |
| `src/features/articles/` (3 files) | Delete |
| `src/App.tsx` | Rewrite |
| `src/main.tsx` | Rewrite (add QueryClientProvider, AuthProvider) |
| `package.json` | Add axios + @tanstack/react-query |
| `vite.config.ts` | Add proxy |
| All else | Create new |
