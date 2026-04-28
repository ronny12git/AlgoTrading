import { useStore } from '../store/useStore'

function IndexPill({ idx }) {
  const up = idx.change_pct >= 0
  return (
    <div className="bg-surface2 border border-border rounded-md px-3 py-1.5">
      <div className="font-mono text-[9px] text-muted tracking-widest mb-0.5">{idx.name}</div>
      <div className="flex items-center gap-2 font-mono text-[12px]">
        <span className="text-white font-semibold">
          ₹{idx.price?.toLocaleString('en-IN')}
        </span>
        <span className={up ? 'text-success' : 'text-danger'}>
          {up ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function Topbar({ title }) {
  const indices = useStore(s => s.indices)
  const backendOnline = useStore(s => s.backendOnline)

  return (
    <header className="bg-surface border-b border-border px-7 py-3 flex items-center gap-4 flex-shrink-0">
      <h1 className="font-display text-2xl tracking-widest text-white flex-1">{title}</h1>

      {/* Live indices */}
      <div className="flex items-center gap-3">
        {indices.slice(0, 3).map(idx => <IndexPill key={idx.symbol} idx={idx} />)}
      </div>

      {/* Backend status */}
      <div className="flex items-center gap-2 bg-surface2 border border-border rounded-md px-3 py-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: backendOnline === null ? '#4a607a' : backendOnline ? '#00e676' : '#ff3366',
            boxShadow: backendOnline ? '0 0 6px #00e676' : 'none',
          }}
        />
        <span className="font-mono text-[10px] text-muted tracking-wider">
          {backendOnline === null ? 'CHECKING' : backendOnline ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </header>
  )
}