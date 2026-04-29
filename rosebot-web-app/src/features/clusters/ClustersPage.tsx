import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress, Typography } from '@mui/material'
import { getClusters } from '../../api/clusters'
import { useFilterParams } from '../../hooks/useFilterParams'
import { ClustersToolbar } from './ClustersToolbar'
import { ClusterColumn } from './ClusterColumn'
import { ErrorMessage } from '../../components/ErrorMessage'

export function ClustersPage() {
  const { language, category, setLanguage, setCategory } = useFilterParams()

  const { data: clusters = [], isLoading, isError } = useQuery({
    queryKey: ['clusters', { category }],
    queryFn: () => getClusters({ category: category ?? undefined }),
    staleTime: 60_000,
  })

  const filtered = language
    ? clusters.filter((c) => c.languages.includes(language))
    : clusters

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ClustersToolbar
        language={language}
        category={category}
        onLanguageChange={setLanguage}
        onCategoryChange={setCategory}
      />

      {isError && <ErrorMessage message="Failed to load clusters." />}

      {isLoading && (
        <Box display="flex" justifyContent="center" pt={6}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && filtered.length === 0 && !isError && (
        <Box display="flex" justifyContent="center" pt={8}>
          <Typography variant="body2" color="text.secondary">
            No clusters match the current filters.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        {filtered.map((cluster) => (
          <ClusterColumn key={cluster.id} cluster={cluster} />
        ))}
      </Box>
    </Box>
  )
}
