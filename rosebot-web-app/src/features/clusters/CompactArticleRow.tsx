import { Box, IconButton, Typography } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { shortDate } from '../../utils/time'
import { BRAND } from '../../theme'
import { SourceFavicon } from '../../components/SourceFavicon'

interface Props {
  item: FeedItemResponse
  onOpen: (item: FeedItemResponse) => void
  onSaveToggle: (id: number, saved: boolean) => void
  lead?: boolean
}

export function CompactArticleRow({ item, onOpen, onSaveToggle, lead = false }: Props) {
  return (
    <Box
      onClick={() => onOpen(item)}
      sx={{
        py: 1,
        px: 0.5,
        borderTop: `1px solid ${BRAND.cardBorder}`,
        cursor: 'pointer',
        '&:hover': { bgcolor: '#fffaf7' },
      }}
    >
      <Typography
        variant="body2"
        fontWeight={lead ? 700 : 600}
        sx={{
          color: BRAND.textPrimary,
          lineHeight: 1.3,
          fontSize: lead ? 13.5 : 12.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          mb: 0.5,
        }}
      >
        {item.title}
      </Typography>
      <Box display="flex" alignItems="center" gap={0.75}>
        <SourceFavicon url={item.sourceUrl} size={14} />
        <Typography variant="caption" sx={{ color: BRAND.mutedText, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.sourceName}
        </Typography>
        <Typography variant="caption" sx={{ color: BRAND.mutedText, whiteSpace: 'nowrap', ml: 'auto' }}>
          {shortDate(item.publishedAt)}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onSaveToggle(item.id, item.saved)
          }}
          sx={{ color: item.saved ? 'primary.main' : '#c0a898', p: 0.25 }}
        >
          {item.saved ? '★' : '☆'}
        </IconButton>
      </Box>
    </Box>
  )
}
