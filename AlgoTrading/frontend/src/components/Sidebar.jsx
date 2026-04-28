import { NavLink } from 'react-router-dom'
import { useStore } from '../store/useStore'

const NAV = [
  { to: '/',          icon: '◈', label: 'Dashboard'    },
  { to: '/deposit',   icon: '⊕', label: 'Deposit'      },
  { to: '/portfolio', icon: '◉', label: 'Portfolio'    },
  { to: '/signals',   icon: '⚡', label: 'AI Signals'  },
  { to: '/trades',    icon: '⇄', label: 'Trade History'},
  { to: '/market',    icon: '◎', label: 'Market'       },
  { to: '/learn',     icon: '📚', label: 'Learn'       },
]

const STATUS_CONFIG = {
  idle:      { label: 'STANDBY',   color: '#00e676', pulse: false },
  analyzing: { label: 'ANALYZING', color: '#ffcc00', pulse: true  },
  trading:   { label: 'EXECUTING', color: '#00d9ff', pulse: true  },
}

export default function Sidebar() {
  const aiStatus = useStore(s => s.aiStatus)
  const sc = STATUS_CONFIG[aiStatus] || STATUS_CONFIG.idle

  return (
    <aside className="w-[210px] flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="font-display text-3xl tracking-wider text-white">
          ALPHA<span className="text-accent">BOT</span>
        </div>
        <div className="font-mono text-[9px] text-muted tracking-[3px] mt-1">AI TRADING ENGINE</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-[10px] text-[13px] font-semibold tracking-wide transition-all border-l-2 my-0.5
              ${isActive
                ? 'text-accent border-accent bg-accent/5'
                : 'text-muted border-transparent hover:text-white hover:bg-white/3'}`
            }
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* AI Status Badge */}
      <div className="mx-4 mb-5 rounded-lg border border-accent2/30 bg-gradient-to-br from-accent2/10 to-accent/5 p-3 text-center">
        <div className="font-mono text-[9px] tracking-[2px] text-muted mb-2">AI ENGINE</div>
        <div className="flex items-center justify-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: sc.color,
              boxShadow: `0 0 8px ${sc.color}`,
              animation: sc.pulse ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span className="font-mono text-[12px] font-bold" style={{ color: sc.color }}>
            {sc.label}
          </span>
        </div>
      </div>
    </aside>
  )
}