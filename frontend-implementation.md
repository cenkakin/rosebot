# Frontend Implementation Guide

Step-by-step with complete code. Apply in order — each step builds on the previous.

---

## Step 1 — Rename Module to `rosebot-web-app`

The folder and Maven module are renamed from `rosebot-frontend` to `rosebot-web-app` in preparation for a future `rosebot-mobile` React Native module sitting alongside it.

### 1a — Rename the folder

```bash
cd /path/to/rosebot
mv rosebot-frontend rosebot-web-app
```

### 1b — `rosebot-web-app/pom.xml`

Change `<artifactId>` and `<name>`:

```xml
<artifactId>rosebot-web-app</artifactId>
<name>rosebot-web-app</name>
```

### 1c — `rosebot-web-app/package.json`

Change the `name` field:

```json
"name": "rosebot-web-app"
```

### 1d — Root `pom.xml`

Two changes:

1. Module declaration:
```xml
<modules>
    <module>rosebot-web-app</module>
    <module>rosebot-api</module>
</modules>
```

2. `<dependencyManagement>` entry:
```xml
<dependency>
    <groupId>com.github.cenkakin</groupId>
    <artifactId>rosebot-web-app</artifactId>
    <version>${project.version}</version>
</dependency>
```

### 1e — `rosebot-api/pom.xml`

Update the frontend static-resources dependency:

```xml
<!-- Frontend static resources -->
<dependency>
    <groupId>com.github.cenkakin</groupId>
    <artifactId>rosebot-web-app</artifactId>
</dependency>
```

---

## Step 2 — Install npm Dependencies

```bash
cd rosebot-web-app
npm install axios @tanstack/react-query
```

No other changes to `package.json`. Vite proxy and TypeScript config are already correct.

---

## Step 3 — Delete Old Files

```bash
rm src/types/article.ts
rm src/services/articleService.ts
rm src/features/articles/ArticleCard.tsx
rm src/features/articles/ArticleFormDialog.tsx
rm src/features/articles/ArticleList.tsx
rm src/features/articles/useArticles.ts
rmdir src/features/articles
rmdir src/services
```

---

## Step 4 — Types

### `src/types/feedItem.ts`
```typescript
export interface FeedItemResponse {
  id: number
  sourceId: number
  sourceName: string
  sourceType: 'NEWS' | 'REDDIT' | 'TWITTER'
  title: string
  url: string
  content: string | null
  thumbnailUrl: string | null
  author: string | null
  engagement: Record<string, unknown> | null
  publishedAt: string
  saved: boolean
}
```

### `src/types/source.ts`
```typescript
export interface SourceResponse {
  id: number
  type: 'NEWS' | 'REDDIT' | 'TWITTER'
  name: string
  url: string
  enabled: boolean
  createdAt: string
}
```

### `src/types/auth.ts`
```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
}
```

### `src/types/summary.ts`
```typescript
export interface SummaryResponse {
  feedItemId: number
  content: string
  model: string
  generatedAt: string
}
```

### `src/types/appState.ts`
```typescript
export interface AppStateResponse {
  lastVisitedAt: string | null
}
```

---

## Step 5 — API Layer

### `src/api/client.ts`
```typescript
import axios from 'axios'

const TOKEN_KEY = 'rosebot_token'

export const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export const TOKEN_STORAGE_KEY = TOKEN_KEY
```

### `src/api/auth.ts`
```typescript
import type { AuthResponse, LoginRequest } from '../types/auth'
import { client } from './client'

export const login = (req: LoginRequest): Promise<AuthResponse> =>
  client.post<AuthResponse>('/auth/login', req).then((r) => r.data)
```

### `src/api/sources.ts`
```typescript
import type { SourceResponse } from '../types/source'
import { client } from './client'

export const getSources = (): Promise<SourceResponse[]> =>
  client.get<SourceResponse[]>('/sources').then((r) => r.data)
```

### `src/api/feed.ts`
```typescript
import type { FeedItemResponse } from '../types/feedItem'
import { client } from './client'

interface FeedParams {
  before?: string
  limit?: number
  sourceId?: number
  type?: string
}

export const getFeed = (params: FeedParams = {}): Promise<FeedItemResponse[]> =>
  client.get<FeedItemResponse[]>('/feed', { params }).then((r) => r.data)
```

