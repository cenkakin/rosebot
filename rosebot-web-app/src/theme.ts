import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    primary: { main: '#c62828' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
})

export const SOURCE_COLORS = {
  NEWS: {
    dot: '#1565c0',
    badgeBg: '#e3f0ff',
    badgeText: '#1565c0',
    label: 'News',
  },
  REDDIT: {
    dot: '#e64a19',
    badgeBg: '#fbe9e7',
    badgeText: '#bf360c',
    label: 'Reddit',
  },
  TWITTER: {
    dot: '#0288d1',
    badgeBg: '#e1f5fe',
    badgeText: '#0277bd',
    label: 'Twitter',
  },
} as const
