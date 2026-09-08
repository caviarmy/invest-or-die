# Goblin Brokerage Redesign — Turn 5 Called It Form, Modal, and Help

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `40f8b1fe6aaac32d36e0aff8321611e93b8ca18a`  
**Status:** CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Completed:** 2026-09-07  
**Correction review:** `turn-5-correction-review.md`

## Goal

Redesign the Called It create/edit interaction as a financial/brokerage worksheet while preserving the one-play controller, market-price authority, direction/action rules, owner/admin permissions, and mobile close/scroll behavior.

Turn 6 Receipts/leaderboard work was deliberately not started.

## Environment / authority matrix

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- shared backend: production Supabase, unchanged
- create/check/submit/cancel/admin-edit authority: existing `called-it` Edge Function, unchanged
- owner metadata edit: existing transitional `edit_own_called_it_metadata` RPC, unchanged
- ticker search: existing `securities` queries, unchanged
- market quote preview: existing `previewCalledIt` request, unchanged
- backward-compatibility impact on live frontend: none because `main` and the shared backend were not changed

The deployed `called-it` Edge Function was re-read during correction review. Its preview action returns `security`, `quote`, and current Called It `settings`; create/admin-edit remain server-authoritative and fresh-fetch/recalculate terms when required.

## Files changed during Turn 5 and correction review

Runtime frontend:
- `js/called-it-ui.js`
- `js/app.js`
- `css/site.css`
- `index.html`

Documentation:
- `docs/goblin-brokerage/turn-5-completion.md`
- `docs/goblin-brokerage/turn-5-correction-review.md`
- `docs/goblin-brokerage/implementation-control.md`

No changes were made to:
- `js/auth.js`
- `js/market.js`
- `js/plays.js`
- Supabase schema/RLS/RPCs
- Edge Functions
- Rules page
- Receipts layout/rendering

## Final form design

The single-play editor remains an off-white paper brokerage sheet with hard rules, rectangular/bottom-rule controls, mono financial values, and the sentence structure:

- `I THINK`
- current price / price basis
- `WILL`
- target/goal
- `BECAUSE`
- `SO I AM`

The correction review applies **label economy**. Redundant mode/register labels such as `NEW CALL`, `ADMIN REFILE`, `OWNER CORRECTION`, `CALL DESK / QUICK GUIDE`, owner-edit `STOCK`/`LOCKED CALL`, and the extra modal kicker were removed. The useful slip identifier remains minimal (`SLIP 01`, etc.). Necessary semantic form labels/accessibility names remain intact.

This is now an explicit design principle: if hierarchy/context/control affordance already communicates the meaning, do not add another visible label merely to narrate it.

## Direction / action behavior

Unchanged:
- Up → Buy / Hold
- Down → Sell / Not Buying
- Flat → Hold / Not Buying

The controller continues to narrow the action choices when direction changes and hides the amount input for Not Buying.

## Quote / target behavior after correction review

### New calls

Selecting a ticker starts a preview request. The browser target is now calculated from the **quote and settings returned by that same preview response** rather than mixing a fresh quote with the older dashboard settings snapshot.

Official terms are still created by the server when the call is filed. The client preview is advisory and can change before save.

### Async request identity

Quote/search work is now invalidated when it no longer belongs to the current selection:
- every ticker input event advances the search sequence, including clearing the field;
- selecting a result invalidates pending search/debounce work;
- quote preview requests have their own monotonically increasing identity;
- a quote response is applied only if that request is still current and the selected ticker still matches;
- clearing/changing the ticker invalidates old quote work;
- closing/replacing the Called It form invalidates quote work from the old form;
- detached/replaced forms cannot write late success/error state into the current modal.

This fixes the possible AAPL→MSFT late-response mismatch found during review.

### Admin edits

Opening an existing active call preserves its stored historical call price and target. The UI does not recalculate historical terms from today's global settings merely because the editor opened.

Changing ticker or direction triggers a fresh preview because the server will restart terms. Reverting to the original ticker/direction restores the stored original terms.

### Missing numeric state

The existing null-safe financial formatter remains in place. Correction review extended the sentinel rule to temporary DOM state: absent preview settings are omitted/deleted rather than represented as blank dataset strings, avoiding `Number('') === 0` false-zero coercion.

## Owner edit

Owner edit remains intentionally narrower than admin edit:
- stock/prediction/official target remain locked;
- explanation and permitted portfolio action/amount remain editable;
- owner metadata still uses the transitional SECURITY INVOKER RPC.

The RPC-to-Edge `owner_edit` cutover remains a required pre-merge item because production `main` shares the backend and still depends on the RPC.

