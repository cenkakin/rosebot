import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Box, CircularProgress, Typography } from '@mui/material'
import { saveItem, unsaveItem } from '../../api/saved'
import type { FeedItemResponse } from '../../types/feedItem'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { useToast } from '../../hooks/useToast'
import { FeedCard } from '../feed/FeedCard'
import rosebotLogo from '../../assets/rosebot-logo.svg'
import { FeedLayout } from '../feed/FeedLayout'
import { useInfiniteSaved } from './useInfiniteSaved'
import { useSummaryPrefetch } from '../summary/useSummaryPrefetch'
import { ErrorMessage } from '../../components/ErrorMessage'

export function SavedPage() {
  const [activePanelId, setActivePanelId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { showToast, ToastSnackbar } = useToast()

  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')
  const sourceId = searchParams.get('sourceId')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteSaved({ type, sourceId })

  const allItems: FeedItemResponse[] = data?.pages.flat() ?? []
  const summaryIds = useSummaryPrefetch(allItems)
  const sentinelRef = useInfiniteScroll(fetchNextPage, !!hasNextPage)

  const toggleSave = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: boolean }) =>
      saved ? unsaveItem(id) : saveItem(id),
    onSuccess: (_data, { saved }) => {
      showToast(saved ? 'Removed from saved' : 'Saved')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  })

  const activePanelItem = allItems.find((i) => i.id === activePanelId) ?? null

  return (
    <FeedLayout
      activePanelId={activePanelId}
      activePanelItem={activePanelItem}
      onPanelClose={() => setActivePanelId(null)}
    >
      <Typography variant="h6" fontWeight={700} mb={2}>
        Saved
      </Typography>

      {isError && <ErrorMessage message="Failed to load saved items." />}

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
          hasSummary={summaryIds.has(item.id)}
          onSummaryClick={(id) => setActivePanelId((prev) => (prev === id ? null : id))}
          onSaveToggle={(id, saved) => toggleSave.mutate({ id, saved })}
        />
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
            : `${allItems.length} saved items`}
        </Typography>
      )}

      {!hasNextPage && allItems.length === 0 && !isLoading && (
        <Box display="flex" flexDirection="column" alignItems="center" pt={8} gap={1.5}>
          <Box component="img" src={rosebotLogo} alt="" sx={{ width: 96, height: 'auto', opacity: 0.15 }} />
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
            Nothing saved yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Star any article in your feed to save it here.
          </Typography>
        </Box>
      )}

      <div ref={sentinelRef} />
      {ToastSnackbar}
    </FeedLayout>
  )
}
