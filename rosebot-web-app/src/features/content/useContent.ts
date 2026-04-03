import { useQuery } from '@tanstack/react-query'
import { getContent } from '../../api/content'

export function useContent(feedItemId: number | null) {
  return useQuery({
    queryKey: ['content', feedItemId],
    queryFn: () => getContent(feedItemId!),
    enabled: feedItemId !== null,
    staleTime: Infinity,
  })
}
