import { useCallback, useEffect, useState } from 'react'
import { articleService } from '../../services/articleService'
import type { Article, ArticleRequest } from '../../types/article'

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await articleService.getAll()
      setArticles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const createArticle = useCallback(async (data: ArticleRequest) => {
    const created = await articleService.create(data)
    setArticles(prev => [created, ...prev])
  }, [])

  const updateArticle = useCallback(async (id: number, data: ArticleRequest) => {
    const updated = await articleService.update(id, data)
    setArticles(prev => prev.map(a => (a.id === id ? updated : a)))
  }, [])

  const deleteArticle = useCallback(async (id: number) => {
    await articleService.delete(id)
    setArticles(prev => prev.filter(a => a.id !== id))
  }, [])

  return { articles, loading, error, createArticle, updateArticle, deleteArticle, refetch: fetchArticles }
}