### `src/api/saved.ts`
```typescript
import type { FeedItemResponse } from '../types/feedItem'
import { client } from './client'

interface SavedParams {
  before?: string
  limit?: number
}

export const getSaved = (params: SavedParams = {}): Promise<FeedItemResponse[]> =>
  client.get<FeedItemResponse[]>('/saved', { params }).then((r) => r.data)

export const saveItem = (feedItemId: number): Promise<void> =>
  client.post(`/saved/${feedItemId}`).then(() => undefined)

export const unsaveItem = (feedItemId: number): Promise<void> =>
  client.delete(`/saved/${feedItemId}`).then(() => undefined)
```

### `src/api/summary.ts`
```typescript
import type { SummaryResponse } from '../types/summary'
import { client } from './client'

export const getSummary = (feedItemId: number): Promise<SummaryResponse> =>
  client.get<SummaryResponse>(`/summaries/${feedItemId}`).then((r) => r.data)
```

### `src/api/appState.ts`
```typescript
import type { AppStateResponse } from '../types/appState'
import { client } from './client'

export const getAppState = (): Promise<AppStateResponse> =>
  client.get<AppStateResponse>('/app-state').then((r) => r.data)

export const markVisited = (): Promise<AppStateResponse> =>
  client.put<AppStateResponse>('/app-state/visited').then((r) => r.data)
```

---

## Step 6 — Auth Context

### `src/features/auth/AuthContext.tsx`
```typescript
import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_STORAGE_KEY } from '../../api/client'

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  login: () => {},
  logout: () => {},
})

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    return stored && isTokenValid(stored) ? stored : null
  })

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }, [token])

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
  }

  return <AuthContext value={{ token, login, logout }}>{children}</AuthContext>
}
```

### `src/features/auth/useAuth.ts`
```typescript
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export const useAuth = () => useContext(AuthContext)
```

### `src/features/auth/LoginPage.tsx`
```typescript
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login as loginApi } from '../../api/auth'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginApi({ email, password })
      login(res.token)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: 360, p: 1 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3} color="primary">
            🌹 Rosebot
          </Typography>
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
```

---

## Step 7 — Theme

### `src/theme.ts`
```typescript
import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    primary: { main: '#c62828' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
})

export const SOURCE_COLORS = {
  NEWS: {
    dot: '#1565c0',
    badgeBg: '#e3f0ff',
    badgeText: '#1565c0',
    label: 'News',
  },
  REDDIT: {
    dot: '#e64a19',
    badgeBg: '#fbe9e7',
    badgeText: '#bf360c',
    label: 'Reddit',
  },
  TWITTER: {
    dot: '#0288d1',
    badgeBg: '#e1f5fe',
    badgeText: '#0277bd',
    label: 'Twitter',
  },
} as const
```

---

## Step 8 — Routing and App Shell

### `src/features/auth/ProtectedRoute.tsx`
```typescript
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
```

### `src/App.tsx`
```typescript
import { Route, Routes } from 'react-router'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { Layout } from './features/layout/Layout'
import { FeedPage } from './features/feed/FeedPage'
import { SavedPage } from './features/saved/SavedPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/saved" element={<SavedPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

### `src/main.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { theme } from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
```

---

## Step 9 — Layout Components

### `src/features/layout/AppBar.tsx`
```typescript
import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar as MuiAppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

function formatDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export function AppBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <MuiAppBar position="static" elevation={2} sx={{ bgcolor: '#c62828', zIndex: 10 }}>
      <Toolbar sx={{ minHeight: 56, px: 3 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={0.5} sx={{ flexGrow: 0 }}>
          🌹 Rosebot
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.75, ml: 1.5, flexGrow: 1 }}>
          your daily digest
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {formatDate()}
          </Typography>
          <IconButton size="small" onClick={handleLogout} sx={{ color: '#fff' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
```

### `src/features/layout/Sidebar.tsx`
```typescript
import StarIcon from '@mui/icons-material/Star'
import { Box, Chip, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router'
import { getSources } from '../../api/sources'
import type { SourceResponse } from '../../types/source'
import { SOURCE_COLORS } from '../../theme'

function SourceDot({ type }: { type: SourceResponse['type'] }) {
  return (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: SOURCE_COLORS[type].dot,
        display: 'inline-block',
      }}
    />
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: Infinity,
  })

  const isSavedActive = location.pathname === '/saved'
  const activeType = searchParams.get('type')
  const activeSourceId = searchParams.get('sourceId')

  const setFilter = (params: { type?: string; sourceId?: string }) => {
    if (location.pathname !== '/') navigate('/')
    setSearchParams(params as Record<string, string>)
  }

  const byType = (type: SourceResponse['type']) =>
    sources.filter((s) => s.type === type && s.enabled)

  const renderSection = (type: SourceResponse['type']) => {
    const items = byType(type)
    if (items.length === 0) return null
    const colors = SOURCE_COLORS[type]
    const allActive = activeType === type && !activeSourceId

    return (
      <Box key={type}>
        <Typography
          variant="caption"
          sx={{ px: 2.5, py: 0.5, display: 'block', color: '#9e9e9e', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          {colors.label}
        </Typography>
        <ListItemButton
          selected={allActive}
          onClick={() => setFilter({ type })}
          sx={{ px: 2.5, py: 0.75, gap: 1.25 }}
        >
          <SourceDot type={type} />
          <ListItemText primary={`All ${colors.label}`} primaryTypographyProps={{ fontSize: 13.5 }} />
        </ListItemButton>
        {items.map((source) => (
          <ListItemButton
            key={source.id}
            selected={activeSourceId === String(source.id)}
            onClick={() => setFilter({ sourceId: String(source.id) })}
            sx={{ px: 2.5, py: 0.75, gap: 1.25 }}
          >
            <SourceDot type={source.type} />
            <ListItemText primary={source.name} primaryTypographyProps={{ fontSize: 13.5 }} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
      </Box>
    )
  }

  return (
    <Box
      component="nav"
      sx={{
        width: 220,
        flexShrink: 0,
        bgcolor: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        py: 2,
      }}
    >
      <List disablePadding>
        <ListItemButton
          selected={isSavedActive}
          onClick={() => navigate('/saved')}
          sx={{ px: 2.5, py: 1, gap: 1.25, mb: 1, borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
        >
          <StarIcon fontSize="small" sx={{ color: isSavedActive ? 'primary.main' : '#9e9e9e' }} />
          <ListItemText primary="Saved" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
          <Chip label="★" size="small" sx={{ bgcolor: '#757575', color: '#fff', height: 20, fontSize: 11, fontWeight: 700 }} />
        </ListItemButton>

        {(['NEWS', 'REDDIT', 'TWITTER'] as const).map(renderSection)}
      </List>
    </Box>
  )
}
```

### `src/features/layout/Layout.tsx`
```typescript
import { Box } from '@mui/material'
import { Outlet } from 'react-router'
import { AppBar } from './AppBar'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Outlet />
      </Box>
    </Box>
  )
}
```

---

## Step 10 — Shared Hook

### `src/hooks/useInfiniteScroll.ts`
```typescript
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export function useInfiniteScroll(
  fetchNextPage: () => void,
  hasNextPage: boolean,
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage])

  return sentinelRef
}
```

---

## Step 11 — Feed Feature

### `src/features/feed/useInfiniteFeed.ts`
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '../../api/feed'

interface FeedFilters {
  type?: string | null
  sourceId?: string | null
}

export function useInfiniteFeed({ type, sourceId }: FeedFilters) {
  return useInfiniteQuery({
    queryKey: ['feed', { type, sourceId }],
    queryFn: ({ pageParam }) =>
      getFeed({
        before: pageParam ?? undefined,
        limit: 20,
        type: type ?? undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].publishedAt,
  })
}
```

### `src/features/feed/FilterChips.tsx`
```typescript
import { Box, Chip } from '@mui/material'
import { useSearchParams } from 'react-router'

const CHIPS = [
  { label: 'All', type: null },
  { label: '📰 News', type: 'NEWS' },
  { label: '🔴 Reddit', type: 'REDDIT' },
  { label: '🐦 Twitter', type: 'TWITTER' },
] as const

export function FilterChips() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeType = searchParams.get('type')

  const handleClick = (type: string | null) => {
    if (type === null) {
      setSearchParams({})
    } else {
      setSearchParams({ type })
    }
  }

  return (
    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
      {CHIPS.map(({ label, type }) => {
        const isActive = type === null ? !activeType && !searchParams.get('sourceId') : activeType === type
        return (
          <Chip
            key={label}
            label={label}
            onClick={() => handleClick(type)}
            variant={isActive ? 'filled' : 'outlined'}
            color={isActive ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: isActive ? 700 : 400, cursor: 'pointer' }}
          />
        )
      })}
    </Box>
  )
}
```

### `src/features/feed/NewSinceBanner.tsx`
```typescript
import { Box, Typography } from '@mui/material'

interface Props {
  count: number
  lastVisitedAt: string
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

export function NewSinceBanner({ count, lastVisitedAt }: Props) {
  if (count === 0) return null
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #c62828, #e53935)',
        color: '#fff',
        borderRadius: 2.5,
        px: 2.25,
        py: 1.5,
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        boxShadow: '0 2px 8px rgba(198,40,40,.25)',
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          bgcolor: '#fff',
          borderRadius: '50%',
          flexShrink: 0,
          boxShadow: '0 0 0 3px rgba(255,255,255,.3)',
        }}
      />
      <Typography variant="body2">
        <strong>{count} new item{count !== 1 ? 's' : ''}</strong> since your last visit · {timeAgo(lastVisitedAt)}
      </Typography>
    </Box>
  )
}
```

### `src/features/feed/TimeDivider.tsx`
```typescript
import { Box, Typography } from '@mui/material'

export function TimeDivider({ label }: { label: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} my={2.5}>
      <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#9e9e9e', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
    </Box>
  )
}
```

### `src/features/feed/FeedCard.tsx`
```typescript
import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { SOURCE_COLORS } from '../../theme'

interface Props {
  item: FeedItemResponse
  isActive: boolean
  onSummaryClick: (id: number) => void
  onSaveToggle: (id: number, saved: boolean) => void
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EngagementMeta({ item }: { item: FeedItemResponse }) {
  const eng = item.engagement
  if (!eng) return null

  if (item.sourceType === 'REDDIT') {
    const comments = (eng.comments as number) ?? 0
    const upvotes = (eng.upvotes as number) ?? 0
    return (
      <Typography variant="caption" color="text.secondary">
        {upvotes.toLocaleString()} upvotes · {comments.toLocaleString()} comments
      </Typography>
    )
  }

  if (item.sourceType === 'TWITTER') {
    const likes = (eng.likes as number) ?? 0
    const retweets = (eng.retweets as number) ?? 0
    return (
      <Typography variant="caption" color="text.secondary">
        {likes.toLocaleString()} likes · {retweets.toLocaleString()} retweets
      </Typography>
    )
  }

  return null
}

export function FeedCard({ item, isActive, onSummaryClick, onSaveToggle }: Props) {
  const colors = SOURCE_COLORS[item.sourceType]
  const hasSummary = item.sourceType !== 'TWITTER'

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        borderColor: isActive ? 'primary.main' : '#e8e8e8',
        boxShadow: isActive ? '0 3px 12px rgba(198,40,40,.15)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
        '&:hover': { boxShadow: '0 3px 12px rgba(0,0,0,.08)', borderColor: '#d0d0d0' },
      }}
    >
      <CardContent sx={{ p: '16px 18px', '&:last-child': { pb: '16px' } }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              bgcolor: colors.badgeBg,
              color: colors.badgeText,
              textTransform: 'uppercase',
            }}
          >
            {colors.label}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {item.sourceName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#bdbdbd', ml: 'auto' }}>
            {relativeTime(item.publishedAt)}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onSaveToggle(item.id, item.saved)}
            sx={{ color: item.saved ? 'primary.main' : '#bdbdbd', p: 0.25 }}
          >
            {item.saved ? '★' : '☆'}
          </IconButton>
        </Box>

        {/* Body */}
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Box flex={1} minWidth={0}>
            <Typography
              component="a"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              fontWeight={600}
              sx={{
                display: 'block',
                color: '#212121',
                textDecoration: 'none',
                lineHeight: 1.35,
                mb: 0.75,
                '&:hover': { color: 'primary.main' },
              }}
            >
              {item.title}
            </Typography>
            {item.content && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {item.content}
              </Typography>
            )}
          </Box>
          {item.thumbnailUrl && (
            <Box
              component="img"
              src={item.thumbnailUrl}
              alt=""
              sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Footer */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
          <EngagementMeta item={item} />
          {hasSummary && (
            <Chip
              label={isActive ? '📋 Summary ✕' : '📋 Summary ▸'}
              size="small"
              onClick={() => onSummaryClick(item.id)}
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                ml: 'auto',
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
```

### `src/features/summary/useSummary.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../../api/summary'

export function useSummary(feedItemId: number | null) {
  return useQuery({
    queryKey: ['summary', feedItemId],
    queryFn: () => getSummary(feedItemId!),
    enabled: feedItemId !== null,
    staleTime: Infinity,
  })
}
```

### `src/features/summary/SummaryPanel.tsx`
```typescript
import { Box, Button, CircularProgress, Skeleton, Typography } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { useSummary } from './useSummary'
import { SOURCE_COLORS } from '../../theme'

interface Props {
  itemId: number | null
  item: FeedItemResponse | null
  onClose: () => void
}

export function SummaryPanel({ itemId, item, onClose }: Props) {
  const { data: summary, isLoading, isError } = useSummary(itemId)

  return (
    <Box
      sx={{
        width: 360,
        flexShrink: 0,
        bgcolor: '#fff',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: itemId ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s ease',
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        boxShadow: '-4px 0 16px rgba(0,0,0,.08)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: '16px 18px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
          {item && (
            <Box
              component="span"
              sx={{
                fontSize: 11,
                fontWeight: 700,
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: SOURCE_COLORS[item.sourceType].badgeBg,
                color: SOURCE_COLORS[item.sourceType].badgeText,
                textTransform: 'uppercase',
              }}
            >
              {SOURCE_COLORS[item.sourceType].label}
            </Box>
          )}
          <Button
            size="small"
            onClick={onClose}
            sx={{ ml: 'auto', minWidth: 0, color: '#9e9e9e', fontWeight: 400, fontSize: 18, lineHeight: 1, p: '2px 6px' }}
          >
            ✕
          </Button>
        </Box>
        {item && (
          <>
            <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.35 }}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {item.sourceName}
            </Typography>
          </>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.25 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#9e9e9e', mb: 1, display: 'block' }}
        >
          Summary
        </Typography>
        {isLoading && (
          <Box display="flex" flexDirection="column" gap={1}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="80%" />
          </Box>
        )}
        {isError && (
          <Typography variant="body2" color="text.secondary">
            Summary unavailable.
          </Typography>
        )}
        {summary && (
          <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#424242', whiteSpace: 'pre-line' }}>
            {summary.content}
          </Typography>
        )}
      </Box>

      {/* Footer */}
      {item && (
        <Box sx={{ p: '14px 18px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <Button
            component="a"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            fullWidth
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            ↗ Open full article
          </Button>
        </Box>
      )}
    </Box>
  )
}
```

### `src/features/feed/FeedPage.tsx`

This is the most complex component. It owns filter state, panel state, app-state loading, and item grouping.

```typescript
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Box, CircularProgress, Typography } from '@mui/material'
import { getAppState, markVisited } from '../../api/appState'
import { saveItem, unsaveItem } from '../../api/saved'
import type { FeedItemResponse } from '../../types/feedItem'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { FilterChips } from './FilterChips'
import { NewSinceBanner } from './NewSinceBanner'
import { TimeDivider } from './TimeDivider'
import { FeedCard } from './FeedCard'
import { SummaryPanel } from '../summary/SummaryPanel'
import { useInfiniteFeed } from './useInfiniteFeed'

type TimeGroup = 'new' | 'today' | 'yesterday' | string   // string = weekday name

function getTimeGroup(publishedAt: string, lastVisitedAt: string | null): TimeGroup {
  const pub = new Date(publishedAt)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)

  if (lastVisitedAt && pub > new Date(lastVisitedAt)) return 'new'
  if (pub >= todayStart) return 'today'
  if (pub >= yesterdayStart) return 'yesterday'
  return pub.toLocaleDateString('en-US', { weekday: 'long' })
}

const GROUP_LABELS: Record<string, string> = {
  new: 'New',
  today: 'Earlier Today',
  yesterday: 'Yesterday',
}

function groupLabel(key: string): string {
  return GROUP_LABELS[key] ?? key
}

export function FeedPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')
  const sourceId = searchParams.get('sourceId')

  const [lastVisitedAt, setLastVisitedAt] = useState<string | null>(null)
  const [activePanelId, setActivePanelId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  // Load app-state and mark visited on mount
  useEffect(() => {
    getAppState().then((s) => setLastVisitedAt(s.lastVisitedAt))
    markVisited()
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteFeed({ type, sourceId })

  const allItems: FeedItemResponse[] = data?.pages.flat() ?? []

  const sentinelRef = useInfiniteScroll(fetchNextPage, !!hasNextPage)

  // Save / unsave mutation with optimistic update
  const toggleSave = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: boolean }) =>
      saved ? unsaveItem(id) : saveItem(id),
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const queryKey = ['feed', { type, sourceId }]
      const snapshot = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: FeedItemResponse[]) =>
            page.map((item) => (item.id === id ? { ...item, saved: !saved } : item)),
          ),
        }
      })
      return { snapshot, queryKey }
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.snapshot)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })

  // Group items by time bucket
  const grouped: Array<{ key: string; items: FeedItemResponse[] }> = []
  for (const item of allItems) {
    const key = getTimeGroup(item.publishedAt, lastVisitedAt)
    const last = grouped[grouped.length - 1]
    if (last?.key === key) {
      last.items.push(item)
    } else {
      grouped.push({ key, items: [item] })
    }
  }

  const newCount = lastVisitedAt
    ? allItems.filter((i) => new Date(i.publishedAt) > new Date(lastVisitedAt)).length
    : 0

  const activePanelItem = allItems.find((i) => i.id === activePanelId) ?? null

  const handleSummaryClick = (id: number) => {
    setActivePanelId((prev) => (prev === id ? null : id))
  }

  const handleSaveToggle = (id: number, saved: boolean) => {
    toggleSave.mutate({ id, saved })
  }

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      {/* Feed column */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: '20px 24px',
          mr: activePanelId ? '360px' : 0,
          transition: 'margin-right .3s ease',
        }}
      >
        <FilterChips />

        {lastVisitedAt && newCount > 0 && (
          <NewSinceBanner count={newCount} lastVisitedAt={lastVisitedAt} />
        )}

        {isLoading && (
          <Box display="flex" justifyContent="center" pt={6}>
            <CircularProgress />
          </Box>
        )}

        {grouped.map(({ key, items }) => (
          <Box key={key}>
            <TimeDivider label={groupLabel(key)} />
            {items.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                isActive={activePanelId === item.id}
                onSummaryClick={handleSummaryClick}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </Box>
        ))}

        {isFetchingNextPage && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!hasNextPage && allItems.length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" py={3}>
            You're all caught up.
          </Typography>
        )}

        <div ref={sentinelRef} />
      </Box>

      {/* Side panel */}
      <SummaryPanel
        itemId={activePanelId}
        item={activePanelItem}
        onClose={() => setActivePanelId(null)}
      />
    </Box>
  )
}
```

---

## Step 12 — Saved Feature

### `src/features/saved/useInfiniteSaved.ts`
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSaved } from '../../api/saved'

export function useInfiniteSaved() {
  return useInfiniteQuery({
    queryKey: ['saved'],
    queryFn: ({ pageParam }) => getSaved({ before: pageParam ?? undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].publishedAt,
  })
}
```

