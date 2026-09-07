# Goblin Brokerage Redesign — Turn 3 Top-Page Composition

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Production main baseline at turn start:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`  
**Status:** CODE COMPLETE / VISUAL AND MOBILE RUNTIME QA PENDING  
**Completed:** 2026-09-07

## Goal

Use the Turn 2 visual foundation to redesign only the first three dashboard systems:
1. Current Week / Buy-In tracker
2. Current Lesson
3. Win the Week

Called It and The Receipts were deliberately left structurally unchanged for their later canonical turns.

## Environment / authority matrix

This turn was HTML/CSS only.

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- shared backend: production Supabase, unchanged
- auth / Called It authority paths: unchanged
- compatibility impact on live frontend: none because `main` was not changed and no shared backend contract changed

## Changes completed

### Current Week / Buy-In

The former rounded tracker card is now a compact brokerage/terminal status band.

Added:
- `HOUSE ACCOUNT / WEEKLY BUY-IN` system label
- small `ACTIVE` market/status indicator
- two-column Week / Buy-In data area
- hard rule separation instead of rounded card framing
- mono/tabular primary values
- `MANDATORY HUMAN WEALTH BUILDING` goblin annotation
- dynamic purchase requirement copy remains driven by the existing `purchaseMinimumNote` element and `app.js`

No tracker JavaScript was changed. Existing dynamic IDs remain:
- `currentWeekValue`
- `purchaseMinimumValue`
- `purchaseMinimumNote`

### Current Lesson

The lesson is now a cobalt editorial/training bulletin rather than another dashboard card.

Added:
- `TRAINING BULLETIN / 001`
- `HUMAN FINANCE TRAINING` SVG stamp integration
- large condensed editorial title
- hard left edge and top-side highlighter mark
- rule-based `READ THE FILE →` treatment instead of a generic rounded CTA button
- asymmetric desktop composition with the stamp separated from the lesson copy

The lesson still links to the same existing article.

### Win the Week

The weekly winner is now presented as a scoreboard rather than a panel/card.

Added:
- `WEEKLY PERFORMANCE DESK` label
- `BEST RETURN WINS $1` rule note
- hard-rule scoreboard frame
- `TOP ACCOUNT / WEEKLY RETURN` board header
- dramatically larger winner name and percentage return
- mono date range
- prepared `CURRENT CHAMPION` SVG stamp integrated only when rendered winner data includes a return value
- chart relabeled as `SUPPORTING EVIDENCE / PORTFOLIO CHART`
- chart separated by a rule instead of framed inside another nested card
- admin update control retained

The champion stamp is conditionally exposed with CSS `:has(.winner-return)`, so the no-winner state does not claim that an empty result is the current champion.

Existing dynamic IDs remain:
- `winnerContent`
- `winnerChartWrap`
- `winnerChart`
- `adminWeekButton`

No winner-rendering JavaScript was changed.

## Relevant commits

- `3b44241bc39db58ab4095c186f47a8de6cdf41f2` — restructure Tracker, Lesson, and Win the Week markup
- `3a61cb5557bba338d5f3f65617d14571733537ec` — top-page Goblin Brokerage composition styles

## Functional preservation

Verified by source review:
- tracker dynamic element IDs used by `renderTracker()` remain present exactly once
- winner dynamic element IDs used by `renderWinner()` remain present exactly once
- lesson destination path is unchanged
- admin weekly update button ID and form workflow are unchanged
- Called It markup and controllers were not changed
- history/Receipts markup and controllers were not changed
- auth, Supabase, RLS, RPC, Edge Function, and market-provider code were not changed

## Visual direction achieved

The first screenful now uses three distinct artifact metaphors rather than three versions of the same card:
- tracker = account/terminal band
- lesson = office training bulletin
- weekly winner = market scoreboard

The design intentionally uses very little goblin humor. The joke appears mainly in `MANDATORY HUMAN WEALTH BUILDING`; the financial system remains the base visual language.

## Verification performed

- compared redesign branch to `main` at turn start: ahead, 0 behind
- re-fetched modified homepage markup from the redesign branch
- re-fetched new Tracker/Lesson/Win CSS from the redesign branch
- inspected desktop media rules after write
- confirmed no JavaScript file changed in Turn 3
- confirmed no backend/Supabase file changed in Turn 3
- confirmed the prepared stamp asset paths resolve to existing branch assets

## QA status

**CODE COMPLETE:** yes.

**QA COMPLETE:** no.

The redesign branch is still not the live Pages branch, so actual rendered visual review and Android Chrome runtime checks remain open. The cumulative manual gates from Turn 1 and Turn 2 continue to carry forward.

## Deliberately deferred

- Called It participant/card redesign: Turn 4
- Called It form/modal visual redesign: Turn 5
- Receipts mobile ledger: Turn 6
- Rules structural redesign and article shell: Turn 7
- final annotation/seasoning audit: Turn 8

## Next canonical step

Turn 4 — Called It participant sections and challenge slips.

That turn should remove the outer participant-card / nested-card hierarchy and convert each challenge into a brokerage call slip while preserving all current challenge actions and server-authoritative behavior.
