import { useStore } from '../store/useStore'
import { usePortfolio } from '../hooks/usePortfolio'
import StatCard from '../components/StatCard'
import AllocationChart from '../components/AllocationChart'
import TransactionList from '../components/TransactionList'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const portfolio      = useStore(s => s.portfolio)
  const aiStatus       = useStore(s => s.aiStatus)
  const openStockModal = useStore(s => s.openStockModal)
  const { runAI }      = usePortfolio()

  if (!portfolio) return <LoadingSpinner text="Loading portfolio..." />

  const pnlUp = portfolio.overall_pnl >= 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white">OVERVIEW</h2>
          <p className="text-muted text-sm mt-1">Real-time portfolio summary</p>
        </div>
        <button
          onClick={runAI}
          disabled={aiStatus !== 'idle'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #6236ff, #00d9ff)',
            color: '#fff',
            boxShadow: aiStatus === 'idle' ? '0 4px 20px rgba(98,54,255,0.4)' : 'none',
          }}
        >
          <span>⚡</span>
          {aiStatus === 'idle' ? 'Run AI Analysis' : `AI ${aiStatus}...`}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Portfolio Value"  value={portfolio.portfolio_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" accent="#00d9ff" />
        <StatCard label="Total Deposited"  value={portfolio.total_deposited?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" accent="#6236ff" />
        <StatCard
          label="Overall P&L"
          value={`${pnlUp ? '+' : ''}₹${Math.abs(portfolio.overall_pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          sub={`${pnlUp ? '+' : ''}${portfolio.overall_pnl_pct?.toFixed(2)}% all time`}
          accent={pnlUp ? '#00e676' : '#ff3366'}
        />
        <StatCard label="Cash Balance"     value={portfolio.cash?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} prefix="₹" accent="#ffcc00" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">PORTFOLIO ALLOCATION</div>
          <AllocationChart
            holdings={portfolio.holdings || []}
            cash={portfolio.cash || 0}
            totalValue={portfolio.portfolio_value || 0}
          />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">RECENT AI TRADES</div>
          <TransactionList transactions={(portfolio.transactions || []).slice(0, 5)} />
        </div>
      </div>

      {/* Active positions */}
      {portfolio.holdings?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">
            ACTIVE POSITIONS ({portfolio.holdings.length}) — click to view chart
          </div>
          <div className="grid grid-cols-3 gap-3">
            {portfolio.holdings.map(h => (
              <button
                key={h.symbol}
                onClick={() => openStockModal(h.symbol)}
                className="bg-surface2 border border-border rounded-lg px-4 py-3 text-left hover:border-accent/40 hover:bg-accent/[0.03] transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white text-sm group-hover:text-accent transition-colors flex items-center gap-1">
                      {h.symbol.replace('.NS', '')}
                      <span className="opacity-0 group-hover:opacity-50 text-[10px] transition-opacity">↗</span>
                    </div>
                    <div className="font-mono text-accent text-sm font-bold mt-1">
                      ₹{h.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className={`font-mono text-xs font-bold ${h.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnl_pct?.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}