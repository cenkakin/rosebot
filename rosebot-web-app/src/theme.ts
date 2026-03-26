import { createTheme } from '@mui/material'

export const BRAND = {
  // Chrome surfaces
  bgDark: '#fdf8f4',          // AppBar background
  bgDeep: '#f5ede6',          // Sidebar background
  bgPage: '#faf5f0',          // Main content background
  bgSidebarActive: '#fde8e0', // Sidebar active item

  // Borders
  border: '#e8ddd5',
  borderHover: '#c62828',
  cardBorder: '#eeddd5',

  // Accent
  accent: '#c62828',
  accentHover: '#a02020',
  buttonBg: '#c62828',

  // Text
  textPrimary: '#2c1810',
  sidebarText: '#5a3728',
  mutedText: '#b08070',
  mutedText2: '#9a7060',

  // Form
  inputText: '#2c1810',
  inputBg: '#fdf8f4',
  inputFocusBorder: '#c62828',
} as const

export const theme = createTheme({
  palette: {
    primary: { main: '#c62828' },
    background: { default: '#faf5f0' },
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
