import type { AppStateResponse } from '../types/appState'
import { client } from './client'

export const getAppState = (): Promise<AppStateResponse> =>
  client.get<AppStateResponse>('/app-state').then((r) => r.data)

export const markVisited = (): Promise<AppStateResponse> =>
  client.put<AppStateResponse>('/app-state/visited').then((r) => r.data)
