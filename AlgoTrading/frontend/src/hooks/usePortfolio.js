import { useCallback, useEffect } from 'react'
import { portfolioApi, aiApi, marketApi, healthApi } from '../services/api'
import { useStore } from '../store/useStore'

export function usePortfolio() {
  const { setPortfolio, setAiStatus, setSignals, setBackendOnline, showToast } = useStore()

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await portfolioApi.get()
      setPortfolio(data)
      setAiStatus(data.ai_status)
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    }
  }, [setPortfolio, setAiStatus, setBackendOnline])

  const fetchSignals = useCallback(async () => {
    try {
      const data = await aiApi.signals()
      setSignals(data.signals || [], data.timestamp)
    } catch {
        console.log("error ala re ...")
    }
  }, [setSignals])

  const deposit = useCallback(async (amount) => {
    try {
      const res = await portfolioApi.deposit(amount)
      showToast(res.message, 'success')
      setAiStatus('analyzing')
      await fetchPortfolio()
      return true
    } catch (e) {
      showToast(e.error || 'Deposit failed', 'error')
      return false
    }
  }, [showToast, setAiStatus, fetchPortfolio])

  const runAI = useCallback(async () => {
    try {
      const res = await aiApi.runCycle()
      showToast(res.message, 'info')
      setAiStatus('analyzing')
    } catch {
      showToast('Cannot reach backend', 'error')
    }
  }, [showToast, setAiStatus])

  useEffect(() => {
    fetchPortfolio()
    fetchSignals()
    const iv = setInterval(() => {
      fetchPortfolio()
    }, 15000)
    return () => clearInterval(iv)
  }, [])

  return { fetchPortfolio, fetchSignals, deposit, runAI }
}