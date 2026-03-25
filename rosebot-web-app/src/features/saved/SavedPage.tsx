import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
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

  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')
  const sourceId = searchParams.get('sourceId')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSaved({ type, sourceId })

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
