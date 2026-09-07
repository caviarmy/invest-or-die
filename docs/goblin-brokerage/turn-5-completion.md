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

This turn changed frontend presentation and controller behavior only where required to keep the redesigned form truthful and accessible.

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
- `js/app.js`
- `css/site.css`
- `index.html`

No changes were made to:
- `js/auth.js`
- `js/market.js`
- `js/plays.js`
- Supabase schema/RLS/RPCs
- Edge Functions
- Rules page
- Receipts layout/rendering

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

Turn 5 improved source-level accessibility:
- ticker search has an explicit `label for`
- explanation textarea has an explicit `label for`
- portfolio action has an explicit `label for`
- amount input has an accessible hidden label
- direction choices live inside a `fieldset` with `legend`
- direction buttons expose selected state with `aria-pressed` and the controller updates it when selection changes
- quote and goal are represented as `output` elements with live-region behavior
- modal close control remains at least 44×44px
- opening a modal now moves focus into the intended first control
- manually closing a modal attempts to restore focus to the element that opened it when that element still exists
- Called It help updates its summary accessible name between open and closed states

Ticker autocomplete remains a normal collection of real buttons. A temporary attempt to label it as an ARIA listbox was removed during source review because the application does not implement full listbox keyboard semantics. Native button behavior is more truthful and robust.

### Turn 4 accessibility carry-forward resolved

Because `app.js` was already being edited for modal/form behavior, the two inexpensive participant semantics deferred from Turn 4 were completed in the same canonical renderer:
- participant names now render as semantic `h3` headings
- admin `+ Add` controls now have participant-specific accessible names

No participant visual redesign was added in Turn 5.

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

The help copy reflects this accurately: the official starting price and goal are recorded when the call is filed, not merely when a ticker preview is displayed.

Typing a new ticker search clears both the selected ticker and the displayed goal until a real result is selected, so the form no longer leaves an old target visible while the stock selection is unresolved.

### Admin edit

An existing admin-edited challenge initially shows its stored original call price.

The visible label is `PRICE BASIS`, not `CURRENTLY TRADING AT`, because the displayed stored reference price is not necessarily current.

The initial target is now taken from the challenge's stored authoritative target fields. It is not recalculated from the current global game settings merely because the editor opened. This matters if Called It percentages were changed after the challenge was originally filed.

When ticker or direction changes, the existing controller obtains a fresh quote because the server will restart challenge terms. If the admin reverts to the original ticker/direction before saving, the original stored price and target are restored.

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
- body scroll continues to be locked/unlocked by the canonical modal functions

Desktop:
- sheet is centered
- width is capped
- viewport height is bounded with `100dvh`

The existing modal implementation was extended rather than replaced with a second layer. No observer or compatibility shim was introduced.

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

The quick guide describes the real lifecycle:
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

Turn 5 did not change the shared direction wording or challenge-slip visual semantics established after the Turn 4 correction review.

The temporary ticker ARIA-role change was removed before completion rather than leaving incomplete keyboard semantics.

The only `app.js` changes outside the direct form/modal controller were the two previously documented participant accessibility fixes. Receipts/history layout and action logic were not redesigned.

## Static verification performed

- read authoritative v4 Turn 5 requirements before work
- branch started 41 commits ahead / 0 behind `main`
- read current form rendering, modal logic, auth lifecycle, ticker search, market requests, and help markup/CSS
- preserved all controller-required form names/data attributes
- syntax-checked the rewritten `called-it-ui.js` with `node --check`
- parsed the updated homepage HTML successfully
- checked CSS brace balance
- checked committed CSS/Called It UI/homepage Git blob SHAs against locally validated source snapshots
- re-fetched and source-reviewed the final `app.js` controller changes after write
- reviewed nullable/missing price/target output
- reviewed preview wording and stored-target behavior against create/admin-edit server semantics
- reviewed direction-selection accessibility state
- reviewed mobile scroll topology
- compared Turn 5 against its start commit for unexpected files

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
- stored original target display after settings changes
- help open/close repeatedly
- backdrop/outside tap behavior
- address-bar/viewport resizing with `100dvh`
- auth-state change while a form has been opened
- keyboard focus order, focus containment, and focus restoration after rerendering

## Existing carry-forward items

- owner metadata edit must move to Edge Function before production merge
- full modal focus trapping/Tab-cycle behavior remains part of the integrated accessibility/runtime QA gate; Turn 5 adds correct focus entry/restoration but does not install a custom focus-trap framework

## Relevant Turn 5 commits

- `c2b545b2a606a4bb884ab2c7dbadbe8dfad52773` — brokerage worksheet form markup
- `5500c26b10249d0194334cf892593722b0b204c2` — paper form sheet and mobile help styling
- `48af2d5e5fd39a912aaabf3289bbd60c34e8d1d3` — structured help content and modal identity
- `22f7a1f3091ec349d6cd5059ec590891f3ac248e` — form semantic/preview-label correction
- `b29266e326ea9ae6be294976e12808070fa1eeac` — help lifecycle wording correction
- `d397b924d89dd2e4b6a33c1a1b20a2b7c71ca95e` — CSS-state body lock for mobile help
- `26286d5431ba1a8bb412d92306df70513c60c21a` — stored admin target, modal focus, and participant accessibility correction
- `fb021591d4a06b7e3a1e44f1617704a58c66ac1d` — accessible direction-selection state
- `9f9968c55127a59044c39abe8f1cf600d1647808` — final admin preview/input truth and help accessible-state correction

## Next canonical step

Turn 6 — The Receipts / leaderboard.
