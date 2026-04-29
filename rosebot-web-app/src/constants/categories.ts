export const CATEGORY_VALUES = [
  'POLITICS',
  'BUSINESS',
  'TECHNOLOGY',
  'SCIENCE_AND_HEALTH',
  'WORLD',
  'SOCIETY',
  'ENTERTAINMENT',
  'SPORTS',
] as const

export type CategoryValue = (typeof CATEGORY_VALUES)[number]

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  POLITICS: 'Politics',
  BUSINESS: 'Business',
  TECHNOLOGY: 'Technology',
  SCIENCE_AND_HEALTH: 'Science & Health',
  WORLD: 'World',
  SOCIETY: 'Society',
  ENTERTAINMENT: 'Entertainment',
  SPORTS: 'Sports',
}

export const CATEGORY_COLORS: Record<CategoryValue, { bg: string; text: string }> = {
  POLITICS: { bg: '#fce4ec', text: '#c2185b' },
  BUSINESS: { bg: '#e8f5e9', text: '#2e7d32' },
  TECHNOLOGY: { bg: '#e3f2fd', text: '#1565c0' },
  SCIENCE_AND_HEALTH: { bg: '#f3e5f5', text: '#6a1b9a' },
  WORLD: { bg: '#fff8e1', text: '#f57f17' },
  SOCIETY: { bg: '#fbe9e7', text: '#bf360c' },
  ENTERTAINMENT: { bg: '#fce4ec', text: '#ad1457' },
  SPORTS: { bg: '#e8eaf6', text: '#283593' },
}
