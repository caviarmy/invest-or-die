#!/usr/bin/env python3
"""Deterministic, free US weekly stock mover discovery. No AI-generated ticker selection."""
import argparse
import datetime as dt
import io
import json
import math
import os
import time
import urllib.request
from pathlib import Path

import pandas as pd
import yfinance as yf

MIN_CAP = 750_000_000
MIN_VOLUME = 500_000
HEADERS = {"User-Agent": "GoblinInvesting/1.0 weekly research contact via GitHub"}

def universe():
    # Nasdaq Trader publishes listed securities independently of Yahoo's search ranking.
    sources = [
        ("https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt", "|", "Symbol", "Security Name", "NASDAQ"),
        ("https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt", "|", "ACT Symbol", "Security Name", "OTHER"),
    ]
    result = {}
    for url, delimiter, ticker_col, name_col, exchange in sources:
        request = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(request, timeout=45) as response:
            data = response.read().decode("utf-8-sig")
        frame = pd.read_csv(io.StringIO(data), sep=delimiter, dtype=str)
        for _, item in frame.iterrows():
            ticker = str(item.get(ticker_col, "")).strip()
            name = str(item.get(name_col, "")).strip()
            if not ticker or ticker.startswith("File Creation") or not name:
                continue
            if str(item.get("ETF", "N")).strip() == "Y":
                continue
            if str(item.get("Test Issue", "N")).strip() == "Y":
                continue
            if str(item.get("NextShares", "N")).strip() == "Y":
                continue
            if any(word in name.lower() for word in (
                "warrant", "depositary", "preferred", "rights", "unit ", " units",
                "acquisition corp", "acquisition co", "etf ", "exchange traded", "etn ",
                "closed-end fund", "trust units",
            )):
                continue
            # Yahoo uses '-' rather than '.' on ordinary multi-class shares.
            result[ticker.replace(".", "-")] = {"ticker": ticker, "company": name, "exchange": exchange}
    if len(result) < 3000:
        raise RuntimeError(f"Universe unexpectedly small: {len(result)}")
    return result

def last_friday(today):
    days = (today.weekday() - 4) % 7
    return today - dt.timedelta(days=days)

def close_row(hist, day):
    if hist is None or hist.empty:
        return None
    matches = hist[hist.index.date == day]
    if matches.empty:
        return None
    return matches.iloc[-1]

