import { useInfiniteQuery } from '@tanstack/react-query'
import { getClusterItems } from '../../api/clusters'

export function useClusterItems(clusterId: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['cluster-items', clusterId],
    queryFn: ({ pageParam }) =>
      getClusterItems(clusterId, { before: pageParam ?? undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].publishedAt,
    staleTime: 60_000,
    enabled,
  })
}
