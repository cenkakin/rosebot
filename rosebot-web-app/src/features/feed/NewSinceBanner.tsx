import { Box, Typography } from '@mui/material'

interface Props {
  count: number
  lastVisitedAt: string
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

export function NewSinceBanner({ count, lastVisitedAt }: Props) {
  if (count === 0) return null
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #c62828, #e53935)',
        color: '#fff',
        borderRadius: 2.5,
        px: 2.25,
        py: 1.5,
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        boxShadow: '0 2px 8px rgba(198,40,40,.25)',
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          bgcolor: '#fff',
          borderRadius: '50%',
          flexShrink: 0,
          boxShadow: '0 0 0 3px rgba(255,255,255,.3)',
        }}
      />
      <Typography variant="body2">
        <strong>{count} new item{count !== 1 ? 's' : ''}</strong> since your last visit · {timeAgo(lastVisitedAt)}
      </Typography>
    </Box>
  )
}
