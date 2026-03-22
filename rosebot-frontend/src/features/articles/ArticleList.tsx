import AddIcon from '@mui/icons-material/Add'
import { Alert, Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import { useState } from 'react'
import type { Article } from '../../types/article'
import { ArticleCard } from './ArticleCard'
import { ArticleFormDialog } from './ArticleFormDialog'
import { useArticles } from './useArticles'

export function ArticleList() {
  const { articles, loading, error, createArticle, updateArticle, deleteArticle } = useArticles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | undefined>()

  const openCreate = () => {
    setEditingArticle(undefined)
    setDialogOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditingArticle(article)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingArticle(undefined)
  }

  const handleSubmit = editingArticle
    ? (data: { title: string; content: string }) => updateArticle(editingArticle.id, data)
    : createArticle

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Articles
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Article
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && articles.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No articles yet. Create your first one!</Typography>
        </Box>
      )}

      {!loading && articles.length > 0 && (
        <Grid container spacing={3}>
          {articles.map(article => (
            <Grid key={article.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ArticleCard article={article} onEdit={openEdit} onDelete={deleteArticle} />
            </Grid>
          ))}
        </Grid>
      )}

      <ArticleFormDialog
        open={dialogOpen}
        article={editingArticle}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}
