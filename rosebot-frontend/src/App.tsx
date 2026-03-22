import { AppBar, Box, Container, CssBaseline, Toolbar, Typography } from '@mui/material'
import { ArticleList } from './features/articles/ArticleList'

export default function App() {
  return (
    <>
      <CssBaseline />
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" fontWeight={700}>
            Rosebot
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <ArticleList />
        </Container>
      </Box>
    </>
  )
}
