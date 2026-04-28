import { useStore } from '../store/useStore'
import { usePortfolio } from '../hooks/usePortfolio'
import SignalCard from '../components/SignalCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useMemo } from 'react'
export default function Signals() {
    
  const signals = useStore(s => s.signals)
  const signalsTimestamp = useStore(s => s.signalsTimestamp)
  const aiStatus = useStore(s => s.aiStatus)
  const { runAI, fetchSignals } = usePortfolio()

const { buys, sells, holds } = useMemo(() => {
  return {
    buys: signals.filter(s => s.action === 'BUY'),
    sells: signals.filter(s => s.action === 'SELL'),
    holds: signals.filter(s => s.action === 'HOLD'),
  }
}, [signals])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white">AI SIGNALS</h2>
          {signalsTimestamp && (
            <p className="text-muted text-sm mt-1">
              Last analyzed: {new Date(signalsTimestamp).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSignals}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-surface2 border border-border text-muted hover:text-white hover:border-accent/50 transition-all"
          >
            ↻ Refresh
          </button>
          <button
            onClick={runAI}
            disabled={aiStatus !== 'idle'}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#00d9ff', boxShadow: aiStatus === 'idle' ? '0 4px 16px rgba(0,217,255,0.3)' : 'none' }}
          >
            {aiStatus === 'idle' ? '⚡ New Analysis' : `AI ${aiStatus}...`}
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {signals.length > 0 && (
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20 font-mono text-xs text-success">
            {buys.length} BUY signals
          </div>
          <div className="px-4 py-2 rounded-lg bg-danger/10 border border-danger/20 font-mono text-xs text-danger">
            {sells.length} SELL signals
          </div>
          <div className="px-4 py-2 rounded-lg bg-surface2 border border-border font-mono text-xs text-muted">
            {holds.length} HOLD
          </div>
        </div>
      )}

      {aiStatus !== 'idle' && (
        <LoadingSpinner text={`AI is ${aiStatus} market data — ~60 seconds`} />
      )}

      {signals.length === 0 && aiStatus === 'idle' ? (
        <EmptyState icon="🤖" title="No signals yet" text="Deposit funds or click 'New Analysis' to trigger the AI engine" />
      ) : (
        <>
          {buys.length > 0 && (
            <div>
              <div className="font-mono text-[10px] tracking-[2px] text-success uppercase mb-3">● BUY SIGNALS</div>
              <div className="grid grid-cols-3 gap-3">
                {buys.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </div>
          )}
          {sells.length > 0 && (
            <div>
              <div className="font-mono text-[10px] tracking-[2px] text-danger uppercase mb-3">● SELL SIGNALS</div>
              <div className="grid grid-cols-3 gap-3">
                {sells.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </div>
          )}
          {holds.length > 0 && (
            <div>
              <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-3">● HOLD</div>
              <div className="grid grid-cols-3 gap-3">
                {holds.map(s => <SignalCard key={s.symbol} signal={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}