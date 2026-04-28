import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Toast from './components/Toast'
import StockModal from './components/StockModal'
import Dashboard from './pages/Dashboard'
import Deposit from './pages/Deposit'
import Portfolio from './pages/Portfolio'
import Signals from './pages/Signals'
import Trades from './pages/Trades'
import Market from './pages/Market'
import Learn from './pages/Learn'
import { usePortfolio } from './hooks/usePortfolio'
import { useMarket } from './hooks/useMarket'
import { useStore } from './store/useStore'
import { portfolioApi } from './services/api'

const TITLES = {
  '/':          'DASHBOARD',
  '/deposit':   'DEPOSIT',
  '/portfolio': 'PORTFOLIO',
  '/signals':   'AI SIGNALS',
  '/trades':    'TRADE HISTORY',
  '/market':    'MARKET',
  '/learn':     'LEARNING CENTER',
}

export default function App() {
  const location   = useLocation()
  const title      = TITLES[location.pathname] || 'ALPHABOT'

  const { fetchPortfolio, fetchSignals } = usePortfolio()
  const { fetchIndices } = useMarket()

  const setDeposits     = useStore(s => s.setDeposits)
  const backendOnline   = useStore(s => s.backendOnline)
  const stockModalSymbol = useStore(s => s.stockModalSymbol)
  const closeStockModal  = useStore(s => s.closeStockModal)

  // useEffect(() => {
  //   fetchIndices()
  //   portfolioApi.deposits().then(d => setDeposits(d.deposits || [])).catch(() => {})
  //   fetchSignals()
  // }, [])

  useEffect(() => {

  const loadData = () => {
    fetchIndices()

    portfolioApi.deposits()
      .then(d => setDeposits(d.deposits || []))
      .catch(() => {})

    fetchSignals()
  }

  loadData() // first load

  const interval = setInterval(() => {
    loadData()
  }, 30000) // refresh every 30 seconds

  return () => clearInterval(interval)

}, [fetchIndices, fetchSignals])
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-7">

          {/* Backend offline banner */}
          {backendOnline === false && (
            <div className="mb-5 bg-danger/10 border border-danger/30 rounded-xl px-5 py-4 font-mono text-sm text-danger flex items-center gap-3">
              <span className="text-xl">⚠</span>
              <div>
                <div className="font-bold">Backend Offline</div>
                <div className="text-danger/70 text-xs mt-0.5">
                  Start Flask: <code className="bg-black/30 px-1 rounded">cd backend && python app.py</code>
                </div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/deposit"   element={<Deposit />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/signals"   element={<Signals />} />
            <Route path="/trades"    element={<Trades />} />
            <Route path="/learn"     element={<Learn />} />
            <Route path="/market"    element={<Market />} />
          </Routes>
        </main>
      </div>

      <Toast />

      {/* Global stock chart modal */}
      {stockModalSymbol && (
        <StockModal symbol={stockModalSymbol} onClose={closeStockModal} />
      )}
    </div>
  )
}