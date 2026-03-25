import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../../api/summary'

export function useSummary(feedItemId: number | null) {
  return useQuery({
    queryKey: ['summary', feedItemId],
    queryFn: () => getSummary(feedItemId!),
    enabled: feedItemId !== null,
    staleTime: Infinity,
  })
}
