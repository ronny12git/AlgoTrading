import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "alphabot.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY,
            cash REAL DEFAULT 0,
            total_deposited REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS holdings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL UNIQUE,
            name TEXT,
            shares REAL DEFAULT 0,
            avg_price REAL DEFAULT 0,
            current_price REAL DEFAULT 0,
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            symbol TEXT NOT NULL,
            name TEXT,
            shares REAL,
            price REAL,
            total REAL,
            reason TEXT,
            timestamp TEXT DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS deposits (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            timestamp TEXT DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS ai_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            name TEXT,
            action TEXT,
            score REAL,
            confidence REAL,
            current_price REAL,
            rsi REAL,
            macd_histogram REAL,
            bb_position REAL,
            volume_ratio REAL,
            momentum_5d REAL,
            timestamp TEXT DEFAULT (datetime('now'))
        )
    """)

    # Seed portfolio row if missing
    c.execute("SELECT COUNT(*) FROM portfolio")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO portfolio (id, cash, total_deposited) VALUES (1, 0, 0)")

    conn.commit()
    conn.close()

# ── Portfolio ─────────────────────────────────────────────────────────────────
def get_portfolio():
    conn = get_conn()
    row = conn.execute("SELECT * FROM portfolio WHERE id=1").fetchone()
    conn.close()
    return dict(row) if row else {"cash": 0, "total_deposited": 0}

def update_cash(delta):
    conn = get_conn()
    conn.execute("UPDATE portfolio SET cash = cash + ? WHERE id=1", (delta,))
    conn.commit()
    conn.close()

def set_cash(value):
    conn = get_conn()
    conn.execute("UPDATE portfolio SET cash = ? WHERE id=1", (value,))
    conn.commit()
    conn.close()

def add_deposited(amount):
    conn = get_conn()
    conn.execute("UPDATE portfolio SET total_deposited = total_deposited + ? WHERE id=1", (amount,))
    conn.commit()
    conn.close()

# ── Holdings ──────────────────────────────────────────────────────────────────
def get_holdings():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM holdings WHERE shares > 0").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def upsert_holding(symbol, name, shares, avg_price, current_price):
    conn = get_conn()
    conn.execute("""
        INSERT INTO holdings (symbol, name, shares, avg_price, current_price, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(symbol) DO UPDATE SET
            name=excluded.name,
            shares=excluded.shares,
            avg_price=excluded.avg_price,
            current_price=excluded.current_price,
            updated_at=excluded.updated_at
    """, (symbol, name, shares, avg_price, current_price))
    conn.commit()
    conn.close()

def delete_holding(symbol):
    conn = get_conn()
    conn.execute("DELETE FROM holdings WHERE symbol=?", (symbol,))
    conn.commit()
    conn.close()

def get_holding(symbol):
    conn = get_conn()
    row = conn.execute("SELECT * FROM holdings WHERE symbol=?", (symbol,)).fetchone()
    conn.close()
    return dict(row) if row else None

def update_holding_price(symbol, price):
    conn = get_conn()
    conn.execute("UPDATE holdings SET current_price=?, updated_at=datetime('now') WHERE symbol=?", (price, symbol))
    conn.commit()
    conn.close()

# ── Transactions ──────────────────────────────────────────────────────────────
def add_transaction(tx_id, tx_type, symbol, name, shares, price, total, reason):
    conn = get_conn()
    conn.execute("""
        INSERT INTO transactions (id, type, symbol, name, shares, price, total, reason, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (tx_id, tx_type, symbol, name, shares, price, total, reason))
    conn.commit()
    conn.close()

def get_transactions(limit=50):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Deposits ──────────────────────────────────────────────────────────────────
def add_deposit(dep_id, amount):
    conn = get_conn()
    conn.execute("INSERT INTO deposits (id, amount, timestamp) VALUES (?, ?, datetime('now'))", (dep_id, amount))
    conn.commit()
    conn.close()

def get_deposits():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM deposits ORDER BY timestamp DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── AI Signals ────────────────────────────────────────────────────────────────
def save_signals(signals):
    conn = get_conn()
    conn.execute("DELETE FROM ai_signals")
    for s in signals:
        conn.execute("""
            INSERT INTO ai_signals
            (symbol, name, action, score, confidence, current_price, rsi, macd_histogram, bb_position, volume_ratio, momentum_5d, timestamp)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
        """, (s["symbol"], s["name"], s["action"], s["score"], s["confidence"],
              s["current_price"], s["rsi"], s.get("macd_histogram",0),
              s.get("bb_position",50), s.get("volume_ratio",1), s.get("momentum_5d",0)))
    conn.commit()
    conn.close()

def get_signals():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM ai_signals ORDER BY score DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_last_signal_time():
    conn = get_conn()
    row = conn.execute("SELECT MAX(timestamp) as ts FROM ai_signals").fetchone()
    conn.close()
    return row["ts"] if row else None