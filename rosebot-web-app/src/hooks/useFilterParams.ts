import { useSearchParams } from 'react-router'

export function useFilterParams() {
  const [params, setParams] = useSearchParams()

  const set = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value != null) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  const setMultiple = (updates: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v != null) next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true },
    )
  }

  return {
    type: params.get('type'),
    sourceId: params.get('sourceId'),
    language: params.get('language'),
    category: params.get('category'),
    setType: (v: string | null) => set('type', v),
    setSourceId: (v: string | null) => set('sourceId', v),
    setLanguage: (v: string | null) => set('language', v),
    setCategory: (v: string | null) => set('category', v),
    setMultiple,
    clearAll: () => setParams({}, { replace: true }),
  }
}
