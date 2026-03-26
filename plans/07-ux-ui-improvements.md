Skip UX-02, UX-04 go for option A, Like the others.

# Plan 07 — UX / UI Improvements

Each improvement is a standalone, self-contained change. Apply and review one at a time.

---

## UX-01 — Save / unsave feedback (Snackbar)

**What:** When a user saves or unsaves an item, a brief toast confirms the action.
Currently the star toggles but there is no acknowledgement.

**Change:**
- Add a `Snackbar` + `Alert` to `FeedPage` and `SavedPage` (or a shared context)
- Show "Saved" on save, "Removed from saved" on unsave
- Auto-dismiss after 2 seconds

**Files:** `FeedPage.tsx`, `SavedPage.tsx` (or a new `useToast` hook + `ToastProvider`)

---

## UX-02 — Rename summary chip to "AI Summary"

**What:** Replace "📋 Summary ▸" / "📋 Summary ✕" with "AI Summary ▸" / "AI Summary ✕".
More self-explanatory for first-time users.

**Change:** One-line string change in `FeedCard.tsx`.

**Files:** `features/feed/FeedCard.tsx`

---

## UX-03 — Show "Saved at" timestamp on Saved page

**What:** The Saved list is ordered by `saved_at` but each card shows `publishedAt`. The ordering
seems random to the user. Show "Saved X ago" below or alongside the publication date when the item
is displayed in the Saved context.

**Depends on:** Plan 01 (adds `savedAt` to `FeedItemResponse`).

**Change:**
- `FeedCard` receives an optional `savedAt` prop (or reads it from `item.savedAt`)
- Renders "Saved X ago" as a secondary caption when present
- The `relativeTime` utility from Plan 06-E handles formatting

**Files:** `features/feed/FeedCard.tsx`, `features/saved/SavedPage.tsx`

---

## UX-04 — Unify AppBar / Sidebar / Content colours

**What:** Three disconnected background tones (dark maroon AppBar, white Sidebar, light grey
Content) make the layout feel like different products stitched together.

**Option A — Dark sidebar (recommended for a reader/feed app):**
Give the sidebar the same dark background as the AppBar (`#1c0a0a`), with light text and subtle
dividers. The content area stays light. This is the pattern used by apps like Feedly, Slack, and
Linear.

**Option B — Light AppBar:**
Bring the AppBar down to a light background (white or `#f5f5f5`) with coloured text/icons. Sidebar
and content merge visually. Simpler but loses the dramatic brand feel.

**Files:** `features/layout/AppBar.tsx`, `features/layout/Sidebar.tsx`, `theme.ts`

---

## UX-05 — Login → main app transition

**What:** The login page background is `#1c0a0a` (near black); the main app is `#f5f5f5` (near
white). The hard cut is jarring.

**Change:**
Add a CSS fade transition on the root `<Box>` in `Layout.tsx` so the content fades in after
login rather than snapping. A simple `opacity` animation with a 200ms ease-in is enough:

```tsx
sx={{ animation: 'fadeIn 0.2s ease-in', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}
```

**Files:** `features/layout/Layout.tsx`

---

## UX-06 — Empty state illustration on Saved page

**What:** "Nothing saved yet." is plain text. An illustration makes the state feel intentional
rather than broken, and gives users a cue to take action.

**Change:**
Replace the plain `Typography` with a centred block showing:
- The rosebot logo SVG at ~96px, dimmed (opacity 0.15)
- "Nothing saved yet" heading
- "Star any article in your feed to save it here." subtext

**Files:** `features/saved/SavedPage.tsx`, `src/assets/rosebot-logo.svg` (already imported)

---

## UX-07 — Sidebar collapse / responsive layout

**What:** The 220px fixed sidebar is always visible, takes up significant space on small screens,
and has no way to be hidden. Standard pattern: a toggle button on the AppBar collapses the sidebar
into a drawer on smaller viewports.

**Change:**
- Add a hamburger `IconButton` to the AppBar (visible below `md` breakpoint)
- Convert the sidebar to a MUI `Drawer` on mobile (`variant="temporary"`) and keep it as a
  persistent panel on desktop (`variant="permanent"`)
- `Layout.tsx` manages `sidebarOpen` state and passes the toggle down

**Files:** `features/layout/Layout.tsx`, `features/layout/AppBar.tsx`,
`features/layout/Sidebar.tsx`

---

## UX-08 — Summary panel mobile handling

**What:** The summary panel is a fixed-width 360px overlay on the right. On screens narrower than
~800px, the main content is squeezed to ~400px, which is unusable.

**Change:**
Below the `sm` breakpoint, render the panel as a MUI `Drawer` anchored to the bottom
(`anchor="bottom"`) with a max-height of 60vh instead of a side panel. Above `sm`, keep the current
right-side panel behaviour.

**Files:** `features/summary/SummaryPanel.tsx`

---

## UX-09 — Pagination depth indicator

**What:** With infinite scroll, users have no sense of how many items are loaded or how many remain.
An article from yesterday could be buried 200 items deep with no indication.

**Change:**
Show a subtle counter at the bottom of the list, below the last card and above the scroll sentinel:

```
Showing 40 items · scroll for more
```

When there are no more pages, replace with:

```
All caught up — 63 items
```

**Files:** `features/feed/FeedPage.tsx`, `features/saved/SavedPage.tsx`
(or extracted into the shared `ItemListPage` from Plan 06-A)

---

## Suggested Order

| Step | ID | Effort | Impact |
|---|---|---|---|
| 1 | UX-02 | ~5 min | Low |
| 2 | UX-05 | ~10 min | Medium |
| 3 | UX-01 | ~30 min | High |
| 4 | UX-06 | ~30 min | Medium |
| 5 | UX-03 | ~30 min (needs Plan 01) | Medium |
| 6 | UX-09 | ~30 min | Medium |
| 7 | UX-04 | ~1 hour | High |
| 8 | UX-07 | ~2 hours | High |
| 9 | UX-08 | ~1 hour | Medium |
