import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend
} from 'recharts'
import { useStore } from '../store/useStore'

const PERIODS = [
  { label: '1D',  value: '1d'  },
  { label: '5D',  value: '5d'  },
  { label: '1M',  value: '1mo' },
  { label: '3M',  value: '3mo' },
  { label: '6M',  value: '6mo' },
  { label: '1Y',  value: '1y'  },
  { label: '2Y',  value: '2y'  },
  { label: '5Y',  value: '5y'  },
  { label: 'MAX', value: 'max' },
]

function fmt(n, dec = 2) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function fmtCr(n) {
  if (!n) return '—'
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}L Cr`
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)} Cr`
  return `₹${n.toLocaleString('en-IN')}`
}
function fmtVol(n) {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  return n.toLocaleString('en-IN')
}

const PriceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: '#080e1c', border: '1px solid #162035', borderRadius: 8,
      padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      zIndex: 9999,
    }}>
      <div style={{ color: '#4a607a', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
        <span style={{ color: '#4a607a' }}>O</span><span style={{ color: '#e2f0ff' }}>₹{fmt(d?.open)}</span>
        <span style={{ color: '#4a607a' }}>H</span><span style={{ color: '#00e676' }}>₹{fmt(d?.high)}</span>
        <span style={{ color: '#4a607a' }}>L</span><span style={{ color: '#ff3366' }}>₹{fmt(d?.low)}</span>
        <span style={{ color: '#4a607a' }}>C</span><span style={{ color: '#00d9ff' }}>₹{fmt(d?.close)}</span>
        <span style={{ color: '#4a607a' }}>Vol</span><span style={{ color: '#e2f0ff' }}>{fmtVol(d?.volume)}</span>
      </div>
    </div>
  )
}

const RsiTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{
      background: '#080e1c', border: '1px solid #162035', borderRadius: 8,
      padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11
    }}>
      <div style={{ color: '#4a607a' }}>{label}</div>
      <div style={{
        color: val > 70 ? '#ff3366' : val < 30 ? '#00e676' : '#ffcc00',
        fontWeight: 700, marginTop: 4
      }}>
        RSI: {typeof val === 'number' ? val.toFixed(1) : '—'}
      </div>
    </div>
  )
}

