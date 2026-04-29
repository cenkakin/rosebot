import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { Box, Chip, Divider, Drawer, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router'
import { getSources } from '../../api/sources'
import { getSavedSources } from '../../api/saved'
import type { SourceResponse } from '../../types/source'
import { BRAND, SOURCE_COLORS } from '../../theme'
import { useFilterParams } from '../../hooks/useFilterParams'
import { useLanguages } from '../../hooks/useLanguages'
import { CATEGORY_VALUES, CATEGORY_LABELS, CATEGORY_COLORS, type CategoryValue } from '../../constants/categories'

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

function SourceIcon({ type, url }: { type: SourceResponse['type']; url: string }) {
  const [failed, setFailed] = React.useState(false)

  if (!failed) {
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
      // invalid URL — fall through to dot
    }
  }

  return <SourceDot type={type} />
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { type: activeType, sourceId: activeSourceId, language: activeLanguage, category: activeCategory, setMultiple, setLanguage, setCategory } = useFilterParams()
  const languages = useLanguages()

  const isFeedActive = location.pathname === '/' && !activeType && !activeSourceId
  const isSavedActive = location.pathname === '/saved'
  const isClustersActive = location.pathname === '/clusters'

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
          onClick={() => { setMultiple({ type, sourceId: null }); onNavigate?.() }}
          sx={{ px: 2.5, py: 0.75, gap: 1.25, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <SourceDot type={type} />
          <ListItemText primary={`All ${colors.label}`} primaryTypographyProps={{ fontSize: 13.5 }} />
        </ListItemButton>
        {items.map((source) => (
          <ListItemButton
            key={source.id}
            selected={activeSourceId === String(source.id)}
            onClick={() => { setMultiple({ sourceId: String(source.id), type: null }); onNavigate?.() }}
            sx={{ px: 2.5, py: 0.75, gap: 1.25, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
          >
            <SourceIcon type={source.type} url={source.homepage} />
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
          sx={{ px: 2.5, py: 1, gap: 1.25, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <StarIcon fontSize="small" sx={{ color: isSavedActive ? BRAND.accent : BRAND.mutedText }} />
          <ListItemText primary="Saved" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
          <Chip label="★" size="small" sx={{ bgcolor: BRAND.mutedText, color: '#fff', height: 20, fontSize: 11, fontWeight: 700 }} />
        </ListItemButton>
        <ListItemButton
          selected={isClustersActive}
          onClick={() => handleNavigate('/clusters')}
          sx={{ px: 2.5, py: 1, gap: 1.25, mb: 1, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.sidebarText, '&.Mui-selected': activeItemSx, '&:hover': { bgcolor: 'rgba(198,40,40,0.05)' } }}
        >
          <ViewColumnIcon fontSize="small" sx={{ color: isClustersActive ? BRAND.accent : BRAND.mutedText }} />
          <ListItemText primary="Clusters" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </ListItemButton>

        {!isClustersActive && (['NEWS', 'REDDIT', 'TWITTER'] as const).map(renderSection)}

        {languages.length > 0 && !isClustersActive && (
          <Box>
            <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', color: BRAND.mutedText, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              Language
            </Typography>
            <Box sx={{ px: 2.5, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {languages.map((lang) => (
                <Chip
                  key={lang}
                  label={lang.toUpperCase()}
                  size="small"
                  onClick={() => setLanguage(activeLanguage === lang ? null : lang)}
                  variant={activeLanguage === lang ? 'filled' : 'outlined'}
                  sx={{
                    fontSize: 11,
                    height: 22,
                    fontWeight: 600,
                    cursor: 'pointer',
                    ...(activeLanguage === lang && { bgcolor: BRAND.accent, color: '#fff', '&:hover': { bgcolor: BRAND.accent } }),
                  }}
                />
              ))}
            </Box>
            <Divider sx={{ my: 1, borderColor: BRAND.border }} />
          </Box>
        )}

        {!isClustersActive && (
          <Box>
            <Typography variant="caption" sx={{ px: 2.5, py: 0.5, display: 'block', color: BRAND.mutedText, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              Category
            </Typography>
            <Box sx={{ px: 2.5, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {CATEGORY_VALUES.map((cat) => {
                const colors = CATEGORY_COLORS[cat as CategoryValue]
                const active = activeCategory === cat
                return (
                  <Chip
                    key={cat}
                    label={CATEGORY_LABELS[cat as CategoryValue]}
                    size="small"
                    onClick={() => setCategory(active ? null : cat)}
                    sx={{
                      fontSize: 11,
                      height: 22,
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: active ? colors.text : colors.bg,
                      color: active ? '#fff' : colors.text,
                      border: `1px solid ${colors.text}20`,
                      '&:hover': { bgcolor: colors.text, color: '#fff' },
                    }}
                  />
                )
              })}
            </Box>
          </Box>
        )}
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
