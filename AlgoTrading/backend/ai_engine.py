import yfinance as yf
import numpy as np
import logging
import time

logger = logging.getLogger(__name__)

WATCHLIST = {
    "RELIANCE.NS": "Reliance Industries",
    "TCS.NS":       "Tata Consultancy Services",
    "HDFCBANK.NS":  "HDFC Bank",
    "INFY.NS":      "Infosys",
    "ICICIBANK.NS": "ICICI Bank",
    "HINDUNILVR.NS":"Hindustan Unilever",
    "ITC.NS":       "ITC Limited",
    "SBIN.NS":      "State Bank of India",
    "BAJFINANCE.NS":"Bajaj Finance",
    "TATAMOTORS.NS":"Tata Motors",
    "WIPRO.NS":     "Wipro",
    "AXISBANK.NS":  "Axis Bank",
    "HCLTECH.NS":   "HCL Technologies",
    "SUNPHARMA.NS": "Sun Pharmaceutical",
    "MARUTI.NS":    "Maruti Suzuki",
    "LT.NS":        "Larsen & Toubro",
    "ASIANPAINT.NS":"Asian Paints",
    "ULTRACEMCO.NS":"UltraTech Cement",
    "NESTLEIND.NS": "Nestle India",
    "POWERGRID.NS": "Power Grid Corporation",
    "NTPC.NS":      "NTPC Limited",
    "COALINDIA.NS": "Coal India",
    "ONGC.NS":      "Oil & Natural Gas Corporation",
    "BPCL.NS":      "Bharat Petroleum",
    "TITAN.NS":     "Titan Company",
    "BAJAJFINSV.NS":"Bajaj Finserv",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "ADANIPORTS.NS":"Adani Ports",
    "EICHERMOT.NS": "Eicher Motors",
    "GRASIM.NS":    "Grasim Industries",
    "SHREECEM.NS":  "Shree Cement",
    "JSWSTEEL.NS":  "JSW Steel",
    "TATASTEEL.NS": "Tata Steel",
    "INDUSINDBK.NS":"IndusInd Bank",
    "BRITANNIA.NS": "Britannia Industries",
    "HEROMOTOCO.NS":"Hero MotoCorp",
    "TECHM.NS":     "Tech Mahindra",
    "DIVISLAB.NS":  "Divi's Laboratories",
    "CIPLA.NS":     "Cipla",
    "DRREDDY.NS":   "Dr. Reddy's Laboratories",
    "APOLLOHOSP.NS":"Apollo Hospitals",
    "HAVELLS.NS":   "Havells India",
    "PIDILITIND.NS":"Pidilite Industries",
    "DABUR.NS":     "Dabur India",
    "GODREJCP.NS":  "Godrej Consumer Products",
}

MAX_SCORE = 115.0  # sum of all positive weights


