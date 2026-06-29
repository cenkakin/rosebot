import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, CircularProgress, Typography } from '@mui/material'
import { getClusters } from '../../api/clusters'
import { saveItem, unsaveItem } from '../../api/saved'
import { useFilterParams } from '../../hooks/useFilterParams'
import { useToast } from '../../hooks/useToast'
import type { FeedItemResponse } from '../../types/feedItem'
import { ClustersToolbar, type ClusterView } from './ClustersToolbar'
import { ClusterColumn } from './ClusterColumn'
import { DigestStory } from './DigestStory'
import { ContentPanel } from '../content/ContentPanel'
import { ErrorMessage } from '../../components/ErrorMessage'

export function ClustersPage() {
  const { view, setView } = useFilterParams()
  const activeView: ClusterView = view === 'columns' ? 'columns' : 'digest'

  const [activeItem, setActiveItem] = useState<FeedItemResponse | null>(null)
  const [minHeaderHeight, setMinHeaderHeight] = useState<number | undefined>(undefined)
  const { showToast, ToastSnackbar } = useToast()
  const queryClient = useQueryClient()

  const headerEls = useRef<Map<number, HTMLDivElement>>(new Map())

  const { data: clusters = [], isLoading, isError } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => getClusters({}),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (activeView !== 'columns' || clusters.length === 0) return
    const frame = requestAnimationFrame(() => {
      let max = 0
      headerEls.current.forEach((el) => {
        if (el) max = Math.max(max, el.scrollHeight)
      })
      if (max > 0) setMinHeaderHeight(max)
    })
    return () => cancelAnimationFrame(frame)
  }, [activeView, clusters])

  const makeHeaderRef = useCallback(
    (clusterId: number) => (el: HTMLDivElement | null) => {
      if (el) headerEls.current.set(clusterId, el)
      else headerEls.current.delete(clusterId)
    },
    [],
  )

  const toggleSave = useMutation({
    mutationFn: ({ id, saved }: { id: number; saved: boolean }) => (saved ? unsaveItem(id) : saveItem(id)),
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: ['cluster-items'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['cluster-items'] })
      queryClient.setQueriesData({ queryKey: ['cluster-items'] }, (old: { pages: FeedItemResponse[][] } | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: FeedItemResponse[]) =>
            page.map((item) => (item.id === id ? { ...item, saved: !saved } : item)),
          ),
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },
    onSuccess: (_d, { saved }) => showToast(saved ? 'Removed from saved' : 'Saved'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-items'] })
      queryClient.removeQueries({ queryKey: ['saved'] })
    },
  })

  const onSaveToggle = (id: number, saved: boolean) => toggleSave.mutate({ id, saved })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <ClustersToolbar view={activeView} onViewChange={setView} />

      {isError && <ErrorMessage message="Failed to load clusters." />}

      {isLoading && (
        <Box display="flex" justifyContent="center" pt={6}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && clusters.length === 0 && !isError && (
        <Box display="flex" justifyContent="center" pt={8}>
          <Typography variant="body2" color="text.secondary">
            No clusters yet.
          </Typography>
        </Box>
      )}

      {activeView === 'columns' ? (
        <Box sx={{ display: 'flex', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          {clusters.map((cluster) => (
            <ClusterColumn
              key={cluster.id}
              cluster={cluster}
              onOpen={setActiveItem}
              onSaveToggle={onSaveToggle}
              minHeaderHeight={minHeaderHeight}
              onHeaderRef={makeHeaderRef(cluster.id)}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          <Box sx={{ maxWidth: 880, mx: 'auto' }}>
            {clusters.map((cluster) => (
              <DigestStory key={cluster.id} cluster={cluster} onOpen={setActiveItem} onSaveToggle={onSaveToggle} />
            ))}
          </Box>
        </Box>
      )}

      <ContentPanel item={activeItem} onClose={() => setActiveItem(null)} />
      {ToastSnackbar}
    </Box>
  )
}