## Modal behavior after correction review

The paper sheet remains the deliberate scroll surface on mobile and uses `100dvh`, safe-area padding, a sticky header, and the canonical body-scroll lock.

Accessibility was strengthened:
- focus moves into the modal on open;
- background body siblings are `inert` while a modal is open;
- Tab/Shift+Tab is contained within the open modal;
- Escape and explicit close remain available;
- close clears inert/body-scroll state;
- focus restoration is attempted when the opener still exists.

Actual keyboard/browser/device runtime QA remains deferred.

## Help behavior after correction review

Called It help remains native `<details>` rather than a custom state machine.

Mobile:
- fixed paper bottom sheet
- non-blurred pointer-intercepting backdrop
- background page scroll locked while open
- 44px minimum help toggle target
- 72×44px mobile close target
- contained help scrolling only when needed

The help copy describes the real lifecycle and avoids hardcoding the payout amount.

## Mobile/layout corrections

Source-level fixes from the correction review:
- ticker-result rows have a 44px minimum touch target;
- action select + amount stack below 381px instead of forcing long native select text into a narrow two-column layout;
- paper modal/help surfaces explicitly use `color-scheme: light` for native control consistency;
- no nested two-slot manager or repeated nested vertical scroll region was introduced.

## Structural accessibility

Turn 5 also resolved the Turn 4 carry-forward items while `app.js` was already being edited:
- participant names render as semantic `h3` headings;
- admin `+ Add` controls have participant-specific accessible names.

Direction buttons expose `aria-pressed`; ticker results remain native buttons rather than pretending to be an ARIA listbox without listbox keyboard behavior.

## Thematic assessment

Turn 5 remains aligned with the redesign premise:
- financial paperwork is still the base visual language;
- hard rules/type/form structure replace SaaS card soup;
- goblin personality remains seasoning rather than novelty art;
- controls remain legible and recognizably functional;
- the label-economy correction reduces the AI-design tendency to explain obvious hierarchy with extra uppercase micro-labels.

No visual rethink is required before Turn 6.

## Verification performed

Source-level review included:
- re-read of the v4 Turn 5 requirements and implementation-control gates;
- re-read of the deployed `called-it` Edge Function preview/create/admin-edit semantics;
- final branch-file re-fetches after correction writes;
- async request/selection identity review;
- preview quote/settings snapshot review;
- admin historical-term review;
- DOM numeric-sentinel review;
- modal focus/background contract review;
- source-level touch-target and 320–380px layout review;
- visible-label economy review;
- branch-vs-`main` comparison for accidental backend changes.

## Runtime QA status

**CODE COMPLETE:** yes.  
**CORRECTION REVIEW COMPLETE:** yes.  
**QA COMPLETE:** no.

Per project direction, actual Android/browser QA remains deferred until the integrated QA turn.

Still to verify at runtime:
- rapid ticker A→B selection under intentionally delayed/out-of-order responses;
- clear ticker while search is in flight;
- close/reopen modal while quote request is in flight;
- settings changed elsewhere before a new preview;
- repeated modal/help open/close and body-scroll recovery;
- Android ticker-result/help touch behavior;
- virtual keyboard behavior;
- 320–380px action layout;
- owner/admin save/cancel flows;
- Tab/Shift+Tab containment and focus restoration;
- external auth-state change while a modal has been used.

## Correction-review prevention rules

The master architecture and implementation-control file now require:
- request identity for selection-dependent async UI;
- invalidation of in-flight work on clear/new-selection/close/replacement;
- one coherent authoritative snapshot for derived previews when available;
- stale/detached components cannot mutate current shared UI;
- full modal interaction contract, not focus entry alone;
- ~44px audit for every custom interactive target;
- label economy/context-first labeling;
- numeric sentinel review for temporary DOM/serialized state, not only API/database formatters.

See `turn-5-correction-review.md` for the full causal analysis.

## Relevant correction commits

- `bd169e1e7776df6b465f7d1204423cbc2a53b2ef` — preview request identity and modal focus containment
- `6feae4371bfd72a3467f8fc99db012a6749dbb4d` — reduce redundant form labels
- `b3ce4395b3aeb1fdef3a2578d56ea5f1dc3dfae3` — touch targets, narrow action layout, light paper controls
- `22d17e84305f9d7f64ee907e15b5cede1d16f2cf` — remove redundant help/modal labels
- `f0355cd7e28b1e69ca09e65ce09540262dfe222d` — final async invalidation, detached-form guard, and dataset sentinel correction

## Next canonical step

Turn 6 — The Receipts / leaderboard.
