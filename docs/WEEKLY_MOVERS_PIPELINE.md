# Free weekly stock-mover discovery

This is a **separate** price-ranking data pipeline. It does not edit the existing Supabase game tables or participant permissions.

Workflow: `.github/workflows/weekly-market-movers.yml`; script: `scripts/weekly_movers.py`.

- Nasdaq Trader listed-security directories establish symbols and remove obvious non-common securities.
- Yahoo Finance daily unadjusted Close and Volume are downloaded in batches, using Friday close versus previous Friday close.
- Require 15+ observations for the 20-session volume estimate, at least 500,000 shares/day.
- Query market capitalization only for the most extreme gainers and losers; require $750M+ and Yahoo EQUITY type.
- Select the highest five positive and lowest five negative returns independently, then sort their combined list by absolute move.
- Never infer missing market caps or missing price rows. Report failures instead of fabricating candidates.
- The JSON includes dates, source descriptions, close prices, average volumes, market caps, exclusions and a coverage count.
- No paid API keys or Supabase credentials are required. Data is public; the published file contains no account information.
- Known limitation: Yahoo is an unofficial free feed and current cap can differ from cap on historical report Friday; coverage can be incomplete or rate-limited. The GitHub workflow must be tested on a real runner before being considered production-ready.
- **The automated job delivers data, not researched catalysts or the Goblin infographic.** Those are downstream tasks.

To manually test: Actions -> Weekly market movers -> Run workflow, with `week_end=2026-10-16`. Inspect the artifact, `latest.json`, and failed batch count before merging.
