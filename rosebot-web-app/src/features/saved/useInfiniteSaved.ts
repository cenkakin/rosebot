import { useInfiniteQuery } from '@tanstack/react-query'
import { getSaved } from '../../api/saved'

interface SavedFilters {
  type?: string | null
  sourceId?: string | null
  language?: string | null
  category?: string | null
}

export function useInfiniteSaved({ type, sourceId, language, category }: SavedFilters) {
  return useInfiniteQuery({
    queryKey: ['saved', { type, sourceId, language, category }],
    queryFn: ({ pageParam }) =>
      getSaved({
        before: pageParam ?? undefined,
        limit: 20,
        type: type ?? undefined,
        sourceId: sourceId ? Number(sourceId) : undefined,
        language: language ?? undefined,
        category: category ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < 20 ? undefined : lastPage[lastPage.length - 1].savedAt,
  })
}
