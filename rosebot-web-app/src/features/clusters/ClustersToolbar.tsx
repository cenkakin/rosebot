import { Box, Chip, Typography } from '@mui/material'
import { CATEGORY_VALUES, CATEGORY_LABELS, CATEGORY_COLORS, type CategoryValue } from '../../constants/categories'
import { useLanguages } from '../../hooks/useLanguages'
import { BRAND } from '../../theme'

interface Props {
  language: string | null
  category: string | null
  onLanguageChange: (lang: string | null) => void
  onCategoryChange: (cat: string | null) => void
}

export function ClustersToolbar({ language, category, onLanguageChange, onCategoryChange }: Props) {
  const languages = useLanguages()

  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BRAND.border}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {languages.length > 0 && (
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="caption" sx={{ color: BRAND.mutedText, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', mr: 0.5 }}>
            Language
          </Typography>
          {languages.map((lang) => (
            <Chip
              key={lang}
              label={lang.toUpperCase()}
              size="small"
              onClick={() => onLanguageChange(language === lang ? null : lang)}
              variant={language === lang ? 'filled' : 'outlined'}
              sx={{
                fontSize: 11,
                height: 22,
                fontWeight: 600,
                ...(language === lang && { bgcolor: BRAND.accent, color: '#fff', '&:hover': { bgcolor: BRAND.accent } }),
              }}
            />
          ))}
        </Box>
      )}

      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Typography variant="caption" sx={{ color: BRAND.mutedText, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', mr: 0.5 }}>
          Category
        </Typography>
        {CATEGORY_VALUES.map((cat) => {
          const colors = CATEGORY_COLORS[cat as CategoryValue]
          const active = category === cat
          return (
            <Chip
              key={cat}
              label={CATEGORY_LABELS[cat as CategoryValue]}
              size="small"
              onClick={() => onCategoryChange(active ? null : cat)}
              sx={{
                fontSize: 11,
                height: 22,
                fontWeight: 600,
                bgcolor: active ? colors.text : colors.bg,
                color: active ? '#fff' : colors.text,
                border: `1px solid ${colors.text}20`,
                '&:hover': { bgcolor: colors.text, color: '#fff' },
              }}
            />
          )
        })}
      </Box>
    </Box>
  )
}
