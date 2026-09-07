# Goblin Brokerage Redesign — Turn 4 Called It Challenge Slips

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `81d32df026764dec58970b3f9c4e106717013db7`  
**Status:** CODE COMPLETE / VISUAL AND MOBILE RUNTIME QA DEFERRED  
**Completed:** 2026-09-07

## Goal

Replace the Called It card-soup presentation with full-width participant sections and rectangular brokerage call slips while preserving every existing challenge action and server-authoritative behavior.

The add/edit form and modal were deliberately left for Turn 5.

## Environment / authority matrix

This turn changed presentation code only.

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- shared backend: production Supabase, unchanged
- Called It mutation authority: unchanged
- market provider / quote behavior: unchanged
- backward-compatibility impact on live frontend: none because `main` and the shared backend were not changed

## Files changed

- `js/called-it-ui.js`
- `css/site.css`

No `app.js`, `market.js`, `plays.js`, Supabase, RLS, RPC, Edge Function, or database files changed.

## Changes completed

### Participant grouping

The existing `.participant-card` render hook is intentionally retained to avoid unnecessary controller churn, but it no longer renders visually as a card.

It now behaves as a full-width participant section:
- transparent/no outer border or panel background
- participant sections stack vertically on desktop and mobile
- CSS counters render `01 /`, `02 /`, etc. before participant names
- participant name and actions sit above a strong double rule
- the participant divider itself is the grouping mechanism
- desktop shows the participant's two call slips side-by-side
- mobile stacks the two slips vertically

This removes the previous three-column `participant card -> challenge card` hierarchy without changing participant/event binding logic.

### Brokerage call slips

Each slot now reads as a rectangular prediction ticket:
- `CALL SLIP 01` / `CALL SLIP 02`
- large ticker
- company name
- direction band
- hard-rule data grid
- `OPENED`
- `TARGET`
- optional `LAST CHECK`
- optional `CHECKED AT`
- `BECAUSE`
- `MY MOVE`
- expiration/end line
- action controls at the bottom

The old nested mini-card treatment for FROM / GOAL / CURRENT / CHECKED is gone. The values now live in a ruled data grid.

### Direction treatment

Direction labels now lead with the existing market symbols:
- `📈 GOES UP`
- `📉 GOES DOWN`
- `→ FINISHES ABOUT THE SAME`

The indicators are no longer small pill-like badges. They are full-width ruled labels with a directional left edge:
- Up = green
- Down = red
- Flat = neutral

Custom direction SVGs remain optional later work; the master plan explicitly permits retaining emoji until those symbols are ready and tested.

### Empty slots

Empty slots are now dashed minimal tickets rather than large filled cards:
- `CALL SLIP 0N`
- `EMPTY — NO CALL FILED`
- signed-in managers are directed to the existing Add Challenge control

No fake click affordance was added to the empty ticket itself.

### Review and cooldown states

Existing states remain visible and truthful:
- review cooldown retains its real `lock_until` countdown
- Under Review remains sourced from challenge status
- approved/rejected cooldown slots remain occupied until the existing lock expires

### Truth audit corrections

The old slip used `CURRENT` for `last_checked_price`. That is not a live quote; it can be stale.

It is now labeled:
- `LAST CHECK`
- `CHECKED AT`

Similarly, a locally qualifying last check no longer says simply `TARGET REACHED`. It says:

`GOAL MET AT LAST CHECK`

and explicitly notes that submission will recheck the price. This matches the existing server-authoritative submit behavior.

### Interaction preservation

Existing data attributes were preserved, so canonical `app.js` continues to bind:
- Check Price
- Submit for Review
- per-play pencil edit
- admin participant `+ Add`

The pencil target was increased to 44×44px.

No observer, shim, new event handler, or alternate render layer was added.

## Source-level review gates

### Truth

Passed.
- `LAST CHECK` does not imply a live quote.
- `CHECKED AT` reflects a stored timestamp.
- `GOAL MET AT LAST CHECK` describes the local qualification calculation without claiming the price is still qualifying.
- `UNDER REVIEW` and `REVIEW COOLDOWN` are real persisted states.

### Geometry

Passed.
- participant dividers group the two slips beneath them.
- desktop has two actual slip columns.
- mobile has one stacked column.
- price/data labels correspond to the values directly beneath them.

### Bounds

Source-level protections added:
- participant names use `overflow-wrap:anywhere`
- ticker/company names can wrap instead of causing horizontal overflow
- target/data values can wrap within `minmax(0,1fr)` columns
- long explanation text and URLs wrap
- reason copy remains internally scrollable when extremely long
- desktop slip columns use `minmax(0,1fr)`
- mobile is single-column

Runtime viewport QA is still deferred.

### Independence

Passed.
- no new graphical asset was introduced
- emoji direction symbols are intentionally temporary and permitted by the master plan
- no new device-font-dependent branded asset was created

### Cleanup

Passed for this turn.
- old three-column participant layout was replaced in the canonical selector rather than overridden with a second patch layer
- old mini-card `play-meta` cell borders/background treatment was replaced in place
- no duplicate compatibility stylesheet was introduced
- existing class names used by canonical render output were deliberately retained where renaming would add no functional value

## Verification performed

- compared redesign branch against `main` before work: 33 ahead / 0 behind
- read current `called-it-ui.js`, participant rendering in `app.js`, `market.js`, `plays.js`, and current Called It CSS
- syntax-checked the rewritten `called-it-ui.js` with `node --check`
- checked CSS brace balance and required Turn 4 selectors locally
- re-fetched committed `called-it-ui.js`
- re-fetched committed Called It CSS
- verified committed CSS blob SHA matches the locally checked file
- compared Turn 4 against its starting commit; only `js/called-it-ui.js` and `css/site.css` changed before documentation
- confirmed no backend/API mutation path changed

## Runtime QA status

**CODE COMPLETE:** yes.

**QA COMPLETE:** no.

Per project direction, browser/Android QA remains deferred until the later integrated QA pass.

## Deliberately deferred

- Called It add/edit form and modal redesign: Turn 5
- mobile help visual refinement: Turn 5
- Receipts/leaderboard: Turn 6
- custom direction SVGs: optional later asset/seasoning work
- owner metadata Edge Function authority cutover: pre-merge gate

## Relevant commits

- `40c73c504c1a71038c1c4f37859e0ddc39914ca3` — brokerage call-slip markup and truthful last-check labels
- `9f0a273762024f32cd6676032c33d56aa36e85a6` — participant-section and call-slip visual system

## Next canonical step

Turn 5 — Called It form + modal + help.
