import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '../../api/feed'

interface FeedFilters {
  type?: string | null
  sourceId?: string | null
}

export function useInfiniteFeed({ type, sourceId }: FeedFilters) {
  return useInfiniteQuery({
    queryKey: ['feed', { type, sourceId }],
    queryFn: ({ pageParam }) =>
      getFeed({
        before: pageParam ?? undefined,
        limit: 20,
        type: type ?? undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].publishedAt,
  })
}
