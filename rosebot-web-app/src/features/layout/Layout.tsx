import { useState } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { Outlet } from 'react-router'
import { AppBar } from './AppBar'
import { Sidebar } from './Sidebar'

export function Layout() {
  const muiTheme = useTheme()
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('md'))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-in', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <AppBar onMenuClick={() => setSidebarOpen((o) => !o)} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          isDesktop={isDesktop}
        />
        <Outlet />
      </Box>
    </Box>
  )
}
