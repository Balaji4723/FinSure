import { useState, useEffect } from 'react'
import { BANK_DATA, RBI_RATES } from '../data/bankRates'
import { useStore } from '../store/useStore'

export function useBankRates() {
  const { bankRates, setBankRates, ratesLastFetched, setRatesLastFetched } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ONE_HOUR = 3600000
    const stale = !ratesLastFetched || Date.now() - ratesLastFetched > ONE_HOUR
    if (bankRates && !stale) return

    setLoading(true)
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBankRates(data)
          setRatesLastFetched(Date.now())
        } else throw new Error('API failed')
      })
      .catch(() => {
        // Fallback to local real data
        setBankRates({ banks: BANK_DATA, rbi: RBI_RATES, source: 'RBI MPC MPC August 2026)', success: true })
        setRatesLastFetched(Date.now())
      })
      .finally(() => setLoading(false))
  }, [])

  return {
    banks: bankRates?.banks || BANK_DATA,
    rbi: bankRates?.rbi || RBI_RATES,
    source: bankRates?.source || 'RBI MPC August 2026',
    loading,
    error
  }
}

export function useSessionTimeout(timeoutMs = 15 * 60 * 1000) {
  const { updateActivity } = useStore()
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handle = () => updateActivity()
    events.forEach(e => window.addEventListener(e, handle, { passive: true }))

    const interval = setInterval(() => {
      const { lastActivity } = useStore.getState()
      if (Date.now() - lastActivity > timeoutMs) {
        localStorage.removeItem('loggedIn')
        window.location.href = '/login?timeout=1'
      }
    }, 60000)

    return () => {
      events.forEach(e => window.removeEventListener(e, handle))
      clearInterval(interval)
    }
  }, [timeoutMs])
}
