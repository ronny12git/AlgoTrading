import { create } from 'zustand'

export const useStore = create((set) => ({
  // Portfolio
  portfolio: null,
  setPortfolio: (data) => set({ portfolio: data }),

  // AI
  aiStatus: 'idle',
  setAiStatus: (s) => set({ aiStatus: s }),
  signals: [],
  signalsTimestamp: null,
  setSignals: (signals, ts) => set({ signals, signalsTimestamp: ts }),

  // Market
  indices: [],
  setIndices: (data) => set({ indices: data }),
  watchlist: [],
  setWatchlist: (data) => set({ watchlist: data }),

  // Transactions
  transactions: [],
  setTransactions: (data) => set({ transactions: data }),

  // Deposits
  deposits: [],
  setDeposits: (data) => set({ deposits: data }),

  // Toast
  toast: null,
  showToast: (msg, type = 'info') => {
    set({ toast: { msg, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 4000)
  },

  // Backend status
  backendOnline: null,
  setBackendOnline: (v) => set({ backendOnline: v }),

  // ── Stock Modal ──────────────────────────────────────────────────────────
  stockModalSymbol: null,
  openStockModal:  (symbol) => set({ stockModalSymbol: symbol }),
  closeStockModal: ()       => set({ stockModalSymbol: null  }),

  // Stock data cache (key: "symbol:period")
  stockCache: {},
  setStockCache: (key, data) => set((state) => ({ 
    stockCache: { ...state.stockCache, [key]: { data, timestamp: Date.now() } } 
  })),
}))