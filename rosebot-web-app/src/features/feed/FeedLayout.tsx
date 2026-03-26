import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import type { FeedItemResponse } from '../../types/feedItem'
import { SummaryPanel } from '../summary/SummaryPanel'

interface Props {
  activePanelId: number | null
  activePanelItem: FeedItemResponse | null
  onPanelClose: () => void
  children: ReactNode
}

export function FeedLayout({ activePanelId, activePanelItem, onPanelClose, children }: Props) {
  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: '20px 24px',
          mr: activePanelId ? '360px' : 0,
          transition: 'margin-right .3s ease',
        }}
      >
        {children}
      </Box>
      <SummaryPanel itemId={activePanelId} item={activePanelItem} onClose={onPanelClose} />
    </Box>
  )
}
