import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import { Box, Chip, Divider, Drawer, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router'
import { getSources } from '../../api/sources'
import { getSavedSources } from '../../api/saved'
import type { SourceResponse } from '../../types/source'
import { BRAND, SOURCE_COLORS } from '../../theme'

const SIDEBAR_WIDTH = 220

interface Props {
  mobileOpen: boolean
  onMobileClose: () => void
  isDesktop: boolean
}

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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeType = searchParams.get('type')
  const activeSourceId = searchParams.get('sourceId')
  const isFeedActive = location.pathname === '/' && !activeType && !activeSourceId
  const isSavedActive = location.pathname === '/saved'

  const { data: sources = [], isError: sourcesError } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: 5 * 60 * 1000,
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
    onNavigate?.()
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  const byType = (type: SourceResponse['type']) =>
    visibleSources.filter((s) => s.type === type && s.enabled)

  const activeItemSx = {
    bgcolor: '#fde8e0 !important',
    color: BRAND.accent,
  }

  const renderSection = (type: SourceResponse['type']) => {
    const items = byType(type)
    if (items.length === 0) return null
    const colors = SOURCE_COLORS[type]
    const allActive = activeType === type && !activeSourceId

    return (
      <Box key={type}>
        <Typography
          variant="caption"
          sx={{ px: 2.5, py: 0.5, display: 'block', color: BRAND.mutedText, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          {colors.label}
        </Typography>
        <ListItemButton
          selected={allActive}
          onClick={() => setFilter({ type })}
          sx={{ px: 2.5, py: 0.75, gap: 1.25, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <SourceDot type={type} />
          <ListItemText primary={`All ${colors.label}`} primaryTypographyProps={{ fontSize: 13.5 }} />
        </ListItemButton>
        {items.map((source) => (
          <ListItemButton
            key={source.id}
            selected={activeSourceId === String(source.id)}
            onClick={() => setFilter({ sourceId: String(source.id) })}
            sx={{ px: 2.5, py: 0.75, gap: 1.25, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
          >
            <SourceDot type={source.type} />
            <ListItemText primary={source.name} primaryTypographyProps={{ fontSize: 13.5 }} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1, borderColor: BRAND.border }} />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: BRAND.bgDeep, height: '100%', overflowY: 'auto', py: 2 }}>
      {sourcesError && !isSavedActive && (
        <Typography variant="caption" sx={{ px: 2.5, py: 1, display: 'block', color: 'error.main' }}>
          Failed to load sources
        </Typography>
      )}
      <List disablePadding>
        <ListItemButton
          selected={isFeedActive}
          onClick={() => handleNavigate('/')}
          sx={{ px: 2.5, py: 1, gap: 1.25, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <HomeIcon fontSize="small" sx={{ color: isFeedActive ? BRAND.accent : BRAND.mutedText }} />
          <ListItemText primary="Feed" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </ListItemButton>
        <ListItemButton
          selected={isSavedActive}
          onClick={() => handleNavigate('/saved')}
          sx={{ px: 2.5, py: 1, gap: 1.25, mb: 1, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <StarIcon fontSize="small" sx={{ color: isSavedActive ? BRAND.accent : BRAND.mutedText }} />
          <ListItemText primary="Saved" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
          <Chip label="★" size="small" sx={{ bgcolor: BRAND.mutedText, color: '#fff', height: 20, fontSize: 11, fontWeight: 700 }} />
        </ListItemButton>

        {(['NEWS', 'REDDIT', 'TWITTER'] as const).map(renderSection)}
      </List>
    </Box>
  )
}

export function Sidebar({ mobileOpen, onMobileClose, isDesktop }: Props) {
  if (isDesktop) {
    return (
      <Box component="nav" sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, borderRight: `1px solid ${BRAND.border}` }}>
        <SidebarContent />
      </Box>
    )
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', bgcolor: BRAND.bgDeep, borderRight: `1px solid ${BRAND.border}` } }}
    >
      <SidebarContent onNavigate={onMobileClose} />
    </Drawer>
  )
}
