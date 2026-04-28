import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useMarket } from '../hooks/useMarket'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Market() {
  const indices        = useStore(s => s.indices)
  const watchlist      = useStore(s => s.watchlist)
  const openStockModal = useStore(s => s.openStockModal)
  const { fetchIndices, fetchWatchlist } = useMarket()
  const [loadingWL, setLoadingWL] = useState(false)

//   useEffect(() => {
//     fetchIndices()
//     setLoadingWL(true)
//     fetchWatchlist().finally(() => setLoadingWL(false))
//   }, [])

useEffect(() => {
  const loadData = () => {
    fetchIndices()
    setLoadingWL(true)
    fetchWatchlist().finally(() => setLoadingWL(false))
  }

  loadData() // initial load

  const interval = setInterval(() => {
    loadData()
  }, 30000) // refresh every 10 seconds

  return () => clearInterval(interval)
}, [fetchIndices, fetchWatchlist])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl tracking-wider text-white">MARKET</h2>
        <p className="text-muted text-sm mt-1">Live NSE/BSE data via Yahoo Finance — click any stock to view chart</p>
      </div>

      {/* Indices */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-5">MAJOR INDICES</div>
        {indices.length === 0 ? (
          <LoadingSpinner text="Fetching index data..." />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {indices.map(idx => {
              const up = idx.change_pct >= 0
              return (
                <button
                  key={idx.symbol}
                  onClick={() => openStockModal(idx.symbol)}
                  className="bg-surface2 border border-border rounded-xl p-5 text-center hover:border-accent/40 hover:bg-accent/[0.03] transition-all group"
                >
                  <div className="font-mono text-[10px] tracking-widest text-muted mb-3">{idx.name}</div>
                  <div className="font-mono text-3xl font-bold text-white group-hover:text-accent transition-colors">
                    ₹{idx.price?.toLocaleString('en-IN')}
                  </div>
                  <div className={`font-mono text-sm mt-2 font-bold ${up ? 'text-success' : 'text-danger'}`}>
                    {up ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}%
                  </div>
                  <div className={`font-mono text-xs mt-1 ${up ? 'text-success/60' : 'text-danger/60'}`}>
                    {up ? '+' : ''}₹{idx.change?.toFixed(2)}
                  </div>
                  <div className="font-mono text-[9px] text-muted mt-3 opacity-0 group-hover:opacity-60 transition-opacity">
                    ↗ View Chart
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Watchlist */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">
          NIFTY 50 WATCHLIST — LIVE PRICES
        </div>
        {loadingWL ? (
          <LoadingSpinner text="Fetching live prices (~30s)..." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Symbol', 'Company', 'Price (₹)', 'Change', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] tracking-widest text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlist.map(s => {
                const up = s.change_pct >= 0
                return (
                  <tr
                    key={s.symbol}
                    onClick={() => openStockModal(s.symbol)}
                    className="border-b border-border/40 hover:bg-accent/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-bold text-white text-sm group-hover:text-accent transition-colors">{s.symbol.replace('.NS', '')}</td>
                    <td className="px-4 py-3 text-muted text-sm">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-accent text-sm font-semibold">
                      ₹{s.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 font-mono text-sm font-bold ${up ? 'text-success' : 'text-danger'}`}>
                      {up ? '▲' : '▼'} {Math.abs(s.change_pct).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted opacity-0 group-hover:opacity-60 transition-opacity">
                      ↗ View Chart
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}