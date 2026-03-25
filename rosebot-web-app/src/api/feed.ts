import type { FeedItemResponse } from '../types/feedItem'
import { client } from './client'

interface FeedParams {
  before?: string
  limit?: number
  sourceId?: number
  type?: string
}

export const getFeed = (params: FeedParams = {}): Promise<FeedItemResponse[]> =>
  client.get<FeedItemResponse[]>('/feed', { params }).then((r) => r.data)
