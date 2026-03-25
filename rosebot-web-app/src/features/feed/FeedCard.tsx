import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { SOURCE_COLORS } from '../../theme'

interface Props {
  item: FeedItemResponse
  isActive: boolean
  onSummaryClick: (id: number) => void
  onSaveToggle: (id: number, saved: boolean) => void
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EngagementMeta({ item }: { item: FeedItemResponse }) {
  const eng = item.engagement
  if (!eng) return null

  if (item.sourceType === 'REDDIT') {
    const comments = (eng.comments as number) ?? 0
    const upvotes = (eng.upvotes as number) ?? 0
    return (
      <Typography variant="caption" color="text.secondary">
        {upvotes.toLocaleString()} upvotes · {comments.toLocaleString()} comments
      </Typography>
    )
  }

  if (item.sourceType === 'TWITTER') {
    const likes = (eng.likes as number) ?? 0
    const retweets = (eng.retweets as number) ?? 0
    return (
      <Typography variant="caption" color="text.secondary">
        {likes.toLocaleString()} likes · {retweets.toLocaleString()} retweets
      </Typography>
    )
  }

  return null
}

export function FeedCard({ item, isActive, onSummaryClick, onSaveToggle }: Props) {
  const colors = SOURCE_COLORS[item.sourceType]
  const hasSummary = item.sourceType !== 'TWITTER'

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        borderColor: isActive ? 'primary.main' : '#e8e8e8',
        boxShadow: isActive ? '0 3px 12px rgba(198,40,40,.15)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
        '&:hover': { boxShadow: '0 3px 12px rgba(0,0,0,.08)', borderColor: '#d0d0d0' },
      }}
    >
      <CardContent sx={{ p: '16px 18px', '&:last-child': { pb: '16px' } }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              bgcolor: colors.badgeBg,
              color: colors.badgeText,
              textTransform: 'uppercase',
            }}
          >
            {colors.label}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {item.sourceName}
          </Typography>
          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#bdbdbd', display: 'block' }}>
              {relativeTime(item.publishedAt)}
            </Typography>
            {item.savedAt && (
              <Typography variant="caption" sx={{ color: '#c62828', opacity: 0.7, display: 'block' }}>
                Saved {relativeTime(item.savedAt)}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => onSaveToggle(item.id, item.saved)}
            sx={{ color: item.saved ? 'primary.main' : '#bdbdbd', p: 0.25 }}
          >
            {item.saved ? '★' : '☆'}
          </IconButton>
        </Box>

        {/* Body */}
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Box flex={1} minWidth={0}>
            <Typography
              component="a"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              fontWeight={600}
              sx={{
                display: 'block',
                color: '#212121',
                textDecoration: 'none',
                lineHeight: 1.35,
                mb: 0.75,
                '&:hover': { color: 'primary.main' },
              }}
            >
              {item.title}
            </Typography>
            {item.content && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {item.content}
              </Typography>
            )}
          </Box>
          {item.thumbnailUrl && (
            <Box
              component="img"
              src={item.thumbnailUrl}
              alt=""
              sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Footer */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
          <EngagementMeta item={item} />
          {hasSummary && (
            <Chip
              label={isActive ? '📋 Summary ✕' : '📋 Summary ▸'}
              size="small"
              onClick={() => onSummaryClick(item.id)}
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                ml: 'auto',
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
