# Goblin Brokerage Redesign — Turn 5 Called It Form, Modal, and Help

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `40f8b1fe6aaac32d36e0aff8321611e93b8ca18a`  
**Status:** CODE COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Completed:** 2026-09-07

## Goal

Redesign the Called It create/edit interaction as a financial/brokerage worksheet while preserving the existing one-play controller, market-price authority, direction/action rules, owner/admin permissions, and mobile close/scroll behavior.

Turn 6 Receipts/leaderboard work was deliberately not started.

## Environment / authority matrix

This turn changed frontend presentation and form markup only.

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- shared backend: production Supabase, unchanged
- create/check/submit/cancel/admin-edit authority: existing `called-it` Edge Function, unchanged
- owner metadata edit: existing transitional `edit_own_called_it_metadata` RPC, unchanged
- ticker search: existing `securities` queries, unchanged
- market quote preview: existing `previewCalledIt` request, unchanged
- backward-compatibility impact on live frontend: none because `main` and the shared backend were not changed

## Files changed

- `js/called-it-ui.js`
- `css/site.css`
- `index.html`

No changes were made to:
- `js/app.js`
- `js/auth.js`
- `js/market.js`
- `js/plays.js`
- Supabase schema/RLS/RPCs
- Edge Functions
- Rules page
- Receipts rendering

## Form redesign

### Brokerage worksheet metaphor

The single-play form now reads as a paper brokerage worksheet rather than a dark modal full of generic controls.

The form includes:
- `CALL WORKSHEET / SLIP 0N`
- explicit mode labels: `NEW CALL`, `ADMIN REFILE`, or `OWNER CORRECTION`
- `I THINK`
- price basis/current-price output
- `WILL`
- goal output
- `BECAUSE`
- `SO I AM`
- filing/save controls

Inputs use hard bottom rules on an off-white paper surface. The form hierarchy comes from labels, rules, spacing, and type rather than nested cards.

### Semantic field associations

Turn 5 also improved source-level accessibility:
- ticker search has an explicit `label for`
- explanation textarea has an explicit `label for`
- portfolio action has an explicit `label for`
- amount input has an accessible hidden label
- direction choices live inside a `fieldset` with `legend`
- quote and goal are represented as `output` elements with live-region behavior
- modal close control remains at least 44×44px

Ticker autocomplete remains a normal collection of real buttons. A temporary attempt to label it as an ARIA listbox was removed during source review because the application does not implement full listbox keyboard semantics. Native button behavior is more truthful and robust.

## Direction / action behavior preserved

No action mapping changed:
- Up → Buy / Hold
- Down → Sell / Not Buying
- Flat → Hold / Not Buying

The existing controller still rewrites the action choices when the direction changes and still hides the amount input for Not Buying.

All canonical form element names and data attributes used by `app.js` were preserved.

## Quote and target semantics

The existing market behavior remains authoritative.

### New call

Before filing:
- selecting a ticker requests the existing preview quote
- the browser calculates the displayed target from that preview and current game settings

On filing:
- the existing server create action remains authoritative for official starting terms

The help copy now reflects this accurately: the official starting price and goal are recorded when the call is filed, not merely when a ticker preview is displayed.

### Admin edit

An existing admin-edited challenge initially shows its stored original call price.

The visible label is now `PRICE BASIS`, not `CURRENTLY TRADING AT`, because the displayed stored reference price is not necessarily current.

When ticker or direction changes, the existing controller still obtains a fresh quote because the server will restart challenge terms.

### Missing values

Turn 4's hardened money/goal handling remains in effect. Form target/static output routes through the null-safe goal formatter so missing values are not displayed as legitimate `$0.00` targets.

## Owner edit

Owner edit remains intentionally narrower than admin edit.

The worksheet presents:
- locked stock
- locked original prediction/target
- editable explanation
- editable permitted portfolio action/amount

The existing transitional RPC remains unchanged. Its Edge Function cutover remains a pre-merge dependency because production `main` still uses the RPC.

## Modal behavior

The Called It modal is now a paper form sheet.

