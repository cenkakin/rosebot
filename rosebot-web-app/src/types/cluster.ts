import type { FeedItemResponse } from './feedItem'

export interface ClusterResponse {
  id: number
  label: string
  summary: string
  articleCount: number
  windowStart: string
  windowEnd: string
  sourceMix: Record<string, number>
  category: string | null
  languages: string[]
}

export interface ClusterItemsResponse {
  items: FeedItemResponse[]
}
