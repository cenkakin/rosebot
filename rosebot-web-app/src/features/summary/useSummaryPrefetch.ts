import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSummaryBatch } from '../../api/summary'
import type { FeedItemResponse } from '../../types/feedItem'

export function useSummaryPrefetch(items: FeedItemResponse[]): Set<number> {
  const queryClient = useQueryClient()
  const [summaryIds, setSummaryIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const ids = items
      .filter((i) => i.sourceType !== 'TWITTER')
      .filter((i) => queryClient.getQueryData(['summary', i.id]) === undefined)
      .map((i) => i.id)

    if (ids.length === 0) return

    getSummaryBatch(ids).then((batch) => {
      const found = Object.entries(batch).map(([id, summary]) => {
        queryClient.setQueryData(['summary', Number(id)], summary)
        return Number(id)
      })
      if (found.length > 0) {
        setSummaryIds((prev) => new Set([...prev, ...found]))
      }
    })
    // Batch failures are silently ignored.
    // Items that fail simply never show the chip.
  }, [items, queryClient])

  return summaryIds
}
