import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, CircularProgress, Chip, Typography } from '@mui/material'
import type { ClusterResponse } from '../../types/cluster'
import { saveItem, unsaveItem } from '../../api/saved'
import { FeedCard } from '../feed/FeedCard'
import { useToast } from '../../hooks/useToast'
import { useClusterItems } from './useClusterItems'
import { BRAND } from '../../theme'
import { CATEGORY_LABELS, CATEGORY_COLORS, type CategoryValue } from '../../constants/categories'
import type { FeedItemResponse } from '../../types/feedItem'
import { relativeTime } from '../../utils/time'

interface Props {
  cluster: ClusterResponse
}

export function ClusterColumn({ cluster }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const { showToast, ToastSnackbar } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useClusterItems(cluster.id, visible)

  const allItems: FeedItemResponse[] = data?.pages.flat() ?? []

  const toggleSave = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: boolean }) =>
      saved ? unsaveItem(id) : saveItem(id),
    onSuccess: (_data, { saved }) => {
      showToast(saved ? 'Removed from saved' : 'Saved')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-items', cluster.id] })
      queryClient.removeQueries({ queryKey: ['saved'] })
    },
  })

  const categoryColors = cluster.category
    ? CATEGORY_COLORS[cluster.category as CategoryValue]
    : null
  const categoryLabel = cluster.category
    ? (CATEGORY_LABELS[cluster.category as CategoryValue] ?? cluster.category)
    : null

  return (
    <Box
      ref={ref}
      sx={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${BRAND.border}`,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.5 }}>
          {cluster.label}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            {cluster.articleCount} articles · {relativeTime(cluster.windowStart)}
          </Typography>
          {categoryColors && categoryLabel && (
            <Chip
              label={categoryLabel}
              size="small"
              sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: categoryColors.bg, color: categoryColors.text }}
            />
          )}
          {cluster.languages.map((lang) => (
            <Chip key={lang} label={lang.toUpperCase()} size="small" sx={{ fontSize: 10, height: 18 }} />
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        {isLoading && (
          <Box display="flex" justifyContent="center" pt={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {allItems.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            isActive={false}
            hasContent={false}
            onContentClick={() => {}}
            onSaveToggle={(id, saved) => toggleSave.mutate({ id, saved })}
          />
        ))}

        {isFetchingNextPage && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        )}

        {hasNextPage && !isFetchingNextPage && (
          <Box display="flex" justifyContent="center" py={1}>
            <Typography
              variant="caption"
              sx={{ color: BRAND.accent, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => fetchNextPage()}
            >
              Load more
            </Typography>
          </Box>
        )}
      </Box>

      {ToastSnackbar}
    </Box>
  )
}
