import { useState, useMemo } from 'react'

export function useSearch<T>(items: T[], keys: (keyof T)[]) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(item =>
      keys.some(key => {
        const val = item[key]
        return typeof val === 'string' && val.toLowerCase().includes(q)
      })
    )
  }, [items, query, keys])

  return { query, setQuery, results }
}