import { useState } from 'react'
import { useStore } from '../store/useStore'
import { usePortfolio } from '../hooks/usePortfolio'

const PRESETS = [5000, 10000, 25000, 50000, 100000]

export default function Deposit() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const deposits = useStore(s => s.deposits)
  const { deposit } = usePortfolio()

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return
    setLoading(true)
    const ok = await deposit(Number(amount))
    if (ok) setAmount('')
    setLoading(false)
  }

  const totalDeposited = deposits.reduce((acc, d) => acc + d.amount, 0)

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl tracking-wider text-white">FUND YOUR AGENT</h2>
        <p className="text-muted text-sm mt-1">Deposit INR — AI invests automatically</p>
      </div>

      {/* Deposit card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-5">DEPOSIT FUNDS</div>

        <p className="text-sm text-muted leading-relaxed mb-5">
          Your capital is allocated across Nifty 50 stocks using RSI, MACD, and Bollinger Band signals.
          The AI runs a full analysis cycle immediately after deposit.
        </p>

        {/* Quick preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border
                ${amount === String(p)
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface2 border-border text-muted hover:border-accent/50 hover:text-white'}`}
            >
              ₹{p.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted text-lg">₹</span>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDeposit()}
              className="w-full bg-surface2 border border-border rounded-xl pl-8 pr-4 py-3.5 font-mono text-lg text-white outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={handleDeposit}
            disabled={loading || !amount}
            className="px-6 rounded-xl font-bold text-sm text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#00d9ff', boxShadow: '0 4px 20px rgba(0,217,255,0.3)' }}
          >
            {loading ? '...' : 'Deposit & Invest'}
          </button>
        </div>

        <div className="font-mono text-[10px] text-muted mt-3 flex items-center gap-1.5">
          <span className="text-accent">⚡</span>
          AI analysis begins immediately — takes ~60 seconds to complete
        </div>
      </div>

      {/* Deposit history */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase">DEPOSIT HISTORY</div>
          {deposits.length > 0 && (
            <div className="font-mono text-xs text-accent">
              Total: ₹{totalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {deposits.length === 0 ? (
          <div className="text-center py-8 text-muted font-mono text-sm">No deposits yet</div>
        ) : (
          <div className="space-y-1">
            {deposits.map(d => (
              <div key={d.id} className="flex items-center justify-between py-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">₹</div>
                  <div>
                    <div className="text-white text-sm font-semibold">
                      ₹{d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="font-mono text-xs text-muted">{new Date(d.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <span className="font-mono text-xs text-success bg-success/10 px-2 py-0.5 rounded">CONFIRMED</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}