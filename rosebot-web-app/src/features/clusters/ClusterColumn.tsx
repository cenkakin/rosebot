import {useEffect, useRef, useState} from 'react'
import {Box, Chip, CircularProgress, Typography} from '@mui/material'
import type {ClusterResponse} from '../../types/cluster'
import type {FeedItemResponse} from '../../types/feedItem'
import {CompactArticleRow} from './CompactArticleRow'
import {useClusterItems} from './useClusterItems'
import {shortDate} from '../../utils/time'
import {BRAND} from '../../theme'
import {CATEGORY_COLORS, CATEGORY_LABELS, type CategoryValue} from '../../constants/categories'

interface Props {
  cluster: ClusterResponse
  onOpen: (item: FeedItemResponse) => void
  onSaveToggle: (id: number, saved: boolean) => void
}

export function ClusterColumn({ cluster, onOpen, onSaveToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

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

  const categoryColors = cluster.category ? CATEGORY_COLORS[cluster.category as CategoryValue] : null
  const categoryLabel = cluster.category ? (CATEGORY_LABELS[cluster.category as CategoryValue] ?? cluster.category) : null

  return (
    <Box
      ref={ref}
      sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${BRAND.border}`, height: '100%', overflow: 'hidden' }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3, mb: 0.5 }}>
          {cluster.label}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            {cluster.articleCount} articles · {shortDate(cluster.windowStart)}
          </Typography>
          {categoryColors && categoryLabel && (
            <Chip label={categoryLabel} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: categoryColors.bg, color: categoryColors.text }} />
          )}
          {cluster.languages.map((lang) => (
            <Chip key={lang} label={lang.toUpperCase()} size="small" sx={{ fontSize: 10, height: 18 }} />
          ))}
        </Box>
        {cluster.summary && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.75, pl: 1, color: '#7a5848', lineHeight: 1.4, borderLeft: `2px solid ${BRAND.accent}55`, fontSize: 12 }}
          >
            {cluster.summary}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 0.5 }}>
        {isLoading && (
          <Box display="flex" justifyContent="center" pt={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {allItems.map((item, i) => (
          <CompactArticleRow key={item.id} item={item} onOpen={onOpen} onSaveToggle={onSaveToggle} lead={i === 0} />
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
    </Box>
  )
}
