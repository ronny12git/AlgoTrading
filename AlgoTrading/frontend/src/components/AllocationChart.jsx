import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store/useStore'

const COLORS = ['#00d9ff', '#6236ff', '#00e676', '#ffcc00', '#ff6b35', '#ec4899', '#8b5cf6', '#06b6d4']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border rounded-lg px-3 py-2 font-mono text-xs">
      <div className="text-white font-semibold">{payload[0].name}</div>
      <div className="text-accent mt-0.5">₹{payload[0].value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
  )
}

export default function AllocationChart({ holdings, cash, totalValue }) {
  const openStockModal = useStore(s => s.openStockModal)

  const data = holdings.map((h, i) => ({
    name:   h.symbol.replace('.NS', ''),
    symbol: h.symbol,
    value:  h.current_value,
    color:  COLORS[i % COLORS.length],
  }))
  if (cash > 0) data.push({ name: 'CASH', symbol: null, value: cash, color: '#4a607a' })

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted font-mono text-sm">
        No allocations yet
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data} cx={80} cy={80}
            innerRadius={48} outerRadius={80}
            dataKey="value" strokeWidth={0}
            onClick={(entry) => { if (entry?.symbol) openStockModal(entry.symbol) }}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${d.symbol ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => d.symbol && openStockModal(d.symbol)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className={`flex-1 font-mono text-xs ${d.symbol ? 'text-white hover:text-accent' : 'text-muted'} transition-colors`}>
              {d.name}
            </span>
            <span className="font-mono text-xs text-muted">
              {totalValue > 0 ? (d.value / totalValue * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}