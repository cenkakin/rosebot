import { useInfiniteQuery } from '@tanstack/react-query'
import { getSaved } from '../../api/saved'

interface SavedFilters {
  type?: string | null
  sourceId?: string | null
}

export function useInfiniteSaved({ type, sourceId }: SavedFilters) {
  return useInfiniteQuery({
    queryKey: ['saved', { type, sourceId }],
    queryFn: ({ pageParam }) =>
      getSaved({
        before: pageParam ?? undefined,
        limit: 20,
        type: type ?? undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].savedAt,
  })
}
