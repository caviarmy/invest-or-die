#!/usr/bin/env python3
"""Weekly mover candidate discovery from published leaderboards, without Yahoo bulk scraping.

Never invent a value: records with missing/undated history or incomplete eligibility are
left unverified. This is a discovery/evidence pipeline, not a guarantee of exhaustive ranking.
"""
import argparse
import datetime as dt
import json
import re
import time
from pathlib import Path
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

HEADERS={"User-Agent":"Mozilla/5.0 (compatible; GoblinInvesting/1.0)"}
SOURCES={
  "gainers":"https://tickflow.io/list/best-performing-stocks-this-week",
  "losers":"https://tickflow.io/list/worst-performing-stocks-this-week",
}
def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers=HEADERS),timeout=30) as response:
                return response.read().decode("utf-8","replace")
        except Exception:
            if attempt==2: raise
            time.sleep(2**attempt)

def discover(html, direction):
    soup=BeautifulSoup(html,"html.parser")
    text=soup.get_text(" ",strip=True)
    # Identify tickers and 1W percentages together in individual table rows, not via
    # fabricated whole-page text parsing. Keep all rows for evidence and manual review.
    found=[]
    for tr in soup.select("tr"):
        cells=[c.get_text(" ",strip=True) for c in tr.select("td")]
        if len(cells)<2: continue
        row=" | ".join(cells)
        pct=re.search(r"([+-]?\d+(?:\.\d+)?)\s*%",row)
        ticker=next((token for token in re.findall(r"\b[A-Z]{1,5}(?:\.[A-Z])?\b",row) if token not in {"NYSE","NASDAQ","USD","USA"}),None)
        if ticker and pct:
            found.append({"ticker":ticker,"source_rolling_return_pct":float(pct.group(1)),"raw_row":row[:300]})
    return {"candidates":found,"candidate_count":len(found),"page_excerpt":text[:400],"source_direction":direction}

def run(week_end, out):
    payload={"week_end":str(week_end),"baseline":str(week_end-dt.timedelta(days=7)),
       "status":"discovery_only","rankings_verified":False,
       "note":"TickFlow may publish rolling returns that do not match Friday-to-Friday closes. No verified top ten is asserted.",
       "sources":{},"candidate_tickers":[],"errors":[]}
    for direction,url in SOURCES.items():
        try:
            result=discover(fetch(url),direction)
            result["url"]=url
            payload["sources"][direction]=result
            for row in result["candidates"]:
                payload["candidate_tickers"].append({"ticker":row["ticker"],"direction":direction})
            if result["candidate_count"]<10:
                payload["errors"].append(f"{direction} leaderboard did not yield at least ten parseable table rows")
        except Exception as exc:
            payload["errors"].append(f"{direction}: {type(exc).__name__}: {str(exc)[:200]}")
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"output":str(out),"counts":{k:v["candidate_count"] for k,v in payload["sources"].items()},"errors":payload["errors"]}))
    if payload["errors"]: raise SystemExit(2)

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--week-end",default="")
    p.add_argument("--out",default="data/weekly-movers/latest.json")
    a=p.parse_args()
    today=dt.datetime.now(dt.timezone.utc).date()
    week_end=dt.date.fromisoformat(a.week_end) if a.week_end else today-dt.timedelta(days=(today.weekday()-4)%7)
    if week_end.weekday()!=4: raise SystemExit("week end must be Friday")
    if dt.datetime.now(dt.timezone.utc)<dt.datetime.combine(week_end,dt.time(21,30),tzinfo=dt.timezone.utc):
        raise SystemExit("Friday data buffer has not elapsed")
    run(week_end,Path(a.out))
