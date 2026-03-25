import { Box, Chip } from '@mui/material'
import { useSearchParams } from 'react-router'

const CHIPS = [
  { label: 'All', type: null },
  { label: '📰 News', type: 'NEWS' },
  { label: '🔴 Reddit', type: 'REDDIT' },
  { label: '🐦 Twitter', type: 'TWITTER' },
] as const

export function FilterChips() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeType = searchParams.get('type')

  const handleClick = (type: string | null) => {
    if (type === null) {
      setSearchParams({})
    } else {
      setSearchParams({ type })
    }
  }

  return (
    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
      {CHIPS.map(({ label, type }) => {
        const isActive = type === null ? !activeType && !searchParams.get('sourceId') : activeType === type
        return (
          <Chip
            key={label}
            label={label}
            onClick={() => handleClick(type)}
            variant={isActive ? 'filled' : 'outlined'}
            color={isActive ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: isActive ? 700 : 400, cursor: 'pointer' }}
          />
        )
      })}
    </Box>
  )
}
