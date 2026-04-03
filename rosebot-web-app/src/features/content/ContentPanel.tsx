import { Box, Button, Drawer, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { useContent } from './useContent'
import { HtmlContent } from '../../components/HtmlContent'
import { SOURCE_COLORS } from '../../theme'

interface Props {
  itemId: number | null
  item: FeedItemResponse | null
  onClose: () => void
}

function PanelContent({ item, itemId, onClose }: { item: FeedItemResponse | null; itemId: number | null; onClose: () => void }) {
  const { data: content, isLoading, isError } = useContent(itemId)

  return (
    <>
      {/* Header */}
      <Box sx={{ p: '16px 18px 14px', borderBottom: '1px solid #f0e8e4', flexShrink: 0 }}>
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
          Full Content
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
            Content unavailable.
          </Typography>
        )}
        {content && <HtmlContent html={content.content} />}
      </Box>

      {/* Footer */}
      {item && (
        <Box sx={{ p: '14px 18px', borderTop: '1px solid #f0e8e4', flexShrink: 0 }}>
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
    </>
  )
}

export function ContentPanel({ itemId, item, onClose }: Props) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={!!itemId}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { maxHeight: '60vh', display: 'flex', flexDirection: 'column', borderRadius: '12px 12px 0 0' } }}
      >
        <PanelContent itemId={itemId} item={item} onClose={onClose} />
      </Drawer>
    )
  }

  return (
    <Box
      sx={{
        width: 360,
        flexShrink: 0,
        bgcolor: '#fff',
        borderLeft: '1px solid #eeddd5',
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
      <PanelContent itemId={itemId} item={item} onClose={onClose} />
    </Box>
  )
}
