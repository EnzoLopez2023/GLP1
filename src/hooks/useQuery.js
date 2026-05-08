import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Fetch data from the API and re-fetch when deps change.
 *
 * Returns { data, loading, error, refetch }
 * Call refetch() after a mutation to get fresh data.
 */
export function useQuery(fetchFn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const countRef              = useRef(0)

  const run = useCallback(async () => {
    const mine = ++countRef.current
    setLoading(true)
    try {
      const result = await fetchFn()
      if (mine === countRef.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (mine === countRef.current) setError(e)
    } finally {
      if (mine === countRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}