def run(week_end, output, batch_size=100):
    baseline = week_end - dt.timedelta(days=7)
    start = baseline - dt.timedelta(days=45)
    universe_rows = universe()
    symbols = list(universe_rows)
    data = []
    failures = []
    for offset in range(0, len(symbols), batch_size):
        chunk = symbols[offset:offset + batch_size]
        for attempt in range(3):
            try:
                prices = yf.download(chunk, start=str(start), end=str(week_end + dt.timedelta(days=1)),
                                     auto_adjust=False, group_by="ticker", threads=8, progress=False)
                break
            except Exception as exc:
                if attempt == 2:
                    failures.append({"batch": offset // batch_size, "error": str(exc)})
                    prices = None
                time.sleep(2 ** attempt)
        if prices is None or prices.empty:
            continue
        for symbol in chunk:
            try:
                history = prices[symbol] if isinstance(prices.columns, pd.MultiIndex) else prices
                if not {"Close", "Volume"}.issubset(history.columns):
                    continue
                base, final = close_row(history, baseline), close_row(history, week_end)
                if base is None or final is None:
                    continue
                p0, p1 = float(base["Close"]), float(final["Close"])
                if not (math.isfinite(p0) and math.isfinite(p1) and p0 > 0 and p1 > 0):
                    continue
                recent = history.loc[:str(week_end), "Volume"].dropna().tail(20)
                if len(recent) < 15:
                    continue
                avg_volume = float(recent.mean())
                if avg_volume < MIN_VOLUME:
                    continue
                entry = dict(universe_rows[symbol])
                entry.update(base_close=round(p0, 6), end_close=round(p1, 6),
                             base_date=str(baseline), end_date=str(week_end),
                             avg_volume_20d=round(avg_volume),
                             weekly_change_pct=round((p1 / p0 - 1) * 100, 4))
                data.append(entry)
            except (KeyError, ValueError, TypeError):
                continue
    if len(data) < 100:
        raise RuntimeError(f"Insufficient price coverage: only {len(data)} securities have valid closes and volume.")
    # Yahoo's metadata isn't a reliable bulk market-cap endpoint. Query caps for potential
    # extreme movers; expand candidate window until 5 winners and 5 losers qualify.
    ups = sorted((r for r in data if r["weekly_change_pct"] > 0), key=lambda r: -r["weekly_change_pct"])
    downs = sorted((r for r in data if r["weekly_change_pct"] < 0), key=lambda r: r["weekly_change_pct"])
    qualified = {"up": [], "down": []}
    assessed = []
    for direction, candidates in (("up", ups), ("down", downs)):
        for row in candidates:
            if len(qualified[direction]) >= 12:
                break
            try:
                info = yf.Ticker(row["ticker"].replace(".", "-")).get_info()
                cap = info.get("marketCap")
                quote_type = str(info.get("quoteType", "")).upper()
                if not isinstance(cap, (int, float)) or cap < MIN_CAP:
                    assessed.append({"ticker": row["ticker"], "reason": "below_cap_or_unknown"})
                    continue
                if quote_type and quote_type not in ("EQUITY",):
                    assessed.append({"ticker": row["ticker"], "reason": "not_equity"})
                    continue
                row["market_cap"] = int(cap)
                row["market_cap_source"] = "Yahoo Finance quote metadata, fetched at report generation"
                qualified[direction].append(row)
            except Exception as exc:
                assessed.append({"ticker": row["ticker"], "reason": "metadata_error", "detail": str(exc)[:100]})
            time.sleep(0.15)
    if min(map(len, qualified.values())) < 5:
        raise RuntimeError(f"Cannot validate five per direction: { {k:len(v) for k,v in qualified.items()} }; no fabricated fill-ins.")
    all_top = sorted(qualified["up"][:5] + qualified["down"][:5],
                     key=lambda r: -abs(r["weekly_change_pct"]))
    candidates = sorted(qualified["up"] + qualified["down"],
                        key=lambda r: -abs(r["weekly_change_pct"]))[:100]
    report = {"schema_version": 1, "week_start": str(week_end - dt.timedelta(days=4)),
              "base_date": str(baseline), "week_end": str(week_end),
              "thresholds": {"market_cap": MIN_CAP, "avg_volume_20d": MIN_VOLUME},
              "universe_size": len(universe_rows), "price_and_volume_eligible": len(data),
              "top_ten": all_top, "verified_candidates": candidates,
              "metadata_exclusions": assessed, "batch_failures": failures,
              "provenance": ["Nasdaq Trader symbol directories", "Yahoo Finance daily unadjusted closes / daily volume", "Yahoo Finance market-cap quote metadata"],
              "qualification": "Current market caps, not historical Friday caps. Free Yahoo access is unofficial."}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"output":str(output),"date":str(week_end),
                      "universe":len(universe_rows),"history_eligible":len(data),
                      "cap_qualified":{k:len(v) for k,v in qualified.items()},
                      "top_ten":[r["ticker"] for r in all_top]}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--week-end", help="YYYY-MM-DD, completed NYSE Friday")
    parser.add_argument("--out", default="data/weekly-movers/latest.json")
    args = parser.parse_args()
    day = dt.date.fromisoformat(args.week_end) if args.week_end else last_friday(dt.datetime.now(dt.timezone.utc).date())
    if day.weekday() != 4:
        raise SystemExit("Week end must be a Friday")
    # GitHub scheduled workflow runs after close; don't silently use unfinished Fridays.
    if dt.datetime.now(dt.timezone.utc) < dt.datetime.combine(day, dt.time(21, 30), tzinfo=dt.timezone.utc):
        raise SystemExit("Requested Friday has not reached the end-of-session data buffer")
    run(day, Path(args.out))
