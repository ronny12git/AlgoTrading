from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
import threading
import logging
from database import (
    init_db, get_portfolio, update_cash, add_deposited,
    get_holdings, upsert_holding, delete_holding, get_holding, update_holding_price,
    add_transaction, get_transactions,
    add_deposit, get_deposits,
    save_signals, get_signals, get_last_signal_time,
)
from ai_engine import run_full_analysis, get_index_data, get_watchlist_prices, get_live_price

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

ai_status = {"state": "idle"}
ai_lock = threading.Lock()

init_db()
logger.info("Database initialized ✓")


# ── AI Trading Cycle ──────────────────────────────────────────────────────────
def ai_trading_cycle():
    global ai_status
    with ai_lock:
        if ai_status["state"] != "idle":
            logger.warning("AI already running, skipping.")
            return
        ai_status["state"] = "analyzing"

    try:
        logger.info("AI: Starting full analysis cycle...")
        signals = run_full_analysis()
        save_signals(signals)
        logger.info(f"AI: Signals computed — {len(signals)} total")

        # Log all signals for debugging
        for s in signals:
            logger.info(f"  {s['action']:4s} {s['symbol']:20s} score={s['score']:+6.1f}  conf={s['confidence']:.1f}%  RSI={s['rsi']}")

        with ai_lock:
            ai_status["state"] = "trading"

        pf = get_portfolio()
        available_cash = pf["cash"]
        logger.info(f"AI: Available cash = ₹{available_cash:.2f}")

        if available_cash < 100:
            logger.info("AI: Cash < ₹100, skipping trade execution.")
            return

        # ── SELL phase ────────────────────────────────────────────────────────
        sells = [s for s in signals if s["action"] == "SELL"]
        logger.info(f"AI: {len(sells)} SELL signals to process")

        for sig in sells:
            holding = get_holding(sig["symbol"])
            if holding and holding["shares"] > 0:
                price = sig["current_price"]
                proceeds = holding["shares"] * price
                update_cash(proceeds)
                delete_holding(sig["symbol"])
                tx_id = str(uuid.uuid4())[:8]
                add_transaction(
                    tx_id, "SELL", sig["symbol"], sig["name"],
                    round(holding["shares"], 4), price, round(proceeds, 2),
                    f"AI SELL | Score:{sig['score']} RSI:{sig['rsi']} Conf:{sig['confidence']}%"
                )
                logger.info(f"AI: SOLD {holding['shares']:.4f} × {sig['symbol']} @ ₹{price} → ₹{proceeds:.2f}")

        # Reload cash after sells
        pf = get_portfolio()
        available_cash = pf["cash"]

        # ── BUY phase ─────────────────────────────────────────────────────────
        # FIX: Removed confidence > 55 gate — use all BUY signals by score
        buys = [s for s in signals if s["action"] == "BUY"]
        buys = sorted(buys, key=lambda x: x["score"], reverse=True)[:5]  # Top 5 by score
        logger.info(f"AI: {len(buys)} BUY signals to process, cash=₹{available_cash:.2f}")

        if not buys:
            logger.info("AI: No BUY signals found this cycle.")
            return

        if available_cash < 100:
            logger.info("AI: Not enough cash to buy.")
            return

        # Allocate proportionally to score, reserve 10% cash buffer
        total_score = sum(b["score"] for b in buys)
        if total_score <= 0:
            logger.info("AI: Total score is 0, skipping buys.")
            return

        invest_cash = available_cash * 0.90  # invest 90%, keep 10% liquid
        logger.info(f"AI: Investing ₹{invest_cash:.2f} across {len(buys)} stocks")

        for sig in buys:
            weight = sig["score"] / total_score
            alloc = invest_cash * weight
            if alloc < 50:
                logger.info(f"  SKIP {sig['symbol']}: alloc ₹{alloc:.2f} < ₹50")
                continue

            price = sig["current_price"]
            if price <= 0:
                logger.warning(f"  SKIP {sig['symbol']}: invalid price {price}")
                continue

            shares = alloc / price
            cost = shares * price

            # Check we still have enough cash
            pf_now = get_portfolio()
            if pf_now["cash"] < cost:
                logger.warning(f"  SKIP {sig['symbol']}: need ₹{cost:.2f} but only ₹{pf_now['cash']:.2f} left")
                continue

            existing = get_holding(sig["symbol"])
            if existing and existing["shares"] > 0:
                new_shares = existing["shares"] + shares
                new_avg = (existing["shares"] * existing["avg_price"] + cost) / new_shares
                upsert_holding(sig["symbol"], sig["name"], new_shares, round(new_avg, 2), price)
            else:
                upsert_holding(sig["symbol"], sig["name"], shares, price, price)

            update_cash(-cost)
            tx_id = str(uuid.uuid4())[:8]
            add_transaction(
                tx_id, "BUY", sig["symbol"], sig["name"],
                round(shares, 4), price, round(cost, 2),
                f"AI BUY | Score:{sig['score']} RSI:{sig['rsi']} Conf:{sig['confidence']}% Alloc:₹{alloc:.0f}"
            )
            logger.info(f"AI: BOUGHT {shares:.4f} × {sig['symbol']} @ ₹{price} cost=₹{cost:.2f}")

    except Exception as e:
        logger.error(f"AI cycle ERROR: {e}", exc_info=True)
    finally:
        with ai_lock:
            ai_status["state"] = "idle"
        logger.info("AI: Cycle complete.")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/deposit", methods=["POST"])
