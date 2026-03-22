import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { Article, ArticleRequest } from '../../types/article'

interface Props {
  open: boolean
  article?: Article
  onClose: () => void
  onSubmit: (data: ArticleRequest) => Promise<void>
}

export function ArticleFormDialog({ open, article, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(article?.title ?? '')
      setContent(article?.content ?? '')
      setError(null)
    }
  }, [open, article])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{article ? 'Edit Article' : 'New Article'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          autoFocus
          error={!!error && !title.trim()}
        />
        <TextField
          label="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
          fullWidth
          multiline
          rows={6}
          error={!!error && !content.trim()}
          helperText={error ?? undefined}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {article ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
