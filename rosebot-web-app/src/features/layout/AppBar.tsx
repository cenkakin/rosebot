import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { AppBar as MuiAppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { BRAND } from '../../theme'

interface Props {
  onMenuClick: () => void
}

function formatDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

function RosebotMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden>
      <g transform="translate(20,20)">
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(0)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(72)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(144)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(216)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(288)" />
        <circle r="3.5" fill={BRAND.accent} />
      </g>
    </svg>
  )
}

export function AppBar({ onMenuClick }: Props) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <MuiAppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: BRAND.bgDark, borderBottom: `1px solid ${BRAND.border}`, zIndex: 10 }}
    >
      <Toolbar sx={{ minHeight: 56, px: 2.5 }}>
        <IconButton
          size="small"
          onClick={onMenuClick}
          sx={{ color: BRAND.mutedText, mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Box
          component="button"
          onClick={() => navigate('/')}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            background: 'none', border: 'none', cursor: 'pointer', p: 0, mr: 2,
            '&:hover svg': { opacity: 0.75 },
          }}
        >
          <RosebotMark />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            letterSpacing={3}
            sx={{
              color: BRAND.textPrimary,
              fontSize: 15,
              fontFamily: '"Playfair Display", Georgia, serif',
              lineHeight: 1,
            }}
          >
            rosebot
          </Typography>
        </Box>

        <Box flex={1} />

        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            variant="body2"
            sx={{ color: BRAND.mutedText2, letterSpacing: 0.3, display: { xs: 'none', sm: 'block' } }}
          >
            {formatDate()}
          </Typography>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{ color: BRAND.mutedText, '&:hover': { color: BRAND.accent } }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
