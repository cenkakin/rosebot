import type { FeedItemResponse } from '../types/feedItem'
import { client } from './client'

interface FeedParams {
  before?: string
  limit?: number
  sourceId?: number
  type?: string
  language?: string
  category?: string
}

export const getFeed = (params: FeedParams = {}): Promise<FeedItemResponse[]> =>
  client.get<FeedItemResponse[]>('/feed', { params }).then((r) => r.data)

export const getLanguages = (): Promise<string[]> =>
  client.get<string[]>('/feed/languages').then((r) => r.data)
