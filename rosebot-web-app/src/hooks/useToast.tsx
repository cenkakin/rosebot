import { useState } from 'react'
import { Alert, Snackbar } from '@mui/material'

export function useToast() {
  const [state, setState] = useState({ open: false, message: '' })

  const showToast = (message: string) => setState({ open: true, message })
  const handleClose = () => setState((s) => ({ ...s, open: false }))

  const ToastSnackbar = (
    <Snackbar
      open={state.open}
      autoHideDuration={2000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" onClose={handleClose} sx={{ minWidth: 180 }}>
        {state.message}
      </Alert>
    </Snackbar>
  )

  return { showToast, ToastSnackbar }
}
