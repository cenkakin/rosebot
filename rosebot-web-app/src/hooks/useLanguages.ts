import { useQuery } from '@tanstack/react-query'
import { getLanguages } from '../api/feed'

export function useLanguages() {
  const { data = [] } = useQuery({
    queryKey: ['feed-languages'],
    queryFn: getLanguages,
    staleTime: 5 * 60_000,
  })
  return data
}
