import type { SummaryResponse } from '../types/summary'
import { client } from './client'

export const getSummary = (feedItemId: number): Promise<SummaryResponse> =>
  client.get<SummaryResponse>(`/summaries/${feedItemId}`).then((r) => r.data)

export const getSummaryBatch = (
  itemIds: number[],
): Promise<Record<number, SummaryResponse>> =>
  client
    .get<Record<number, SummaryResponse>>('/summaries/batch', {
      params: { itemIds },
      paramsSerializer: { indexes: null },
    })
    .then((r) => r.data)
