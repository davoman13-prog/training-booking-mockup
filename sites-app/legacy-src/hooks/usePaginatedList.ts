import { useCallback, useEffect, useMemo, useState } from 'react'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  pageCount: number
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationState
  message?: string
}

export default function usePaginatedList<T>(
  resource: string,
  filters: Record<string, string>,
  page: number,
  pageSize: number,
) {
  const [items, setItems] = useState<T[]>([])
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize, total: 0, pageCount: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError('')
    try {
      const stableFilters = JSON.parse(filterKey) as Record<string, string>
      const parameters = new URLSearchParams({ ...stableFilters, page: String(page), pageSize: String(pageSize) })
      const response = await fetch(`/api/admin/lists/${resource}?${parameters}`, { signal, cache: 'no-store' })
      const result = await response.json() as PaginatedResponse<T>
      if (!response.ok) throw new Error(result.message ?? 'The list could not be loaded.')
      setItems(result.items)
      setPagination(result.pagination)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : 'The list could not be loaded.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [filterKey, page, pageSize, resource])

  useEffect(() => {
    const controller = new AbortController()
    // The request intentionally owns this hook's loading and result state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { items, pagination, isLoading, error, refresh: load }
}
