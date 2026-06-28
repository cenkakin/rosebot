import {useState} from 'react'
import {Box, Button, Chip, Collapse, Dialog, Drawer, Skeleton, Typography, useMediaQuery, useTheme} from '@mui/material'
import type {FeedItemResponse} from '../../types/feedItem'
import {useContent} from './useContent'
import {HtmlContent} from '../../components/HtmlContent'
import {BRAND, SOURCE_COLORS} from '../../theme'
import {shortDate} from '../../utils/time'
import {CATEGORY_COLORS, CATEGORY_LABELS, type CategoryValue} from '../../constants/categories'

interface Props {
  item: FeedItemResponse | null
  onClose: () => void
}

function PanelBody({ item, onClose }: { item: FeedItemResponse; onClose: () => void }) {
  const { data: content, isLoading} = useContent(item.id)
  const [showFull, setShowFull] = useState(false)
  const colors = SOURCE_COLORS[item.sourceType]
  const categoryColors = item.category ? CATEGORY_COLORS[item.category as CategoryValue] : null
  const categoryLabel = item.category ? (CATEGORY_LABELS[item.category as CategoryValue] ?? item.category) : null

  return (
    <>
      <Box sx={{ p: '16px 20px 12px', borderBottom: `1px solid ${BRAND.cardBorder}`, flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box component="span" sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: 0.5, bgcolor: colors.badgeBg, color: colors.badgeText, textTransform: 'uppercase' }}>
            {colors.label}
          </Box>
          {categoryColors && categoryLabel && (
            <Chip label={categoryLabel} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: categoryColors.bg, color: categoryColors.text }} />
          )}
          {item.language && <Chip label={item.language.toUpperCase()} size="small" sx={{ fontSize: 10, height: 18 }} />}
          <Typography variant="caption" sx={{ color: BRAND.mutedText, ml: 'auto', whiteSpace: 'nowrap' }}>
            {item.sourceName} · {shortDate(item.publishedAt)}
          </Typography>
          <Button onClick={onClose} sx={{ minWidth: 0, color: '#9e9e9e', fontSize: 18, lineHeight: 1, p: '2px 6px' }}>
            ✕
          </Button>
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25, fontSize: 19 }}>
          {item.title}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {(item.aiSummary || item.bullets.length > 0) && (
          <Box sx={{ background: 'linear-gradient(180deg,#fff6f9,#fff)', border: `1px solid ${BRAND.accent}33`, borderRadius: 3, p: 1.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: BRAND.accent, display: 'block', mb: 0.75 }}>
              ✦ AI Summary
            </Typography>
            {item.aiSummary && (
              <Typography variant="body2" sx={{ color: BRAND.textPrimary, lineHeight: 1.55 }}>
                {item.aiSummary}
              </Typography>
            )}
            {item.bullets.length > 0 && (
              <Box component="ul" sx={{ m: '10px 0 0', pl: 0, listStyle: 'none' }}>
                {item.bullets.map((b, i) => (
                  <Box component="li" key={`${item.id}-${i}`} sx={{ position: 'relative', pl: 2, py: 0.4, fontSize: 12.5, color: '#4a3428', lineHeight: 1.45, '&:before': { content: '"›"', position: 'absolute', left: 2, color: BRAND.accent, fontWeight: 800 } }}>
                    {b}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {(content) && (
          <Box>
            <Typography
              variant="caption"
              onClick={() => setShowFull((v) => !v)}
              sx={{ color: BRAND.accent, fontWeight: 600, cursor: 'pointer', display: 'inline-block', mb: 0.5 }}
            >
              {showFull ? '▾ Full article text' : '▸ Full article text'}
            </Typography>
            <Collapse in={showFull}>
              {isLoading && (
                <Box display="flex" flexDirection="column" gap={1}>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="95%" />
                </Box>
              )}
              {content && <HtmlContent html={content.content} />}
            </Collapse>
          </Box>
        )}
      </Box>

      <Box sx={{ p: '12px 20px', borderTop: `1px solid ${BRAND.cardBorder}`, flexShrink: 0 }}>
        <Button component="a" href={item.url} target="_blank" rel="noopener noreferrer" variant="contained" fullWidth sx={{ textTransform: 'none', fontWeight: 600 }}>
          ↗ Open full article
        </Button>
      </Box>
    </>
  )
}

export function ContentPanel({ item, onClose }: Props) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={!!item}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { maxHeight: '75vh', display: 'flex', flexDirection: 'column', borderRadius: '12px 12px 0 0' } }}
      >
        {item && <PanelBody item={item} onClose={onClose} />}
      </Drawer>
    )
  }

  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, maxHeight: '82vh', display: 'flex', flexDirection: 'column' } }}
    >
      {item && <PanelBody item={item} onClose={onClose} />}
    </Dialog>
  )
}
