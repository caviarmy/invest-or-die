# Goblin Brokerage Redesign — Turn 2 Visual Foundation

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Production main baseline at turn start:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`  
**Status:** CODE COMPLETE / VISUAL AND MOBILE RUNTIME QA PENDING  
**Completed:** 2026-09-07

## Goal

Replace the generic dark-SaaS visual grammar at the shared-system level before redesigning the individual dashboard sections.

## Environment / authority matrix

This turn was frontend/asset-only.

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- backend: shared production Supabase project, unchanged in this turn
- challenge authority paths: unchanged
- compatibility impact on live frontend: none because no backend/schema/RLS/RPC/Edge Function change was made

## Changes completed

### Shared typography

`css/site.css` now uses:
- IBM Plex Sans for normal copy
- IBM Plex Sans Condensed for display/headings/controls
- IBM Plex Mono for prices, dates, status/data labels, and scoreboard-style values

The shared site stylesheet no longer uses Inter.

The standalone lesson article still has its own inline visual system. Its full brand-shell/type integration remains intentionally assigned to Turn 7 rather than forcing a partial article redesign into Turn 2.

### Color system

Established the Goblin Brokerage foundation tokens:
- soot/ink background
- institutional dark surfaces
- paper/ledger surface token
- money green
- loss red
- office/lesson blue
- highlighter yellow

Gradients were removed from the shared application foundation. The lesson currently uses a flat office blue as a temporary foundation until its Turn 3 structural redesign.

### Shape grammar

Reduced the general UI language from 15–18px rounded cards to:
- 3px structural radius
- 4px interactive control radius
- square/flat ledger and data surfaces
- status markers with only minimal rounding

Removed the generic shadow-heavy treatment from normal panels and reduced modal/popover shadow usage to functional depth only.

### Header / masthead

Removed:
- generic rounded `GI` app-square logo
- glass/blur header

Added:
- custom Goblin Investing SVG wordmark
- opaque black masthead
- money-green top rule
- hard bottom divider
- condensed uppercase utility navigation
- small desktop-only `HOUSEHOLD SECURITIES DESK` office label

The homepage and Rules page now share this masthead.

### Reusable visual utilities

Added shared foundations for:
- mono/tabular data
- artifact rules/dividers
- paper/ledger surfaces
- stamp treatments
- status stamp colors

These are intentionally foundational. Individual sections will use them in later turns rather than receiving complete one-off redesigns here.

### Vector asset kit started

Created:
- `assets/goblin-investing-wordmark.svg`
- `assets/goblin-investing-wordmark-mono.svg`
- `assets/stamps/current-champion.svg`
- `assets/stamps/human-finance-training.svg`

No character art, raster illustration, fantasy imagery, or AI-generated mascot was added.

The brokerage seal remains optional and was not created just to satisfy an asset count. It should be added later only if a real placement warrants it.

## Relevant commits

- `d1e6a739eb419dfccacff23b5491ec111d3f269e` — main wordmark asset
- `e42af1d119290ef4233b323e49e492a249aa0f44` — monochrome wordmark
- `b43ada02c5de2d6aa689fc24779b0c5a513a83b0` — Current Champion stamp
- `28d1b4be6b7275ac39a407f305842d3193889c59` — Human Finance Training stamp
- `2417855466c4c4d09d5ab41cd1860c832f1d8886` — visual foundation CSS
- `d07782a721f5dd58d5f812f5f34b977b822496f8` — homepage masthead
- `a4b89c32140b67f22d7ef9db7a716f1b02c9f993` — Rules masthead

## Verification performed

- re-fetched the rewritten shared CSS from the redesign branch
- re-fetched the homepage masthead from the redesign branch
- re-fetched the wordmark SVG from the redesign branch
- compared the redesign branch against `main`; branch remained ahead and 0 behind at verification time
- confirmed no Supabase/Edge Function files were changed during Turn 2
- parsed the replacement stylesheet before commit with `tinycss2`: no CSS parse errors
- checked the replacement stylesheet before commit for duplicate top-level qualified selectors: none found
- generated and visually inspected a raster preview of the wordmark before committing the SVG

No JavaScript was changed in Turn 2, so there was no new JavaScript syntax surface to validate.

## Deliberately not redesigned yet

Turn 2 establishes the grammar but does not complete the following section-specific work:
- tracker/Buy-In scoreboard composition: Turn 3
- Current Lesson editorial insert composition and Human Finance Training stamp integration: Turn 3
- Win the Week scoreboard/champion stamp integration: Turn 3
- participant-card removal and call-slip markup: Turn 4
- Called It form-sheet redesign: Turn 5
- mobile Receipts ledger: Turn 6
- Rules structural redesign beyond shared foundation: Turn 7
- lesson article masthead/integration: Turn 7
- goblin annotation seasoning: Turn 8

This avoids doing later turns prematurely.

## QA status

**CODE COMPLETE:** yes.

**QA COMPLETE:** no.

The redesign branch is not the live GitHub Pages branch, so browser-rendered visual QA and Android runtime QA remain unresolved gates. Existing Turn 1 Android/auth/modal QA requirements continue to carry forward.

## Next canonical step

Turn 3 — Tracker + Current Lesson + Win the Week.

That turn should use the new foundation and the prepared stamp assets to make the first screenful read unmistakably as Goblin Brokerage without touching the Called It section structure yet.
