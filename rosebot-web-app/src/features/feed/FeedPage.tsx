import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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
