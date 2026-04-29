import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material'
import React from 'react'
import type { FeedItemResponse } from '../../types/feedItem'
import { SOURCE_COLORS } from '../../theme'
import { relativeTime } from '../../utils/time'
import { stripHtml } from '../../utils/sanitize'
import { CATEGORY_LABELS, CATEGORY_COLORS, type CategoryValue } from '../../constants/categories'

function SourceFavicon({ url }: { url: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  try {
    const hostname = new URL(url).hostname
    return (
      <Box
        component="img"
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
        alt=""
        onError={() => setFailed(true)}
        sx={{ width: 16, height: 16, flexShrink: 0, borderRadius: '2px' }}
      />
    )
  } catch {
    return null
  }
}

interface Props {
  item: FeedItemResponse
  isActive: boolean
  hasContent: boolean
  onContentClick: (id: number) => void
  onSaveToggle: (id: number, saved: boolean) => void
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

export function FeedCard({ item, isActive, hasContent, onContentClick, onSaveToggle }: Props) {
  const colors = SOURCE_COLORS[item.sourceType]

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        borderColor: isActive ? 'primary.main' : '#eeddd5',
        boxShadow: isActive ? '0 3px 12px rgba(198,40,40,.12)' : 'none',
        transition: 'box-shadow .2s, border-color .2s',
        '&:hover': { boxShadow: '0 3px 12px rgba(44,24,16,.08)', borderColor: '#e0c8c0' },
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
          {item.category && CATEGORY_COLORS[item.category as CategoryValue] && (
            <Chip
              label={CATEGORY_LABELS[item.category as CategoryValue] ?? item.category}
              size="small"
              sx={{
                fontSize: 10,
                height: 18,
                fontWeight: 600,
                bgcolor: CATEGORY_COLORS[item.category as CategoryValue].bg,
                color: CATEGORY_COLORS[item.category as CategoryValue].text,
              }}
            />
          )}
          <SourceFavicon url={item.sourceUrl} />
          <Typography
            component="a"
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {item.sourceName}
          </Typography>
          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#c0a898', display: 'block' }}>
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
            sx={{ color: item.saved ? 'primary.main' : '#c0a898', p: 0.25 }}
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
                color: '#1a1008',
                textDecoration: 'none',
                lineHeight: 1.35,
                mb: 0.75,
                '&:hover': { color: 'primary.main' },
              }}
            >
              {item.title}
            </Typography>
            {item.summary && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {stripHtml(item.summary)}
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
          {hasContent && (
            <Chip
              label={isActive ? '📄 Content ✕' : '📄 Content ▸'}
              size="small"
              onClick={() => onContentClick(item.id)}
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
