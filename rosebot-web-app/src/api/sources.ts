import type { SourceResponse } from '../types/source'
import { client } from './client'

export const getSources = (): Promise<SourceResponse[]> =>
  client.get<SourceResponse[]>('/sources').then((r) => r.data)
