Good plan, go for it.

# Plan 05 — Frontend Error States

## Problem

When any query fails, TanStack Query sets `isError = true` but no component renders an error
message. The user sees an empty list or a blank panel — indistinguishable from "no data". This
makes network failures and server errors invisible.

---

## Shared Component

Extract a reusable `ErrorMessage` component to avoid repeating the same MUI `Alert` in every page:

```tsx
// src/components/ErrorMessage.tsx
import { Alert } from '@mui/material'

interface Props {
  message?: string
}

export function ErrorMessage({ message = 'Something went wrong. Please try refreshing.' }: Props) {
  return (
    <Alert severity="error" sx={{ mx: 'auto', mt: 4, maxWidth: 480 }}>
      {message}
    </Alert>
  )
}
```

---

## Per-Component Changes

### `FeedPage`

`useInfiniteFeed` already exposes `isError`. Add a guard after the loading state:

```tsx
if (isError) return <ErrorMessage message="Failed to load feed." />
```

### `SavedPage`

Same pattern with `useInfiniteSaved`:

```tsx
if (isError) return <ErrorMessage message="Failed to load saved items." />
```

### `SummaryPanel`

`useSummary` exposes `isError`. Currently the panel shows a skeleton indefinitely or goes blank.
Replace with:

```tsx
{isError && (
  <Typography variant="body2" color="error" sx={{ p: 2 }}>
    Summary unavailable for this item.
  </Typography>
)}
```

This is intentionally a softer message than `ErrorMessage` since a missing summary is a common
expected state (not all items have one), not a generic network failure.

### `Sidebar`

The sources query failing silently leaves the sidebar empty with no explanation. Add:

```tsx
{sourcesError && (
  <Typography variant="caption" sx={{ px: 2.5, color: 'error.main' }}>
    Failed to load sources
  </Typography>
)}
```

---

## Files Touched

| File | Change |
|---|---|
| `src/components/ErrorMessage.tsx` | **New file** — shared error alert component |
| `features/feed/FeedPage.tsx` | Add `isError` guard |
| `features/saved/SavedPage.tsx` | Add `isError` guard |
| `features/summary/SummaryPanel.tsx` | Add error state for missing/failed summary |
| `features/layout/Sidebar.tsx` | Add error state for failed sources query |
