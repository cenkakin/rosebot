import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Box, CircularProgress, Typography } from '@mui/material'
import { getAppState, markVisited } from '../../api/appState'
import { saveItem, unsaveItem } from '../../api/saved'
import type { FeedItemResponse } from '../../types/feedItem'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { useToast } from '../../hooks/useToast'
import { NewSinceBanner } from './NewSinceBanner'
import { TimeDivider } from './TimeDivider'
import { FeedCard } from './FeedCard'
import { FeedLayout } from './FeedLayout'
import { useInfiniteFeed } from './useInfiniteFeed'
import { useSummaryPrefetch } from '../summary/useSummaryPrefetch'
import { ErrorMessage } from '../../components/ErrorMessage'

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
  const { showToast, ToastSnackbar } = useToast()

  const queryClient = useQueryClient()

  // Load app-state and mark visited on mount
  useEffect(() => {
    getAppState().then((s) => setLastVisitedAt(s.lastVisitedAt))
    markVisited()
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteFeed({ type, sourceId })

  const allItems: FeedItemResponse[] = data?.pages.flat() ?? []

  const summaryIds = useSummaryPrefetch(allItems)
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
    onSuccess: (_data, { saved }) => {
      showToast(saved ? 'Removed from saved' : 'Saved')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.removeQueries({ queryKey: ['saved'] })
      queryClient.removeQueries({ queryKey: ['saved-sources'] })
    },
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

  return (
    <FeedLayout
      activePanelId={activePanelId}
      activePanelItem={activePanelItem}
      onPanelClose={() => setActivePanelId(null)}
    >
      {lastVisitedAt && newCount > 0 && (
        <NewSinceBanner count={newCount} lastVisitedAt={lastVisitedAt} />
      )}

      {isError && <ErrorMessage message="Failed to load feed." />}

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
              hasSummary={summaryIds.has(item.id)}
              onSummaryClick={(id) => setActivePanelId((prev) => (prev === id ? null : id))}
              onSaveToggle={(id, saved) => toggleSave.mutate({ id, saved })}
            />
          ))}
        </Box>
      ))}

      {isFetchingNextPage && (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={24} />
        </Box>
      )}

      {allItems.length > 0 && (
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" py={3}>
          {hasNextPage
            ? `Showing ${allItems.length} items · scroll for more`
            : `All caught up — ${allItems.length} items`}
        </Typography>
      )}

      <div ref={sentinelRef} />
      {ToastSnackbar}
    </FeedLayout>
  )
}
