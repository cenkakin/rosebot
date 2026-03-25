import { Box, Typography } from '@mui/material'

export function TimeDivider({ label }: { label: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} my={2.5}>
      <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#9e9e9e', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: '#e0e0e0' }} />
    </Box>
  )
}
