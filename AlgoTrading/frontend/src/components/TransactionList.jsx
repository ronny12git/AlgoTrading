import { useStore } from '../store/useStore'
import EmptyState from './EmptyState'

export default function TransactionList({ transactions, showReason = false }) {
  const openStockModal = useStore(s => s.openStockModal)

  if (!transactions?.length) {
    return <EmptyState icon="📋" title="No trades yet" text="AI-executed trades appear here" />
  }

  return (
    <div className="divide-y divide-border/40">
      {transactions.map(tx => {
        const isBuy = tx.type === 'BUY'
        return (
          <div key={tx.id} className="flex items-center gap-3 py-3 px-1 hover:bg-white/[0.015] transition-colors rounded group">
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: isBuy ? 'rgba(0,230,118,0.12)' : 'rgba(255,51,102,0.12)',
                color: isBuy ? '#00e676' : '#ff3366',
              }}
            >
              {isBuy ? '↑' : '↓'}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openStockModal(tx.symbol)}
                  className="font-semibold text-white text-sm hover:text-accent transition-colors flex items-center gap-1"
                >
                  {tx.type} {tx.symbol?.replace('.NS', '')}
                  <span className="opacity-0 group-hover:opacity-50 text-accent text-[10px] transition-opacity">↗</span>
                </button>
                <span
                  className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: isBuy ? 'rgba(0,230,118,0.1)' : 'rgba(255,51,102,0.1)',
                    color: isBuy ? '#00e676' : '#ff3366',
                  }}
                >
                  {tx.type}
                </span>
              </div>
              <div className="font-mono text-xs text-muted mt-0.5 truncate">
                {showReason ? tx.reason : `${tx.shares} shares @ ₹${tx.price?.toLocaleString('en-IN')}`}
              </div>
            </div>

            {/* Amount + time */}
            <div className="text-right flex-shrink-0">
              <div
                className="font-mono text-sm font-bold"
                style={{ color: isBuy ? '#ff3366' : '#00e676' }}
              >
                {isBuy ? '-' : '+'}₹{tx.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="font-mono text-[10px] text-muted mt-0.5">
                {new Date(tx.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}