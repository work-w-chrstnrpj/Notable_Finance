import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiResult } from '../../../shared/finance.types'

// Per-window tag: this module evaluates once per renderer (i.e. per window), so the tag
// distinguishes windows in dev logs when verifying cross-window event fan-out.
const WIN_TAG = Math.floor(Math.random() * 1e6)

/**
 * Fetch data over window.api and keep it fresh: refetches whenever main broadcasts
 * records:changed / derived:updated (which is what keeps multiple windows consistent).
 */
export function useApiData<T>(
  fetcher: () => Promise<ApiResult<T>>,
  deps: unknown[] = []
): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const reload = useCallback(() => {
    let cancelled = false
    void fetcherRef.current().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error.message)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Initial load + when deps change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => reload(), [reload, ...deps])

  // Live updates: any data change in ANY window triggers a refetch here.
  useEffect(() => {
    const offRecords = window.api.on('records:changed', (payload) => {
      if (import.meta.env.DEV) console.debug(`[nf] records:changed (win ${WIN_TAG})`, payload)
      reload()
    })
    const offDerived = window.api.on('derived:updated', () => reload())
    return () => {
      offRecords()
      offDerived()
    }
  }, [reload])

  return { data, error, loading, reload }
}

/** Run a mutation, surfacing the ApiResult error (if any) to the caller. */
export async function runMutation<T>(
  action: () => Promise<ApiResult<T>>
): Promise<{ ok: boolean; error?: string }> {
  const result = await action()
  return result.ok ? { ok: true } : { ok: false, error: result.error.message }
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2
})

export function money(value: number): string {
  return peso.format(value)
}
