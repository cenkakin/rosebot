import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login as loginApi } from '../../api/auth'
import { useAuth } from './useAuth'
import rosebotLogo from '../../assets/rosebot-logo.svg'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginApi({ email, password })
      login(res.token)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1c0a0a',
      }}
    >
      <Card sx={{ width: 360, p: 1, bgcolor: '#0f0505', border: '1px solid #3a1010', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              component="img"
              src={rosebotLogo}
              alt="Rosebot"
              sx={{ width: 140, height: 'auto', mb: 1.5 }}
            />
            <Typography
              variant="h6"
              fontWeight={700}
              letterSpacing={4}
              sx={{ color: '#d4607a', fontFamily: 'Georgia, serif', fontSize: 18 }}
            >
              rosebot
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e8c0c0',
                  '& fieldset': { borderColor: '#3a1010' },
                  '&:hover fieldset': { borderColor: '#7a1c2a' },
                  '&.Mui-focused fieldset': { borderColor: '#c42040' },
                },
                '& .MuiInputLabel-root': { color: '#7a4040' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#d4607a' },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e8c0c0',
                  '& fieldset': { borderColor: '#3a1010' },
                  '&:hover fieldset': { borderColor: '#7a1c2a' },
                  '&.Mui-focused fieldset': { borderColor: '#c42040' },
                },
                '& .MuiInputLabel-root': { color: '#7a4040' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#d4607a' },
              }}
            />
            {error && <Alert severity="error" sx={{ bgcolor: '#2a0a0a', color: '#e87070' }}>{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{ bgcolor: '#7a1c2a', '&:hover': { bgcolor: '#a02038' }, fontWeight: 700, letterSpacing: 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