def deposit():
    data = request.get_json()
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400
    if amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400

    update_cash(amount)
    add_deposited(amount)
    dep_id = str(uuid.uuid4())[:8]
    add_deposit(dep_id, amount)
    logger.info(f"Deposited ₹{amount:.2f}")

    # Start AI in background
    t = threading.Thread(target=ai_trading_cycle, daemon=True)
    t.start()
    return jsonify({"success": True, "message": f"₹{amount:,.2f} deposited! AI analysis started."})


@app.route("/api/portfolio")
def portfolio():
    pf = get_portfolio()
    holdings = get_holdings()

    total_invested = 0
    total_current = 0
    enriched = []

    for h in holdings:
        # Try to get live price; fall back to stored price
        live = get_live_price(h["symbol"])
        if live and live > 0:
            update_holding_price(h["symbol"], live)
            h["current_price"] = live

        cp = h.get("current_price") or h.get("avg_price") or 0
        invested = h["shares"] * h["avg_price"]
        current_val = h["shares"] * cp
        pnl = current_val - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0

        enriched.append({
            **h,
            "current_price": round(cp, 2),
            "invested": round(invested, 2),
            "current_value": round(current_val, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
        })
        total_invested += invested
        total_current += current_val

    portfolio_value = total_current + pf["cash"]
    overall_pnl = portfolio_value - pf["total_deposited"]
    overall_pnl_pct = (overall_pnl / pf["total_deposited"] * 100) if pf["total_deposited"] > 0 else 0

    return jsonify({
        "cash": round(pf["cash"], 2),
        "total_deposited": round(pf["total_deposited"], 2),
        "portfolio_value": round(portfolio_value, 2),
        "holdings_value": round(total_current, 2),
        "holdings_pnl": round(total_current - total_invested, 2),
        "overall_pnl": round(overall_pnl, 2),
        "overall_pnl_pct": round(overall_pnl_pct, 2),
        "holdings": enriched,
        "ai_status": ai_status["state"],
    })


@app.route("/api/transactions")
def transactions():
    limit = int(request.args.get("limit", 50))
    return jsonify({"transactions": get_transactions(limit)})


@app.route("/api/deposits")
def deposits():
    return jsonify({"deposits": get_deposits()})


@app.route("/api/signals")
def signals():
    sigs = get_signals()
    ts = get_last_signal_time()
    return jsonify({"signals": sigs, "timestamp": ts})


@app.route("/api/run-ai", methods=["POST"])
def run_ai():
    with ai_lock:
        if ai_status["state"] != "idle":
            return jsonify({"message": f"AI is already {ai_status['state']}. Please wait."})
    t = threading.Thread(target=ai_trading_cycle, daemon=True)
    t.start()
    return jsonify({"message": "AI analysis started! Check back in ~60 seconds."})


@app.route("/api/market/indices")
def market_indices():
    return jsonify({"indices": get_index_data()})


@app.route("/api/market/watchlist")
def market_watchlist():
    return jsonify({"stocks": get_watchlist_prices()})


@app.route("/api/ai-status")
def get_ai_status():
    return jsonify({"status": ai_status["state"]})


@app.route("/api/debug/portfolio")
def debug_portfolio():
    """Debug endpoint to inspect raw DB state."""
    pf = get_portfolio()
    holdings = get_holdings()
    txs = get_transactions(10)
    sigs = get_signals()
    return jsonify({
        "portfolio_row": dict(pf),
        "holdings_count": len(holdings),
        "holdings": holdings,
        "recent_transactions": txs,
        "signals_count": len(sigs),
        "buy_signals": [s for s in sigs if s["action"] == "BUY"],
        "ai_status": ai_status["state"],
    })

@app.route("/api/stock")
def stock_detail():
    """Full historical OHLCV + technicals for a given symbol.
    Usage: GET /api/stock?symbol=RELIANCE.NS&period=1y
    """
    try:
        import yfinance as yf
        import pandas as pd

        symbol = request.args.get("symbol", "").strip()
        if not symbol:
            return jsonify({"error": "symbol parameter required"}), 400
        # Auto-append .NS if missing (NSE stocks)
        if "." not in symbol and "^" not in symbol:
            symbol = symbol + ".NS"
        period = request.args.get("period", "1y")   # 1d 5d 1mo 3mo 6mo 1y 2y 5y max
        ticker = yf.Ticker(symbol)

        # Choose interval based on period
        interval_map = {
            "1d":  "5m",
            "5d":  "15m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y":  "1d",
            "2y":  "1wk",
            "5y":  "1wk",
            "max": "1mo",
        }
        interval = interval_map.get(period, "1d")
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return jsonify({"error": "No data available"}), 404

        # Build OHLCV list
        candles = []
        for dt, row in hist.iterrows():
            candles.append({
                "time":   dt.strftime("%Y-%m-%d %H:%M") if interval in ("5m","15m") else dt.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]),  2),
                "high":   round(float(row["High"]),  2),
                "low":    round(float(row["Low"]),   2),
                "close":  round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        # Compute RSI on close for chart overlay
        close = hist["Close"].astype(float)
        delta = close.diff()
        gain  = delta.clip(lower=0).rolling(14).mean()
        loss  = (-delta.clip(upper=0)).rolling(14).mean()
        rs    = gain / loss.replace(0, float("nan"))
        rsi_series = (100 - (100 / (1 + rs))).round(1)

        # SMA 20 & 50
        sma20 = close.rolling(20).mean().round(2)
        sma50 = close.rolling(50).mean().round(2)

        # Attach indicators to candles
        rsi_list  = rsi_series.tolist()
        sma20_list = sma20.tolist()
        sma50_list = sma50.tolist()
        for i, c in enumerate(candles):
            c["rsi"]   = None if (i >= len(rsi_list)  or pd.isna(rsi_list[i]))  else rsi_list[i]
            c["sma20"] = None if (i >= len(sma20_list) or pd.isna(sma20_list[i])) else sma20_list[i]
            c["sma50"] = None if (i >= len(sma50_list) or pd.isna(sma50_list[i])) else sma50_list[i]

        # Meta info
        info = ticker.info
        current  = round(float(close.iloc[-1]), 2)
        prev     = round(float(close.iloc[-2]), 2) if len(close) > 1 else current
        chg      = round(current - prev, 2)
        chg_pct  = round((chg / prev) * 100, 2) if prev else 0
        high_52  = info.get("fiftyTwoWeekHigh")
        low_52   = info.get("fiftyTwoWeekLow")
        mkt_cap  = info.get("marketCap")
        pe       = info.get("trailingPE")
        div_yield= info.get("dividendYield")
        avg_vol  = info.get("averageVolume")
        sector   = info.get("sector", "")
        long_name= info.get("longName", symbol)

        return jsonify({
            "symbol":       symbol,
            "name":         long_name,
            "sector":       sector,
            "current":      current,
            "change":       chg,
            "change_pct":   chg_pct,
            "open":         round(float(hist["Open"].iloc[-1]),  2),
            "high":         round(float(hist["High"].iloc[-1]),  2),
            "low":          round(float(hist["Low"].iloc[-1]),   2),
            "volume":       int(hist["Volume"].iloc[-1]),
            "week52_high":  round(float(high_52), 2) if high_52 else None,
            "week52_low":   round(float(low_52),  2) if low_52  else None,
            "market_cap":   mkt_cap,
            "pe_ratio":     round(float(pe), 2) if pe else None,
            "div_yield":    round(float(div_yield) * 100, 2) if div_yield else None,
            "avg_volume":   avg_vol,
            "candles":      candles,
            "period":       period,
            "interval":     interval,
        })
    except Exception as e:
        logger.error(f"stock_detail({symbol}): {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)