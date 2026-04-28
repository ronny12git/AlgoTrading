import { useCallback } from 'react'
import { marketApi } from '../services/api'
import { useStore } from '../store/useStore'

export function useMarket() {
  const { setIndices, setWatchlist } = useStore()

  const fetchIndices = useCallback(async () => {
    try {
      const data = await marketApi.indices()
      setIndices(data.indices || [])
    } catch {
        console.log("Error ala re...")
    }
  }, [setIndices])

  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await marketApi.watchlist()
      setWatchlist(data.stocks || [])
    } catch {console.log("Error ala re...")}
  }, [setWatchlist])

  return { fetchIndices, fetchWatchlist }
}