import { Box } from '@mui/material'
import { Outlet } from 'react-router'
import { AppBar } from './AppBar'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Outlet />
      </Box>
    </Box>
  )
}