### `src/features/saved/SavedPage.tsx`
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { saveItem, unsaveItem } from '../../api/saved'
import type { FeedItemResponse } from '../../types/feedItem'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { FeedCard } from '../feed/FeedCard'
import { SummaryPanel } from '../summary/SummaryPanel'
import { useInfiniteSaved } from './useInfiniteSaved'

export function SavedPage() {
  const [activePanelId, setActivePanelId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSaved()

  const allItems: FeedItemResponse[] = data?.pages.flat() ?? []
  const sentinelRef = useInfiniteScroll(fetchNextPage, !!hasNextPage)

  const toggleSave = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: boolean }) =>
      saved ? unsaveItem(id) : saveItem(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  })

  const activePanelItem = allItems.find((i) => i.id === activePanelId) ?? null

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: '20px 24px',
          mr: activePanelId ? '360px' : 0,
          transition: 'margin-right .3s ease',
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={2}>
          Saved
        </Typography>

        {isLoading && (
          <Box display="flex" justifyContent="center" pt={6}>
            <CircularProgress />
          </Box>
        )}

        {allItems.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            isActive={activePanelId === item.id}
            onSummaryClick={(id) => setActivePanelId((prev) => (prev === id ? null : id))}
            onSaveToggle={(id, saved) => toggleSave.mutate({ id, saved })}
          />
        ))}

        {isFetchingNextPage && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!hasNextPage && allItems.length === 0 && !isLoading && (
          <Typography variant="body2" color="text.secondary" textAlign="center" pt={6}>
            Nothing saved yet.
          </Typography>
        )}

        <div ref={sentinelRef} />
      </Box>

      <SummaryPanel
        itemId={activePanelId}
        item={activePanelItem}
        onClose={() => setActivePanelId(null)}
      />
    </Box>
  )
}
```

---

## Step 13 — Create Missing Directories

Before writing files, ensure these directories exist:

```bash
mkdir -p src/api
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/features/auth
mkdir -p src/features/layout
mkdir -p src/features/feed
mkdir -p src/features/saved
mkdir -p src/features/summary
```

---

## Summary of All Files Written

| File | Step |
|---|---|
| `rosebot-web-app/pom.xml` | 1 |
| `rosebot-web-app/package.json` | 1 |
| Root `pom.xml` | 1 |
| `rosebot-api/pom.xml` | 1 |
| `src/types/feedItem.ts` | 4 |
| `src/types/source.ts` | 4 |
| `src/types/auth.ts` | 4 |
| `src/types/summary.ts` | 4 |
| `src/types/appState.ts` | 4 |
| `src/api/client.ts` | 5 |
| `src/api/auth.ts` | 5 |
| `src/api/sources.ts` | 5 |
| `src/api/feed.ts` | 5 |
| `src/api/saved.ts` | 5 |
| `src/api/summary.ts` | 5 |
| `src/api/appState.ts` | 5 |
| `src/features/auth/AuthContext.tsx` | 6 |
| `src/features/auth/useAuth.ts` | 6 |
| `src/features/auth/LoginPage.tsx` | 6 |
| `src/theme.ts` | 7 |
| `src/features/auth/ProtectedRoute.tsx` | 8 |
| `src/App.tsx` | 8 |
| `src/main.tsx` | 8 |
| `src/features/layout/AppBar.tsx` | 9 |
| `src/features/layout/Sidebar.tsx` | 9 |
| `src/features/layout/Layout.tsx` | 9 |
| `src/hooks/useInfiniteScroll.ts` | 10 |
| `src/features/feed/useInfiniteFeed.ts` | 11 |
| `src/features/feed/FilterChips.tsx` | 11 |
| `src/features/feed/NewSinceBanner.tsx` | 11 |
| `src/features/feed/TimeDivider.tsx` | 11 |
| `src/features/feed/FeedCard.tsx` | 11 |
| `src/features/summary/useSummary.ts` | 11 |
| `src/features/summary/SummaryPanel.tsx` | 11 |
| `src/features/feed/FeedPage.tsx` | 11 |
| `src/features/saved/useInfiniteSaved.ts` | 12 |
| `src/features/saved/SavedPage.tsx` | 12 |

**Files deleted:** `src/types/article.ts`, `src/services/articleService.ts`, `src/features/articles/` (3 files).
**Files rewritten:** `src/App.tsx`, `src/main.tsx`.
**No changes needed:** `vite.config.ts` (proxy already configured).
