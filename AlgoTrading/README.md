# AlphaBot — AI Algo Trading Platform

Full-stack AI trading platform with React+Vite frontend, Python/Flask backend, SQLite3 database.

## Project Structure

```
alphabot/
├── backend/
│   ├── app.py           # Flask API server (main entry)
│   ├── database.py      # SQLite3 ORM layer (all DB operations)
│   ├── ai_engine.py     # AI signal computation (RSI, MACD, Bollinger)
│   ├── requirements.txt
│   └── alphabot.db      # SQLite3 database (auto-created)
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx         # Navigation sidebar
    │   │   ├── Topbar.jsx          # Header with live indices
    │   │   ├── StatCard.jsx        # Metric display card
    │   │   ├── SignalCard.jsx      # AI signal display card
    │   │   ├── HoldingsTable.jsx   # Portfolio holdings table
    │   │   ├── AllocationChart.jsx # Pie chart allocation
    │   │   ├── TransactionList.jsx # Trade history list
    │   │   ├── Toast.jsx           # Toast notifications
    │   │   ├── LoadingSpinner.jsx  # Loading state
    │   │   └── EmptyState.jsx      # Empty state placeholder
    │   ├── pages/
    │   │   ├── Dashboard.jsx  # Overview + stats
    │   │   ├── Deposit.jsx    # Fund your AI agent
    │   │   ├── Portfolio.jsx  # Holdings + allocation
    │   │   ├── Signals.jsx    # AI signal cards
    │   │   ├── Trades.jsx     # Full trade history
    │   │   └── Market.jsx     # Live indices + watchlist
    │   ├── hooks/
    │   │   ├── usePortfolio.js  # Portfolio data + actions
    │   │   └── useMarket.js     # Market data fetching
    │   ├── services/
    │   │   └── api.js           # Axios API layer
    │   ├── store/
    │   │   └── useStore.js      # Zustand global state
    │   ├── App.jsx              # Router + layout
    │   └── main.jsx             # Entry point
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Setup

### Backend
```bash
cd backend
pip install flask flask-cors yfinance pandas numpy
python app.py
# → http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## SQLite3 Database Tables

| Table          | Purpose                            |
|----------------|------------------------------------|
| `portfolio`    | Cash balance + total deposited     |
| `holdings`     | Active stock positions             |
| `transactions` | All buy/sell records               |
| `deposits`     | Deposit history                    |
| `ai_signals`   | Latest AI analysis results         |

## AI Engine: How Signals Work

Each stock scored -100 to +100 using:

| Indicator       | BUY Signal           | SELL Signal          | Weight |
|-----------------|----------------------|----------------------|--------|
| RSI (14)        | RSI < 30 (oversold)  | RSI > 70 (overbought)| ±35    |
| MACD Histogram  | Histogram > 0        | Histogram < 0        | ±25    |
| Bollinger Bands | Price < lower band   | Price > upper band   | ±25    |
| Volume Ratio    | High vol confirms    | High vol confirms    | ±15    |
| 5-day Momentum  | Positive momentum    | Negative momentum    | ±15    |

**Score ≥ 30** → BUY | **Score ≤ -30** → SELL | Otherwise → HOLD

## Trade Execution Logic

1. Runs SELL orders first to free up cash
2. Allocates remaining cash to top 5 BUY signals
3. Allocation = proportional to signal score
4. Reserves 15% as cash buffer

## Free APIs Used

- **yfinance** — NSE/BSE real-time data via Yahoo Finance
- No API key required
