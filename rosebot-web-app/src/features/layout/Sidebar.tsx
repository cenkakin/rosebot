import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import { Box, Chip, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router'
import { getSources } from '../../api/sources'
import { getSavedSources } from '../../api/saved'
import type { SourceResponse } from '../../types/source'
import { SOURCE_COLORS } from '../../theme'

function SourceDot({ type }: { type: SourceResponse['type'] }) {
  return (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: SOURCE_COLORS[type].dot,
        display: 'inline-block',
      }}
    />
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeType = searchParams.get('type')
  const activeSourceId = searchParams.get('sourceId')
  const isFeedActive = location.pathname === '/' && !activeType && !activeSourceId
  const isSavedActive = location.pathname === '/saved'

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: Infinity,
  })

  const { data: savedSources = [] } = useQuery({
    queryKey: ['saved-sources'],
    queryFn: getSavedSources,
    enabled: isSavedActive,
    staleTime: 30_000,
  })

  const visibleSources = isSavedActive ? savedSources : sources

  const setFilter = (params: { type?: string; sourceId?: string }) => {
    setSearchParams(params as Record<string, string>)
  }

  const byType = (type: SourceResponse['type']) =>
    visibleSources.filter((s) => s.type === type && s.enabled)

  const renderSection = (type: SourceResponse['type']) => {
    const items = byType(type)
    if (items.length === 0) return null
    const colors = SOURCE_COLORS[type]
    const allActive = activeType === type && !activeSourceId

    return (
      <Box key={type}>
        <Typography
          variant="caption"
          sx={{ px: 2.5, py: 0.5, display: 'block', color: '#9e9e9e', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          {colors.label}
        </Typography>
        <ListItemButton
          selected={allActive}
          onClick={() => setFilter({ type })}
          sx={{ px: 2.5, py: 0.75, gap: 1.25 }}
        >
          <SourceDot type={type} />
          <ListItemText primary={`All ${colors.label}`} primaryTypographyProps={{ fontSize: 13.5 }} />
        </ListItemButton>
        {items.map((source) => (
          <ListItemButton
            key={source.id}
            selected={activeSourceId === String(source.id)}
            onClick={() => setFilter({ sourceId: String(source.id) })}
            sx={{ px: 2.5, py: 0.75, gap: 1.25 }}
          >
            <SourceDot type={source.type} />
            <ListItemText primary={source.name} primaryTypographyProps={{ fontSize: 13.5 }} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
      </Box>
    )
  }

  return (
    <Box
      component="nav"
      sx={{
        width: 220,
        flexShrink: 0,
        bgcolor: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        py: 2,
      }}
    >
      <List disablePadding>
        <ListItemButton
          selected={isFeedActive}
          onClick={() => navigate('/')}
          sx={{ px: 2.5, py: 1, gap: 1.25, borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
        >
          <HomeIcon fontSize="small" sx={{ color: isFeedActive ? 'primary.main' : '#9e9e9e' }} />
          <ListItemText primary="Feed" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </ListItemButton>
        <ListItemButton
          selected={isSavedActive}
          onClick={() => navigate('/saved')}
          sx={{ px: 2.5, py: 1, gap: 1.25, mb: 1, borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
        >
          <StarIcon fontSize="small" sx={{ color: isSavedActive ? 'primary.main' : '#9e9e9e' }} />
          <ListItemText primary="Saved" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
          <Chip label="★" size="small" sx={{ bgcolor: '#757575', color: '#fff', height: 20, fontSize: 11, fontWeight: 700 }} />
        </ListItemButton>

        {(['NEWS', 'REDDIT', 'TWITTER'] as const).map(renderSection)}
      </List>
    </Box>
  )
}
