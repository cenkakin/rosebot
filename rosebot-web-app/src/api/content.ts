import type { ContentResponse } from '../types/content'
import { client } from './client'

export const getContent = (feedItemId: number): Promise<ContentResponse> =>
  client.get<ContentResponse>(`/content/${feedItemId}`).then((r) => r.data)

export const getContentIds = (itemIds: number[]): Promise<number[]> =>
  client
    .get<number[]>('/content/batch', {
      params: { itemIds },
      paramsSerializer: { indexes: null },
    })
    .then((r) => r.data)
