import type { FeedItemResponse } from '../types/feedItem'
import type { SourceResponse } from '../types/source'
import { client } from './client'

interface SavedParams {
  before?: string
  limit?: number
  sourceId?: number
  type?: string
}

export const getSaved = (params: SavedParams = {}): Promise<FeedItemResponse[]> =>
  client.get<FeedItemResponse[]>('/saved', { params }).then((r) => r.data)

export const getSavedSources = (): Promise<SourceResponse[]> =>
  client.get<SourceResponse[]>('/saved/sources').then((r) => r.data)

export const saveItem = (feedItemId: number): Promise<void> =>
  client.post(`/saved/${feedItemId}`).then(() => undefined)

export const unsaveItem = (feedItemId: number): Promise<void> =>
  client.delete(`/saved/${feedItemId}`).then(() => undefined)
