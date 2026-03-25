export interface FeedItemResponse {
  id: number
  sourceId: number
  sourceName: string
  sourceType: 'NEWS' | 'REDDIT' | 'TWITTER'
  title: string
  url: string
  content: string | null
  thumbnailUrl: string | null
  author: string | null
  engagement: Record<string, unknown> | null
  publishedAt: string
  saved: boolean
}
