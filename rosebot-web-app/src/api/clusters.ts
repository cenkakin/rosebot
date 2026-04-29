import type { ClusterResponse, ClusterItemsResponse } from '../types/cluster'
import { client } from './client'

export const getClusters = (params: { category?: string } = {}): Promise<ClusterResponse[]> =>
  client.get<ClusterResponse[]>('/clusters', { params }).then((r) => r.data)

export const getClusterItems = (
  clusterId: number,
  params: { before?: string; limit?: number } = {},
): Promise<ClusterItemsResponse['items']> =>
  client.get<ClusterItemsResponse>(`/clusters/${clusterId}/items`, { params }).then((r) => r.data.items)

export const getJustIn = (params: { before?: string; limit?: number } = {}): Promise<ClusterItemsResponse['items']> =>
  client.get<ClusterItemsResponse>('/clusters/just-in', { params }).then((r) => r.data.items)
