import type { Article, ArticleRequest } from '../types/article'

const BASE_URL = '/api/articles'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error ?? `HTTP ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

export const articleService = {
  getAll(): Promise<Article[]> {
    return request(BASE_URL)
  },

  getById(id: number): Promise<Article> {
    return request(`${BASE_URL}/${id}`)
  },

  create(data: ArticleRequest): Promise<Article> {
    return request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  update(id: number, data: ArticleRequest): Promise<Article> {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  delete(id: number): Promise<void> {
    return request(`${BASE_URL}/${id}`, { method: 'DELETE' })
  },
}
