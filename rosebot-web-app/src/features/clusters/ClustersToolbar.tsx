import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { BRAND } from '../../theme'

export type ClusterView = 'digest' | 'columns'

interface Props {
  view: ClusterView
  onViewChange: (view: ClusterView) => void
}

export function ClustersToolbar({ view, onViewChange }: Props) {
  return (
    <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}`, display: 'flex', alignItems: 'center' }}>
      <ToggleButtonGroup
        value={view}
        exclusive
        size="small"
        onChange={(_e, next) => {
          if (next) onViewChange(next as ClusterView)
        }}
        sx={{
          ml: 'auto',
          '& .MuiToggleButton-root': {
            px: 1.5,
            py: 0.25,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'none',
            color: BRAND.mutedText,
            border: `1px solid ${BRAND.border}`,
          },
          '& .Mui-selected': {
            color: `${BRAND.accent} !important`,
            bgcolor: `${BRAND.bgSidebarActive} !important`,
          },
        }}
      >
        <ToggleButton value="columns">▦ Columns</ToggleButton>
        <ToggleButton value="digest">☰ Digest</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
