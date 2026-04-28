import { useStore } from '../store/useStore'

const ACTION_CONFIG = {
  BUY:  { color: '#00e676', bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.3)'  },
  SELL: { color: '#ff3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)' },
  HOLD: { color: '#4a607a', bg: 'rgba(74,96,122,0.08)',  border: 'rgba(74,96,122,0.3)'  },
}

export default function SignalCard({ signal }) {
  const openStockModal = useStore(s => s.openStockModal)
  const cfg = ACTION_CONFIG[signal.action] || ACTION_CONFIG.HOLD

  return (
    <div
      onClick={() => openStockModal(signal.symbol)}
      className="rounded-xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer group"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderTop: `2px solid ${cfg.color}`,
      }}
    >
      {/* Hover hint */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity font-mono text-[10px]"
        style={{ color: cfg.color }}
      >
        ↗ View Chart
      </div>

      {/* Action badge + score */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
          style={{ background: `${cfg.color}20`, color: cfg.color }}
        >
          {signal.action}
        </span>
        <span className="font-mono text-[11px] text-muted">
          {signal.score > 0 ? '+' : ''}{signal.score}
        </span>
      </div>

      {/* Stock name */}
      <div className="font-bold text-white text-[15px] leading-tight group-hover:text-opacity-90">
        {signal.symbol?.replace('.NS', '')}
      </div>
      <div className="text-muted text-[11px] mt-0.5 mb-3 truncate">{signal.name?.split(' ').slice(0, 3).join(' ')}</div>

      {/* Price */}
      <div className="font-mono text-[20px] font-bold" style={{ color: cfg.color }}>
        ₹{signal.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>

      {/* Indicators */}
      <div className="flex gap-3 mt-3 font-mono text-[10px] text-muted">
        <span>RSI {signal.rsi}</span>
        <span>Mom {signal.momentum_5d > 0 ? '+' : ''}{signal.momentum_5d}%</span>
        <span>Vol {signal.volume_ratio}x</span>
      </div>

      {/* Confidence bar */}
      <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${signal.confidence}%`, background: cfg.color }}
        />
      </div>
      <div className="font-mono text-[10px] text-muted mt-1">
        Confidence: {signal.confidence}%
      </div>
    </div>
  )
}