Mobile source-level behavior:
- single-play modal uses the full `100dvh` viewport
- no border/radius shell around the mobile sheet
- the sheet itself is the deliberate scrolling surface
- sticky form header keeps title/close control available
- safe-area insets are included
- body scroll continues to be locked/unlocked by the existing canonical modal functions

Desktop:
- sheet is centered
- width is capped
- viewport height is bounded with `100dvh`

No new modal event handler, observer, or compatibility layer was introduced.

## Help redesign

Called It help remains a native `<details>` element, preserving its simple open/close state.

Desktop:
- compact brokerage quick-guide popover

Mobile:
- fixed paper bottom sheet
- fixed dark backdrop
- summary control becomes an explicit `CLOSE` control while open
- page body is CSS-locked while help is open
- backdrop uses no blur/filter
- sheet uses its own deliberate contained scroll only if its content exceeds its bounded height
- the existing document outside-click and Escape handlers still close the native details element

The quick guide now describes the real lifecycle:
1. choose a listed stock, direction, and reason;
2. file the call, at which point official starting terms are recorded;
3. check during the challenge and submit for review when the goal is met.

The payout copy deliberately does not hardcode `$5`; game settings remain dynamic.

## Scroll-topology review

Passed at source level.

Allowed deliberate scroll surfaces:
- the full Called It modal sheet when the form is taller than the viewport
- ticker autocomplete results when more results exist than fit the dropdown
- mobile help sheet if the quick guide exceeds its bounded height

Removed/avoided:
- no repeated nested vertical scroll area inside the form itself
- no nested two-slot manager
- no extra page-sized JavaScript overlay
- no blur-backed fixed layer

Actual Android gesture behavior remains deferred to integrated runtime QA.

## Shared-helper / scope review

Passed.

Turn 5 did not alter the shared `directionLabel`, `money`, or challenge-slip presentation semantics established after the Turn 4 correction review.

The temporary ticker ARIA-role change was removed before completion rather than leaving incomplete keyboard semantics.

Receipts/history markup was not redesigned.

## Static verification performed

- read authoritative v4 Turn 5 requirements before work
- branch started 41 commits ahead / 0 behind `main`
- read current form rendering, modal logic, auth lifecycle, ticker search, market requests, and help markup/CSS
- preserved all controller-required form names/data attributes
- syntax-checked `called-it-ui.js` with `node --check`
- parsed the updated homepage HTML successfully
- checked CSS brace balance
- checked committed Git blob SHAs against locally validated source snapshots
- reviewed nullable/missing price/target output
- reviewed preview wording against create/admin-edit server semantics
- reviewed mobile scroll topology
- compared Turn 5 against its start commit; only the three intended runtime frontend files changed before documentation

## Runtime QA status

**CODE COMPLETE:** yes.

**QA COMPLETE:** no.

Per project direction, actual Android/browser QA is deferred until the later integrated QA turn.

Still to verify at runtime:
- open/close Called It form repeatedly on Android Chrome
- scroll after each close
- virtual keyboard behavior in ticker/reason/amount fields
- ticker-result tap behavior
- owner edit save/cancel
- admin full edit and fresh-quote restart behavior
- help open/close repeatedly
- backdrop/outside tap behavior
- address-bar/viewport resizing with `100dvh`
- auth-state change while a form has been opened
- keyboard focus order and focus restoration

## Existing carry-forward items

Not introduced by Turn 5:
- participant names should become semantic headings when `renderParticipants()` is next edited
- admin participant `+ Add` controls need participant-specific accessible names
- owner metadata edit must move to Edge Function before production merge

## Relevant Turn 5 commits

- `c2b545b2a606a4bb884ab2c7dbadbe8dfad52773` — brokerage worksheet form markup
- `5500c26b10249d0194334cf892593722b0b204c2` — paper form sheet and mobile help styling
- `48af2d5e5fd39a912aaabf3289bbd60c34e8d1d3` — structured help content and modal identity
- `22f7a1f3091ec349d6cd5059ec590891f3ac248e` — form semantic/preview-label correction
- `b29266e326ea9ae6be294976e12808070fa1eeac` — help lifecycle wording correction
- `d397b924d89dd2e4b6a33c1a1b20a2b7c71ca95e` — CSS-state body lock for mobile help

## Next canonical step

Turn 6 — The Receipts / leaderboard.
