import { useStore } from '../store/useStore'
import EmptyState from './EmptyState'

function PnlCell({ val, pct }) {
  const up = val >= 0
  return (
    <td className="px-4 py-3">
      <div className={`font-mono text-sm font-semibold ${up ? 'text-success' : 'text-danger'}`}>
        {up ? '+' : ''}₹{Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
      <div className={`font-mono text-xs ${up ? 'text-success/70' : 'text-danger/70'}`}>
        {up ? '+' : ''}{pct?.toFixed(2)}%
      </div>
    </td>
  )
}

export default function HoldingsTable({ holdings }) {
  const openStockModal = useStore(s => s.openStockModal)

  if (!holdings?.length) {
    return <EmptyState icon="📦" title="No holdings yet" text="AI will allocate funds once you deposit" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {['Stock', 'Shares', 'Avg Buy', 'Current', 'Invested', 'Value', 'P&L'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-mono text-[10px] tracking-widest text-muted uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <tr key={h.symbol} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors group">
              <td className="px-4 py-3">
                <button
                  onClick={() => openStockModal(h.symbol)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <div className="font-semibold text-white text-sm group-hover:text-accent transition-colors flex items-center gap-1.5">
                    {h.symbol.replace('.NS', '')}
                    <span className="opacity-0 group-hover:opacity-60 text-accent text-xs transition-opacity">↗</span>
                  </div>
                  <div className="text-muted text-xs mt-0.5 max-w-[140px] truncate">{h.name}</div>
                </button>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-white">{h.shares}</td>
              <td className="px-4 py-3 font-mono text-sm text-white">₹{h.avg_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 font-mono text-sm text-accent">₹{h.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 font-mono text-sm text-muted">₹{h.invested?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 font-mono text-sm text-white">₹{h.current_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <PnlCell val={h.pnl} pct={h.pnl_pct} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}