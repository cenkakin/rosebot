All looks great! Go for it.

# Plan 06 — Frontend Refactoring

Five independent tasks. They can be applied together in one pass or separately.

---

## Task A — Extract shared `ItemListPage` component

### Problem

`FeedPage` and `SavedPage` share ~70% of their JSX and logic: infinite scroll sentinel, `FeedCard`
list, `SummaryPanel` integration, `activePanelId` state, and `toggleSave` mutation.

### Fix

Extract a shared `ItemListPage` component:

```tsx
// features/feed/ItemListPage.tsx
interface Props {
  items: FeedItemResponse[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  isError: boolean
  fetchNextPage: () => void
  header?: React.ReactNode
}
```

`FeedPage` passes its time-grouped header (new banner + time dividers) as the `header` slot.
`SavedPage` passes a simple `<Typography>Saved</Typography>` title.

Both pages keep their own data hooks (`useInfiniteFeed`, `useInfiniteSaved`) and the `toggleSave`
mutation — those are intentionally separate since they invalidate different query keys.

### Files Touched

| File | Change |
|---|---|
| `features/feed/ItemListPage.tsx` | **New file** |
| `features/feed/FeedPage.tsx` | Use `ItemListPage` for the list section |
| `features/saved/SavedPage.tsx` | Use `ItemListPage` for the list section |

---

## Task B — Move brand colours into `theme.ts`

### Problem

Dark brand colours (`#1c0a0a`, `#7a4040`, `#d4607a`, `#3a1010`, `#9e6060`) are hardcoded in
`AppBar.tsx`, `LoginPage.tsx`, and `Sidebar.tsx`. A brand colour change requires touching every
file.

### Fix

Extend `theme.ts` with custom palette tokens. MUI supports this via module augmentation:

```ts
// theme.ts
declare module '@mui/material/styles' {
  interface Palette {
    brand: {
      darkBg: string
      border: string
      rose: string
      mutedText: string
      dimText: string
    }
  }
  interface PaletteOptions {
    brand?: Palette['brand']
  }
}

export const theme = createTheme({
  palette: {
    primary: { main: '#c62828' },
    background: { default: '#f5f5f5' },
    brand: {
      darkBg:    '#1c0a0a',
      border:    '#3a1010',
      rose:      '#d4607a',
      mutedText: '#9e6060',
      dimText:   '#7a4040',
    },
  },
  ...
})
```

Replace every hardcoded hex in components with `theme.palette.brand.*` via the `sx` prop or
`useTheme()`.

### Files Touched

| File | Change |
|---|---|
| `theme.ts` | Add `brand` palette + module augmentation |
| `features/layout/AppBar.tsx` | Use `theme.palette.brand.*` |
| `features/auth/LoginPage.tsx` | Use `theme.palette.brand.*` |
| `features/layout/Sidebar.tsx` | Use `theme.palette.brand.*` |

---

## Task C — Remove `FilterChips`

### Problem

`FilterChips` inside `FeedPage` and the source type sections in the `Sidebar` both set `?type=NEWS`
(or REDDIT/TWITTER). Having two controls that do the same thing is confusing, and the chips become
redundant once the sidebar is the primary navigation.

### Fix

Remove `FilterChips` from `FeedPage` entirely. The sidebar already handles type and source-level
filtering. If mobile support is added later (Plan UX-07), the chips could return as a collapsed
mobile-only alternative when the sidebar is hidden.

### Files Touched

| File | Change |
|---|---|
| `features/feed/FilterChips.tsx` | Delete |
| `features/feed/FeedPage.tsx` | Remove `<FilterChips>` usage |

---

## Task D — Fix `staleTime: Infinity` on sources

### Problem

`getSources` uses `staleTime: Infinity`, meaning the source list never re-fetches. Sources added or
deleted in another session are invisible until a hard refresh.

### Fix

Change to a 5-minute stale time:

```ts
staleTime: 5 * 60 * 1000
```

Apply to both the `sources` query in `Sidebar.tsx` and any future query that fetches sources.

### Files Touched

| File | Change |
|---|---|
| `features/layout/Sidebar.tsx` | `staleTime: 5 * 60 * 1000` on `sources` query |

---

## Task E — Extract `relativeTime` to `src/utils/time.ts`

### Problem

`relativeTime` is a pure utility function defined inline in `FeedCard.tsx`. It will be needed in
other places (e.g. showing "Saved 2 days ago" if Plan 01 Option C is applied).

### Fix

Create `src/utils/time.ts`:

```ts
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
```

Remove the inline definition from `FeedCard.tsx` and import from the utility.

### Files Touched

| File | Change |
|---|---|
| `src/utils/time.ts` | **New file** |
| `features/feed/FeedCard.tsx` | Remove inline `relativeTime`, import from utils |

---

## Task F — Fix `ProtectedRoute` unauthenticated flash

### Problem

On page load, before the auth state is determined, `ProtectedRoute` may briefly render nothing or
redirect to login. This creates a visual flash on hard refresh even when the user is authenticated.

### Fix

`AuthContext` should expose an `isInitializing` boolean that is `true` until the token has been
read from `localStorage` and validated. `ProtectedRoute` renders a full-screen spinner while
`isInitializing` is true, then either renders the outlet or redirects.

```tsx
// ProtectedRoute.tsx
const { token, isInitializing } = useAuth()

if (isInitializing) return <CircularProgress ... />  // centred full-screen
if (!token) return <Navigate to="/login" replace />
return <Outlet />
```

In `AuthContext`, set `isInitializing = false` after the initial `useEffect` that reads
`localStorage` runs.

### Files Touched

| File | Change |
|---|---|
| `features/auth/AuthContext.tsx` | Add `isInitializing` state, set false after init effect |
| `features/auth/useAuth.ts` | Expose `isInitializing` |
| `features/auth/ProtectedRoute.tsx` | Guard with spinner while initializing |
