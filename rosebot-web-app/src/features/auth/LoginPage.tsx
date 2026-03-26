import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login as loginApi } from '../../api/auth'
import { useAuth } from './useAuth'
import { BRAND } from '../../theme'

function RosebotMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <g transform="translate(20,20)">
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(0)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(72)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(144)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(216)" />
        <path d="M0,-15 C6,-9 6,-3 0,0 C-6,-3 -6,-9 0,-15" fill={BRAND.accent} transform="rotate(288)" />
        <circle r="4" fill={BRAND.accent} />
      </g>
    </svg>
  )
}

function SledWatermark() {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: -16,
        right: -16,
        opacity: 0.045,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg width="280" height="116" viewBox="0 0 96 40" fill="none">
        <rect x="16" y="2" width="64" height="7" rx="2" fill={BRAND.accent} />
        <rect x="16" y="11" width="64" height="5" rx="2" fill={BRAND.accent} opacity=".75" />
        <line x1="37" y1="2" x2="37" y2="18" stroke={BRAND.accentHover} strokeWidth="1" opacity=".4" />
        <line x1="58" y1="2" x2="58" y2="18" stroke={BRAND.accentHover} strokeWidth="1" opacity=".4" />
        <line x1="24" y1="16" x2="21" y2="27" stroke={BRAND.accent} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="72" y1="16" x2="75" y2="27" stroke={BRAND.accent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7,36 Q5,27 21,27" stroke={BRAND.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M7,36 Q48,40 89,36" stroke={BRAND.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M75,27 Q89,27 89,36" stroke={BRAND.accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Box>
  )
}

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
        bgcolor: BRAND.bgPage,
      }}
    >
      <Card
        sx={{
          width: 380,
          p: 1,
          bgcolor: '#fff',
          border: `1px solid ${BRAND.cardBorder}`,
          borderRadius: 3,
          boxShadow: '0 4px 24px rgba(44,24,16,.08), 0 1px 4px rgba(44,24,16,.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SledWatermark />

        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3.5}>
            <RosebotMark size={64} />
            <Typography
              variant="h6"
              sx={{
                mt: 1,
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                letterSpacing: 4,
                fontSize: 20,
                color: BRAND.textPrimary,
              }}
            >
              rosebot
            </Typography>
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                color: BRAND.mutedText,
                letterSpacing: 0.5,
              }}
            >
              find what matters
            </Typography>
          </Box>

          {/* Form */}
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
                  color: BRAND.inputText,
                  bgcolor: BRAND.inputBg,
                  '& fieldset': { borderColor: BRAND.border },
                  '&:hover fieldset': { borderColor: BRAND.mutedText },
                  '&.Mui-focused fieldset': { borderColor: BRAND.inputFocusBorder },
                },
                '& .MuiInputLabel-root': { color: BRAND.mutedText },
                '& .MuiInputLabel-root.Mui-focused': { color: BRAND.accent },
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
                  color: BRAND.inputText,
                  bgcolor: BRAND.inputBg,
                  '& fieldset': { borderColor: BRAND.border },
                  '&:hover fieldset': { borderColor: BRAND.mutedText },
                  '&.Mui-focused fieldset': { borderColor: BRAND.inputFocusBorder },
                },
                '& .MuiInputLabel-root': { color: BRAND.mutedText },
                '& .MuiInputLabel-root.Mui-focused': { color: BRAND.accent },
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{
                bgcolor: BRAND.buttonBg,
                '&:hover': { bgcolor: BRAND.accentHover },
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
