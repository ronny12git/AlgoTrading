import { useStore } from '../store/useStore'
import StatCard from '../components/StatCard'
import HoldingsTable from '../components/HoldingsTable'
import AllocationChart from '../components/AllocationChart'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Portfolio() {
  const portfolio = useStore(s => s.portfolio)
  if (!portfolio) return <LoadingSpinner text="Loading portfolio..." />

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl tracking-wider text-white">PORTFOLIO</h2>
        <p className="text-muted text-sm mt-1">Your AI-managed holdings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Holdings Value"
          value={portfolio.holdings_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          prefix="₹"
          accent="#00d9ff"
        />
        <StatCard
          label="Holdings P&L"
          value={`${portfolio.holdings_pnl >= 0 ? '+' : ''}₹${Math.abs(portfolio.holdings_pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          accent={portfolio.holdings_pnl >= 0 ? '#00e676' : '#ff3366'}
        />
        <StatCard
          label="Cash Reserve"
          value={portfolio.cash?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          prefix="₹"
          accent="#ffcc00"
        />
      </div>

      {/* Chart + table */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">ALLOCATION</div>
          <AllocationChart
            holdings={portfolio.holdings || []}
            cash={portfolio.cash || 0}
            totalValue={portfolio.portfolio_value || 0}
          />
        </div>
        <div className="col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">
            HOLDINGS ({portfolio.holdings?.length || 0} positions)
          </div>
          <HoldingsTable holdings={portfolio.holdings} />
        </div>
      </div>
    </div>
  )
}