export default function StockModal({ symbol, onClose }) {
  const [data,    setData]    = useState(null)
  const [period,  setPeriod]  = useState('1y')
  const [loading, setLoading] = useState(true) // Start with true for initial load
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('price')
  const abortRef = useRef(null)
  
  const { stockCache, setStockCache } = useStore()

  const fetchData = useCallback(async (sym, per) => {
    // Check cache first
    const cacheKey = `${sym}:${per}`
    const cached = stockCache[cacheKey]
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const url = `/api/stock?symbol=${encodeURIComponent(sym)}&period=${per}`
      const res = await fetch(url, { signal: abortRef.current.signal })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text.slice(0, 200))
        throw new Error('Backend returned HTML — is Flask running on port 5000?')
      }

      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setData(json)
      setStockCache(cacheKey, json) // Cache the result
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [stockCache, setStockCache])

  // Initial fetch and period change
  useEffect(() => {
    if (!symbol) return
    fetchData(symbol, period)
  }, [symbol, period, fetchData])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!symbol) return
    const interval = setInterval(() => {
      // Only refresh if visible (check if modal is open)
      if (document.querySelector('[data-stock-modal]')) {
        fetchData(symbol, period)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [symbol, period, fetchData])

  // Close on ESC
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!symbol) return null

  const isUp       = data ? data.change_pct >= 0 : true
  const priceColor = isUp ? '#00e676' : '#ff3366'
  const gradId     = `price-grad-${symbol.replace(/[^a-z0-9]/gi, '')}`
  const candles    = data?.candles || []

  const showEvery = Math.max(1, Math.floor(candles.length / 8))
  const xTickFmt  = (v, i) => (i % showEvery === 0 ? (v || '').slice(0, 10) : '')

  return (
    <div
      data-stock-modal
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(3,6,15,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#080e1c',
        border: '1px solid #1e2f48',
        borderRadius: 16,
        width: '100%', maxWidth: 1100,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,217,255,0.08)',
      }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #162035',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0, minHeight: 100,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 30,
                letterSpacing: 2, color: '#e2f0ff',
              }}>
                {symbol.replace('.NS', '').replace('^', '')}
              </span>
              
              {data?.sector && (
                <span style={{
                  background: 'rgba(0,217,255,0.1)', color: '#00d9ff',
                  border: '1px solid rgba(0,217,255,0.25)',
                  borderRadius: 6, padding: '2px 10px',
                  fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: 1,
                }}>
                  {data.sector}
                </span>
              )}
              <div style={{ color: loading ? '#ffcc00' : '#00e676', fontSize: 12 }}>
                {loading ? '● LOADING' : '● LIVE'}
              </div>
            </div>
            <div style={{ color: '#4a607a', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              {data?.name || symbol}
            </div>
          </div>

          {/* Price block or skeleton */}
          {data ? (
            <div style={{ textAlign: 'right', marginRight: 44 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 34, fontWeight: 700, color: '#e2f0ff', lineHeight: 1,
              }}>
                ₹{fmt(data.current)}
                <span style={{ fontSize: 14, color: '#4a607a', marginLeft: 8 }}>INR</span>
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 15, marginTop: 7, color: priceColor, fontWeight: 700,
              }}>
                {isUp ? '▲' : '▼'} ₹{fmt(Math.abs(data.change))}
                &nbsp;({isUp ? '+' : ''}{fmt(data.change_pct)}%)
                <span style={{ fontSize: 11, color: '#4a607a', fontWeight: 400, marginLeft: 10 }}>today</span>
              </div>
              <div style={{
                color: '#4a607a', fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace', marginTop: 5,
              }}>
                Range: ₹{fmt(data.low)} – ₹{fmt(data.high)}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'right', marginRight: 44 }}>
              <div style={{ height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 8, width: 140 }} />
              <div style={{ height: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: 120 }} />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #1e2f48',
              borderRadius: 8, color: '#4a607a',
              fontSize: 20, cursor: 'pointer',
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2f0ff'; e.currentTarget.style.borderColor = '#00d9ff' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4a607a'; e.currentTarget.style.borderColor = '#1e2f48' }}
          >×</button>
        </div>

        {/* ── Stats bar (lazy loaded) ─────────────────────────────── */}
        {data && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
            gap: 1, background: '#0d1628', flexShrink: 0,
          }}>
            {[
              { label: 'OPEN',     val: `₹${fmt(data.open)}` },
              { label: 'HIGH',     val: `₹${fmt(data.high)}`,          color: '#00e676' },
              { label: 'LOW',      val: `₹${fmt(data.low)}`,           color: '#ff3366' },
              { label: '52W HIGH', val: `₹${fmt(data.week52_high)}` },
              { label: '52W LOW',  val: `₹${fmt(data.week52_low)}` },
              { label: 'MKT CAP', val: fmtCr(data.market_cap) },
              { label: 'P/E',     val: data.pe_ratio ? fmt(data.pe_ratio) : '—' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#080e1c', padding: '10px 14px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9, letterSpacing: 2, color: '#4a607a', marginBottom: 5,
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13, fontWeight: 700, color: s.color || '#e2f0ff',
                }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar: period + chart type ──────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', borderBottom: '1px solid #162035',
          background: '#080e1c', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                disabled={loading}
                style={{
                  padding: '5px 13px', borderRadius: 6, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.12s',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11, fontWeight: 700,
                  background: period === p.value ? '#00d9ff' : 'rgba(255,255,255,0.05)',
                  color: period === p.value ? '#000' : '#4a607a',
                  boxShadow: period === p.value ? '0 0 12px rgba(0,217,255,0.4)' : 'none',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'price',  label: '📈 Price + SMA' },
              { id: 'rsi',    label: '📊 RSI'         },
              { id: 'volume', label: '📦 Volume'       },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  transition: 'all 0.12s',
                  background: tab === t.id ? 'rgba(0,217,255,0.1)' : 'transparent',
                  border: tab === t.id ? '1px solid rgba(0,217,255,0.35)' : '1px solid #162035',
                  color: tab === t.id ? '#00d9ff' : '#4a607a',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chart area ────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 400, padding: '16px 8px 8px', position: 'relative' }}>

          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 12,
              color: '#4a607a', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
              background: candles.length === 0 ? 'transparent' : 'rgba(8,14,28,0.4)',
              backdropFilter: candles.length === 0 ? 'none' : 'blur(2px)',
            }}>
              <div style={{
                width: 18, height: 18,
                border: '2px solid #162035', borderTopColor: '#00d9ff',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
              <span>Fetching {period.toUpperCase()} data...</span>
            </div>
          )}

          {!loading && error && (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>⚠</div>
              <div style={{ color: '#ff3366', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
                {error}
              </div>
              <button
                onClick={() => fetchData(symbol, period)}
                style={{
                  marginTop: 8, padding: '8px 20px', borderRadius: 8,
                  background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)',
                  color: '#00d9ff', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,217,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,217,255,0.1)'}
              >
                ↻ Retry
              </button>
            </div>
          )}
          
          {!loading && !error && candles.length > 0 && (
            <>
              {tab === 'price' && (
                <ResponsiveContainer width="100%" height={420}>
                  <AreaChart data={candles} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={priceColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={priceColor} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#0d1628" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={xTickFmt}
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v}`}
                      axisLine={false} tickLine={false} width={64}
                    />
                    <Tooltip content={<PriceTooltip />} />
                    <Area
                      type="monotone" dataKey="close"
                      stroke={priceColor} strokeWidth={1.8}
                      fill={`url(#${gradId})`}
                      dot={false}
                    />
                    <Line
                      type="monotone" dataKey="sma20"
                      stroke="#00d9ff" strokeWidth={1.2}
                      dot={false} strokeDasharray="5 3" connectNulls
                    />
                    <Line
                      type="monotone" dataKey="sma50"
                      stroke="#ffcc00" strokeWidth={1.2}
                      dot={false} strokeDasharray="5 3" connectNulls
                    />
                    <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10, paddingTop: 8, color: '#4a607a' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {tab === 'rsi' && (
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={candles} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#0d1628" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={xTickFmt}
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 20, 30, 50, 70, 80, 100]}
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} width={36}
                    />
                    <Tooltip content={<RsiTooltip />} />
                    <ReferenceLine y={70} stroke="#ff3366" strokeDasharray="4 2" strokeWidth={1}
                      label={{ value: 'Overbought 70', fill: '#ff3366', fontSize: 10, fontFamily: 'JetBrains Mono', position: 'insideTopRight' }} />
                    <ReferenceLine y={30} stroke="#00e676" strokeDasharray="4 2" strokeWidth={1}
                      label={{ value: 'Oversold 30', fill: '#00e676', fontSize: 10, fontFamily: 'JetBrains Mono', position: 'insideBottomRight' }} />
                    <ReferenceLine y={50} stroke="#4a607a" strokeDasharray="2 4" strokeWidth={1} />
                    <Line
                      type="monotone" dataKey="rsi"
                      stroke="#ffcc00" strokeWidth={2}
                      dot={false} connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {tab === 'volume' && (
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={candles} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#0d1628" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={xTickFmt}
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#4a607a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={fmtVol}
                      axisLine={false} tickLine={false} width={56}
                    />
                    <Tooltip
                      formatter={(v) => [fmtVol(v), 'Volume']}
                      contentStyle={{
                        background: '#080e1c', border: '1px solid #162035',
                        borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 11,
                      }}
                      labelStyle={{ color: '#4a607a' }}
                    />
                    <Bar dataKey="volume" fill="#6236ff" opacity={0.75} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
