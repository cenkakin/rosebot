import { Alert } from '@mui/material'

interface Props {
  message?: string
}

export function ErrorMessage({ message = 'Something went wrong. Please try refreshing.' }: Props) {
  return (
    <Alert severity="error" sx={{ mx: 'auto', mt: 4, maxWidth: 480 }}>
      {message}
    </Alert>
  )
}
