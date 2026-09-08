# Goblin Brokerage Redesign — Turns 2–3 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Status:** SOURCE-LEVEL CORRECTIONS COMPLETE / RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-07

## Scope

This review audited the actual Turn 2 visual-foundation and Turn 3 top-page implementation before beginning Turn 4. It focused on portability, semantic accuracy, CSS cleanup, layout bounds, and dependency loading rather than only whether the art direction matched the design brief.

No JavaScript business logic, Supabase schema, RLS, RPC, Edge Function, or market-data behavior was changed.

## Corrections made

### 1. Stamp SVGs are now font-independent

The initial stamp SVGs were vector containers but still contained live `<text>` nodes using `Arial Narrow`. External SVGs loaded through `<img>` or CSS backgrounds do not inherit the parent document's IBM Plex fonts, so stamp lettering could render differently across Android, iOS, Windows, and other environments.

Corrected assets:
- `assets/stamps/current-champion.svg`
- `assets/stamps/human-finance-training.svg`

The lettering is now outlined into vector path geometry. The assets no longer depend on device-installed fonts.

### 2. Dead top-page CSS was removed

Turn 3 replaced the old card/wrapper markup but left structural selectors from the previous composition.

Removed confirmed-obsolete rules including:
- `.panel`
- `.hero-grid`
- `.quick-panel`
- `.quick-panel p`
- `.quick-panel .text-link`
- `.win-week-section .hero-grid`
- `.section-title-outside`
- obsolete desktop `.panel` / `.section-title-outside` overrides

The retained `.stamp`, `.ledger-surface`, and other shared primitives are intentional reusable utilities for later turns.

### 3. Fake runtime status was removed

The tracker previously displayed a hardcoded green `ACTIVE` indicator. Because the application also deals with real market/provider/auth state, this could be read as authoritative market, backend, or account status even though no such state was being calculated.

It now reads:

`REQUIREMENT IN EFFECT`

This is a static description of the weekly buy-in rule, not a claim about runtime state. The green-dot pseudo-indicator was removed.

### 4. Win the Week label geometry was corrected

The scoreboard previously showed `TOP ACCOUNT` and `WEEKLY RETURN` as opposing pseudo-column headers even though the winner and return are rendered as a stacked composition.

The header is now a single block label:

`WEEKLY WINNER / RETURN`

This matches the actual information geometry on both mobile and desktop.

### 5. Scoreboard overflow was hardened from source-level bounds

The admin form permits weekly return values up to `10000`, so the giant return typography had a predictable narrow-screen overflow edge case even without running the branch in a browser.

Changes:
- reduced mobile return scaling;
- reduced desktop maximum return scaling;
- added defensive max-width/nowrap handling for the numeric return;
- added `overflow-wrap:anywhere` and max-width protection for long winner names;
- ensured winner content itself can shrink with `min-width:0`.

This does not replace later browser QA, but legal source-level bounds are now considered before runtime testing.

### 6. Primary web-font loading was moved out of CSS `@import`

The shared stylesheet no longer starts with a Google Fonts `@import`.

`index.html` and `rules/index.html` now load IBM Plex through normal document-head `<link>` elements with preconnect hints. `site.css` retains only the family/fallback declarations.

The standalone lesson article remains intentionally separate until its canonical Turn 7 integration.

## Why the earlier process missed these issues

### Vector was defined too loosely

The architecture said to prefer SVG/vector assets, but did not distinguish between a vector file container and font-independent vector artwork. An SVG containing live `<text>` superficially satisfied the instruction while still being device-dependent.

**New rule:** branded external SVG lettering must be outlined to paths, visually previewed, and checked for live `<text>` before acceptance.

### Dead-code cleanup was generic rather than structural

The plan already required searching for obsolete selectors, but Turn 3 did not create an explicit inventory of the classes removed by its markup replacement. The generic cleanup instruction was easy to satisfy incompletely.

**New rule:** when markup structure changes, list the removed/renamed classes first and reconcile each one against shared CSS before the turn closes.

### Visual flavor was not subjected to a truth audit

`ACTIVE` was chosen as brokerage-style flavor. The review did not ask what authoritative state it represented.

**New rule:** words/icons such as `ACTIVE`, `LIVE`, `OPEN`, `SYNCED`, `CURRENT`, status dots, and similar state language require a named data source. Otherwise they must be rewritten as static requirements/labels.

### Labels were reviewed aesthetically rather than relationally

The scoreboard header looked plausible visually, but its two labels did not correspond to two actual columns.

**New rule:** headings that imply columns or relationships must be checked against the actual geometry of the values they describe, including the mobile layout.

### Runtime QA deferral was allowed to hide predictable bounds problems

The decision to postpone browser/mobile QA was reasonable, but the process treated layout overflow too much like a runtime-only concern. The legal `10000` admin value made the edge case knowable from source.

**New rule:** every turn performs a static worst-case-content pass using actual field constraints and 320–360px layout assumptions even when runtime QA is deferred.

### Typography direction did not include a loading-contract requirement

The plan specified the type families but not the web-font delivery mechanism.

**New rule:** primary remote fonts load through document-head links/preconnect rather than CSS `@import`, with robust system fallbacks.

## Five mandatory visual-review questions going forward

Every visual implementation turn must answer:

1. **Truth:** Does any visual element claim a live state the application does not actually know?
2. **Geometry:** Do labels and headings correspond to the actual values/layout beneath them?
3. **Bounds:** Do legal worst-case strings and numeric values fit at narrow mobile widths?
4. **Independence:** Will external assets render consistently without device-specific fonts or hidden dependencies?
5. **Cleanup:** Did replacing markup also remove the obsolete implementation residue it replaced?

These are source-level gates. They apply even when full browser/mobile QA is intentionally deferred.

## Runtime QA status

Runtime QA remains deferred by project choice until the later integrated QA phase. This review does not mark Android/browser acceptance complete.

## Next canonical step

Turn 4 — Called It participant sections and challenge slips.
