import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { queryClient } from '../lib/queryClient'

export function useAlertStream() {
  const [activeCount, setActiveCount] = useState(0)
  const token = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!token) return

    const es = new EventSource(`/api/v1/alerts/stream`, { withCredentials: true })

    // Need to send token in header — workaround: use URL param for SSE since EventSource doesn't support headers
    // For demo purposes we handle auth via cookie (refresh token) and the SSE is behind requireAuth

    es.addEventListener('alert', (e) => {
      const alert = JSON.parse(e.data)
      console.log('Nueva alerta SSE:', alert)
      // Invalidate alerts query so list refreshes
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setActiveCount((c) => c + 1)
    })

    es.addEventListener('init', (e) => {
      const data = JSON.parse(e.data)
      setActiveCount(data.count)
    })

    es.onerror = () => {
      // EventSource auto-reconnects on error
    }

    return () => es.close()
  }, [token])

  return { activeCount, setActiveCount }
}