def compute_signal(symbol):
    """
    Multi-indicator scoring model.
    Score range: -115 to +115
      RSI:      ±35
      MACD:     ±25
      Bollinger:±25
      Volume:   ±15
      Momentum: ±15
    BUY  if score >= 40
    SELL if score <= -40
    HOLD otherwise
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="3mo", interval="1d")

        if hist.empty or len(hist) < 26:
            logger.warning(f"  {symbol}: not enough history ({len(hist)} bars)")
            return None

        close  = hist["Close"].astype(float)
        volume = hist["Volume"].astype(float)

        # ── RSI (14) ──────────────────────────────────────────────────────────
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)

        avg_gain = gain.ewm(alpha=1/14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/14, adjust=False).mean()

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        curr_rsi = float(rsi.iloc[-1])

        # ── MACD (12,26,9) ───────────────────────────────────────────────────
        ema12      = close.ewm(span=12, adjust=False).mean()
        ema26      = close.ewm(span=26, adjust=False).mean()
        macd_line  = ema12 - ema26
        sig_line   = macd_line.ewm(span=9, adjust=False).mean()
        macd_hist  = macd_line - sig_line
        curr_macd  = float(macd_hist.iloc[-1])

        # ── Bollinger Bands (20, 2σ) ─────────────────────────────────────────
        sma20     = close.rolling(20).mean()
        std20     = close.rolling(20).std()
        bb_upper  = sma20 + 2 * std20
        bb_lower  = sma20 - 2 * std20
        curr_bbu  = float(bb_upper.iloc[-1])
        curr_bbl  = float(bb_lower.iloc[-1])
        curr_sma  = float(sma20.iloc[-1])
        cp        = float(close.iloc[-1])

        bb_range  = curr_bbu - curr_bbl
        bb_pos    = ((cp - curr_bbl) / bb_range * 100) if bb_range > 0 else 50.0

        # ── Volume ratio ─────────────────────────────────────────────────────
        vol_avg   = volume.rolling(20).mean()
        vol_ratio = float(volume.iloc[-1] / vol_avg.iloc[-1]) if float(vol_avg.iloc[-1]) > 0 else 1.0

        # ── 5-day momentum ───────────────────────────────────────────────────
        momentum  = float((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5] * 100)

        # ── Scoring ───────────────────────────────────────────────────────────
        score = 0.0

        # RSI component (±35)
        if   curr_rsi < 25: score += 35   # very oversold
        elif curr_rsi < 35: score += 25
        elif curr_rsi < 45: score += 12
        elif curr_rsi > 75: score -= 35   # very overbought
        elif curr_rsi > 65: score -= 25
        elif curr_rsi > 55: score -= 12

        # MACD component (±25)
        if macd_line.iloc[-1] > sig_line.iloc[-1]:
            score += 20
        else:
            score -= 20

        # Bollinger component (±25)
        if   cp < curr_bbl:  score += 25  # price below lower band
        elif cp > curr_bbu:  score -= 25  # price above upper band
        elif cp < curr_sma:  score += 10  # below mid → bullish lean
        else:                score -= 10  # above mid → bearish lean

        # Volume confirmation (±15)
        if vol_ratio > 1.5:
            score += 15
        elif vol_ratio > 1.2:
            score += 8

        # Momentum (±15)
        score += float(np.clip(momentum * 2, -10, 10))

        # ── Decision thresholds ───────────────────────────────────────────────
        # Lowered to 25 so moderate signals also trigger trades
        if   score >= 25:
            action = "BUY"
        elif score <= -25:
            action = "SELL"
        else:
            action = "HOLD"

        # Confidence = how strongly the score supports the action (0-100%)

        confidence = round(min(abs(score) / MAX_SCORE * 100, 99.0), 1)

        logger.debug(f"  {symbol}: score={score:+.1f} action={action} conf={confidence}% rsi={curr_rsi:.1f}")

        return {
            "symbol":         symbol,
            "name":           WATCHLIST.get(symbol, symbol),
            "current_price":  round(cp, 2),
            "score":          round(score, 1),
            "action":         action,
            "confidence":     confidence,
            "rsi":            round(curr_rsi, 1),
            "macd_histogram": round(curr_macd, 4),
            "bb_position":    round(bb_pos, 1),
            "volume_ratio":   round(vol_ratio, 2),
            "momentum_5d":    round(momentum, 2),
        }

    except Exception as e:
        logger.error(f"compute_signal({symbol}) failed: {e}", exc_info=True)
        return None


def run_full_analysis():
    """Analyse all watchlist stocks. Returns list sorted by score descending."""
    signals = []
    total = len(WATCHLIST)
    for i, symbol in enumerate(WATCHLIST, 1):
        logger.info(f"Analysing {symbol} ({i}/{total})...")
        sig = compute_signal(symbol)
        if sig:
            signals.append(sig)
        time.sleep(0.3)   # polite rate-limiting for Yahoo Finance

    signals.sort(key=lambda x: x["score"], reverse=True)
    buys  = sum(1 for s in signals if s["action"] == "BUY")
    sells = sum(1 for s in signals if s["action"] == "SELL")
    holds = sum(1 for s in signals if s["action"] == "HOLD")
    logger.info(f"Analysis complete: {buys} BUY / {sells} SELL / {holds} HOLD")
    return signals


def get_live_price(symbol):
    """Fetch the latest close price for a symbol. Returns None on failure."""
    try:
        t = yf.Ticker(symbol)
        hist = t.history(period="1d")
        if not hist.empty:
            return round(float(hist["Close"].iloc[-1]), 2)
    except Exception as e:
        logger.warning(f"get_live_price({symbol}): {e}")
    return None


def get_index_data():
    indices = {
        "^NSEI":    "NIFTY 50",
        "^BSESN":   "SENSEX",
        "^NSEBANK": "BANK NIFTY",
    }
    result = []
    for sym, name in indices.items():
        try:
            t = yf.Ticker(sym)
            hist = t.history(period="2d")
            if len(hist) >= 2:
                prev = float(hist["Close"].iloc[-2])
                curr = float(hist["Close"].iloc[-1])
                result.append({
                    "symbol":     sym,
                    "name":       name,
                    "price":      round(curr, 2),
                    "change":     round(curr - prev, 2),
                    "change_pct": round((curr - prev) / prev * 100, 2),
                })
        except Exception as e:
            logger.warning(f"get_index_data({sym}): {e}")
    return result


def get_watchlist_prices():
    result = []
    for sym, name in WATCHLIST.items():
        try:
            t = yf.Ticker(sym)
            hist = t.history(period="2d")
            if len(hist) >= 2:
                prev = float(hist["Close"].iloc[-2])
                curr = float(hist["Close"].iloc[-1])
                result.append({
                    "symbol":     sym,
                    "name":       name,
                    "price":      round(curr, 2),
                    "change_pct": round((curr - prev) / prev * 100, 2),
                })
            time.sleep(0.15)
        except Exception as e:
            logger.warning(f"get_watchlist_prices({sym}): {e}")
    return result