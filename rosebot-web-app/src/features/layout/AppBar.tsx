import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar as MuiAppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import rosebotLogo from '../../assets/rosebot-logo.svg'

function formatDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export function AppBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <MuiAppBar position="static" elevation={0} sx={{ bgcolor: '#1c0a0a', borderBottom: '1px solid #3a1010', zIndex: 10 }}>
      <Toolbar sx={{ minHeight: 56, px: 2.5 }}>
        <Box
          component="button"
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            mr: 2,
            '&:hover img': { opacity: 0.85 },
          }}
        >
          <Box
            component="img"
            src={rosebotLogo}
            alt="Rosebot"
            sx={{ height: 44, width: 'auto', display: 'block', transition: 'opacity .15s' }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            letterSpacing={2}
            sx={{ color: '#d4607a', fontSize: 15, fontFamily: 'Georgia, serif' }}
          >
            rosebot
          </Typography>
        </Box>

        <Box flex={1} />

        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" sx={{ color: '#9e6060', letterSpacing: 0.3 }}>
            {formatDate()}
          </Typography>
          <IconButton size="small" onClick={handleLogout} sx={{ color: '#7a4040', '&:hover': { color: '#d4607a' } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
