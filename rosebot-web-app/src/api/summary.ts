import type { SummaryResponse } from '../types/summary'
import { client } from './client'

export const getSummary = (feedItemId: number): Promise<SummaryResponse> =>
  client.get<SummaryResponse>(`/summaries/${feedItemId}`).then((r) => r.data)
