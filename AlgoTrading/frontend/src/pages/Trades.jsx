import { useEffect, useState } from 'react'
import { portfolioApi } from '../services/api'
import { useStore } from '../store/useStore'
import TransactionList from '../components/TransactionList'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Trades() {
  const transactions = useStore(s => s.transactions)
  const setTransactions = useStore(s => s.setTransactions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    portfolioApi.transactions(100)
      .then(data => setTransactions(data.transactions || []))
      .finally(() => setLoading(false))
  }, [])

  const buyCount  = transactions.filter(t => t.type === 'BUY').length
  const sellCount = transactions.filter(t => t.type === 'SELL').length
  const buyVolume = transactions.filter(t => t.type === 'BUY').reduce((a, t) => a + t.total, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white">TRADE HISTORY</h2>
          <p className="text-muted text-sm mt-1">All AI-executed orders</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-center">
            <div className="font-mono text-[9px] tracking-widest text-muted">BUYS</div>
            <div className="font-mono text-base font-bold text-success">{buyCount}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-center">
            <div className="font-mono text-[9px] tracking-widest text-muted">SELLS</div>
            <div className="font-mono text-base font-bold text-danger">{sellCount}</div>
          </div>
          <div className="bg-surface border border-border rounded-lg px-4 py-2 text-center">
            <div className="font-mono text-[9px] tracking-widest text-muted">BUY VOL</div>
            <div className="font-mono text-base font-bold text-accent">₹{(buyVolume/1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-4">ALL TRANSACTIONS</div>
        {loading
          ? <LoadingSpinner />
          : <TransactionList transactions={transactions} showReason={true} />
        }
      </div>
    </div>
  )
}