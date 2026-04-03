import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getContentIds } from '../../api/content'
import type { FeedItemResponse } from '../../types/feedItem'

export function useContentPrefetch(items: FeedItemResponse[]): Set<number> {
  const queryClient = useQueryClient()
  const [contentIds, setContentIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const ids = items
      .filter((i) => i.sourceType !== 'TWITTER')
      .filter((i) => queryClient.getQueryData(['content-exists', i.id]) === undefined)
      .map((i) => i.id)

    if (ids.length === 0) return

    getContentIds(ids).then((found) => {
      found.forEach((id) => queryClient.setQueryData(['content-exists', id], true))
      if (found.length > 0) {
        setContentIds((prev) => new Set([...prev, ...found]))
      }
    })
  }, [items, queryClient])

  return contentIds
}
