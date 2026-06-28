import { useEffect, useRef, useState } from 'react'
import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import type { ClusterResponse } from '../../types/cluster'
import type { FeedItemResponse } from '../../types/feedItem'
import { useClusterItems } from './useClusterItems'
import { CompactArticleRow } from './CompactArticleRow'
import { shortDate } from '../../utils/time'
import { BRAND } from '../../theme'
import { CATEGORY_LABELS, CATEGORY_COLORS, type CategoryValue } from '../../constants/categories'

interface Props {
  cluster: ClusterResponse
  onOpen: (item: FeedItemResponse) => void
  onSaveToggle: (id: number, saved: boolean) => void
}

export function DigestStory({ cluster, onOpen, onSaveToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

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
  const shown = expanded ? allItems : allItems.slice(0, 3)

  const categoryColors = cluster.category ? CATEGORY_COLORS[cluster.category as CategoryValue] : null
  const categoryLabel = cluster.category ? (CATEGORY_LABELS[cluster.category as CategoryValue] ?? cluster.category) : null

  return (
    <Box
      ref={ref}
      sx={{
        border: `1px solid ${BRAND.cardBorder}`,
        borderRadius: 3.5,
        bgcolor: '#fffdfb',
        p: 2,
        mb: 1.75,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: 18 }}>
          {cluster.label}
        </Typography>
        <Typography variant="caption" sx={{ color: BRAND.mutedText, whiteSpace: 'nowrap' }}>
          {shortDate(cluster.windowStart)} · {cluster.articleCount} articles
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={0.75} mt={0.75} flexWrap="wrap">
        {categoryColors && categoryLabel && (
          <Chip label={categoryLabel} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: categoryColors.bg, color: categoryColors.text }} />
        )}
        {cluster.languages.map((lang) => (
          <Chip key={lang} label={lang.toUpperCase()} size="small" sx={{ fontSize: 10, height: 18 }} />
        ))}
      </Box>

      <Typography variant="body2" sx={{ color: '#5a4438', lineHeight: 1.55, mt: 1.25, fontSize: 13.5 }}>
        {cluster.summary}
      </Typography>

      <Box mt={1}>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={18} />
          </Box>
        )}
        {shown.map((item) => (
          <CompactArticleRow key={item.id} item={item} onOpen={onOpen} onSaveToggle={onSaveToggle} />
        ))}
        {allItems.length > 3 && (
          <Typography
            variant="caption"
            onClick={() => setExpanded((v) => !v)}
            sx={{ display: 'inline-block', mt: 1, color: BRAND.accent, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            {expanded ? 'Show fewer' : `Show all ${cluster.articleCount} articles →`}
          </Typography>
        )}
        {expanded && isFetchingNextPage && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        )}
        {expanded && hasNextPage && !isFetchingNextPage && (
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
    </Box>
  )
}
