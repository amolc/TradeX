import { useEffect } from 'react'

export function usePolling(callback, delay, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const interval = setInterval(callback, delay)
    return () => clearInterval(interval)
  }, [callback, delay, enabled])
}
