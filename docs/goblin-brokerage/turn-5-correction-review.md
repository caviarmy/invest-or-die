# Goblin Brokerage Redesign — Turn 5 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Shared backend:** production Supabase, unchanged  
**Review date:** 2026-09-07  
**Status:** CORRECTION REVIEW COMPLETE / RUNTIME QA DEFERRED

## Scope

This review re-read the Turn 5 form, modal, help, ticker-search, and preview paths against the v4 redesign brief and the live `called-it` Edge Function.

The visual concept remained correct. The misses were implementation-truth, asynchronous-state, mobile-accessibility, and interface-density issues rather than a need to redesign the form again.

No Supabase schema, policy, RPC, or Edge Function change was made.

## Findings and corrections

### 1. Quote responses could arrive out of order

A preview request was previously applied to whatever ticker happened to be selected when the request completed. A slow response for ticker A could therefore overwrite ticker B's visible price/goal after the user had already moved on.

Correction:
- every quote request now receives a monotonically increasing request identity;
- changing/clearing ticker input invalidates the current quote request;
- selecting another result invalidates earlier search and quote work;
- a quote response is applied only when its request is still current and its ticker still matches the selected ticker;
- detached/replaced forms cannot write a late quote or error into the current modal;
- closing a Called It modal invalidates outstanding quote work from that form.

### 2. A fresh quote was mixed with potentially stale dashboard settings

The deployed `called-it` preview action returns both the quote and the current Called It settings. The browser was using the fresh quote but calculating its target from the dashboard settings loaded earlier with the page.

Correction:
- the form stores the `up`, `down`, and `flat` settings returned with the exact preview response;
- the displayed target is calculated from that same quote/settings snapshot;
- stored historical terms remain authoritative when an existing admin edit has not changed ticker/direction.

This keeps the browser preview internally coherent and substantially closer to the server terms that would be created at that moment. The final create/admin-edit mutation remains server-authoritative and still performs its own fresh quote/settings read.

### 3. Clearing ticker input did not invalidate an in-flight search

The search sequence previously advanced only for a new non-empty query. Clearing the field could therefore allow an earlier request to return and reopen stale results.

Correction:
- the sequence now advances on every input event, including clear;
- selecting a result also advances the sequence and cancels the pending debounce timer.

### 4. Modal semantics stopped at focus entry/restoration

Turn 5 moved focus into the modal and tried to restore it afterward, but `aria-modal="true"` was not matched by actual focus containment/background inaccessibility.

Correction:
- background body siblings are marked `inert` while a modal is open;
- Tab/Shift+Tab cycles within the open modal;
- closing clears inert state and keeps the existing focus-restoration behavior.

Runtime keyboard/device verification is still deferred.

### 5. Some custom controls missed the ~44px touch-target rule

The help toggle/close control and ticker-result rows were smaller than the project's own mobile target guidance.

Correction:
- help toggle is 44×44px;
- mobile help close control is at least 72×44px;
- ticker-result rows have a 44px minimum height.

### 6. Narrow action controls were predictable from source

At 320–360px widths, the action select and amount field could become cramped, especially with options such as `Holding at least $5 I already own`.

Correction:
- at 380px and below, the action controls stack vertically.

### 7. Paper controls inherited the global dark color scheme

The paper sheet is visually light, while the document globally declares a dark color scheme. Native control chrome could therefore vary awkwardly by browser/platform.

Correction:
- the Called It paper modal and mobile paper help sheet explicitly use `color-scheme: light`.

### 8. Turn 5 used more visible labels than the interface needed

The form had accumulated register/mode labels (`CALL WORKSHEET`, `NEW CALL`, `ADMIN REFILE`, `OWNER CORRECTION`), owner-edit micro-labels (`STOCK`, `LOCKED CALL`), a help register (`CALL DESK / QUICK GUIDE`), and a redundant modal kicker. These were thematically defensible individually, but together they reproduced an AI-design habit: narrating structure that users can already infer from hierarchy and context.

Correction:
- the form register is reduced to the useful record identifier `SLIP 0N`;
- mode labels were removed;
- owner-edit `STOCK` / `LOCKED CALL` micro-labels were removed while the actual ticker/direction/price and explanatory lock note remain;
- `CALL DESK / QUICK GUIDE` was removed;
- the redundant Called It modal kicker was removed;
- payout help text is normal prose rather than another uppercase label.

Necessary form labels and accessible names remain. This is visual label economy, not removal of semantics.

### 9. A sentinel bug almost reappeared inside the correction itself

An early correction represented absent preview settings as empty `dataset` strings. Because `Number('') === 0`, that would have made missing settings appear to be a legitimate `0/0/0` snapshot.

Correction:
- absent preview dataset properties are deleted rather than stored as blank strings;
- snapshot parsing falls back only when a complete finite preview setting set is present.

This extends the existing missing-financial-data rule beyond API/database values to temporary DOM state.

## Why the existing instructions did not catch these earlier

The v4 architecture had several relevant rules, but they were too semantic and not mechanical enough.

### Preview/save truth did not define asynchronous ownership

The brief correctly required fresh preview semantics when the server would restart terms, but it did not require a response to prove it still belongs to the current selection and current UI instance.

New prevention rule: **every asynchronous response that mutates selection-dependent UI must carry/request-check an identity and the selected entity before it is applied.** Clearing, replacing, or closing the component invalidates prior work.

### Preview/save truth did not require one coherent snapshot

The brief asked whether preview matched save, but did not explicitly prohibit composing one preview from independently aged sources.

New prevention rule: **when one authoritative response returns both a base value and the parameters used to derive a displayed result, render from that same response snapshot.** Do not mix a fresh quote with stale settings when the server already returned both.

### Clearing dependent values did not include in-flight work

The prior gate said to clear stale visible values when a selection becomes unresolved. That addressed displayed state, not pending asynchronous work capable of restoring the stale state.

New prevention rule: **invalidation includes pending requests/timers, not only visible DOM values.**

### Accessibility gate named focus entry/restoration, not the full modal contract

New prevention rule: **a modal with `aria-modal=true` must be reviewed as a complete interaction contract: focus entry, background inertness, focus containment, Escape/close path, body-scroll recovery, and focus restoration.**

### Touch-target review was too control-specific

The project had a ~44px rule, but review attention centered on conventional buttons/close controls rather than every custom clickable row/toggle.

New prevention rule: **audit every interactive hit target introduced or materially restyled in a turn, including rows, disclosure summaries, icon controls, and autocomplete options.**

### The design critique identified micro-labels but lacked a label-economy rule

The original redesign correctly called tiny uppercase kicker labels an AI-design tell, but later artifact styling made it easy to reintroduce them under the justification of brokerage bureaucracy.

New design principle: **label economy / context-first labeling. Before adding a visible label, ask what ambiguity it resolves. If hierarchy, value format, affordance, or surrounding context already communicates the meaning, omit it.** Keep semantic/accessibility labels even when the visible interface does not need another caption.

### Sentinel checks were scoped too narrowly

The existing numeric-boundary rule focused on financial formatters. Temporary DOM attributes/dataset values can create the same JavaScript coercion problem.

New prevention rule: **sentinel checks apply at every numeric boundary, including DOM attributes/dataset, URL/query parameters, local storage, and form serialization. Blank string is not a safe representation of missing numeric data.**

### There was no stale-component contamination rule

New prevention rule: **an async completion from a detached/replaced component may not update shared status/error surfaces.** Verify component identity/connectivity before applying either success or failure UI.

## Thematic review

The Turn 5 visual direction remains aligned with `Human system, goblin damage`:
- paper brokerage form remains the primary visual metaphor;
- hard rules and form hierarchy do the work instead of nested cards;
- goblin seasoning remains restrained;
- no fantasy/mascot/AI-art direction was introduced;
- controls remain functional rather than being disguised for theme.

The label-economy correction strengthens the anti-AI-design goal. Financial bureaucracy is useful as a structural metaphor, but the site should not simulate bureaucracy by putting a caption on every obvious object.

## Runtime QA status

**SOURCE/CODE CORRECTION:** complete.  
**ANDROID/BROWSER QA:** deferred.

Integrated QA still needs to verify:
- rapid A → B ticker selection with intentionally slow/out-of-order responses;
- clearing ticker while a search is in flight;
- closing/reopening the modal while a quote is in flight;
- settings changed in another admin session before a new preview;
- Tab/Shift+Tab focus loop and focus restoration;
- Android help/ticker-result touch behavior;
- virtual keyboard and 320–380px action layout;
- repeated modal/help open/close and body-scroll recovery.

## Correction commits

- `bd169e1e7776df6b465f7d1204423cbc2a53b2ef` — preview request identity and modal focus containment
- `6feae4371bfd72a3467f8fc99db012a6749dbb4d` — reduce redundant form labels
- `b3ce4395b3aeb1fdef3a2578d56ea5f1dc3dfae3` — touch targets, narrow action layout, light paper controls
- `22d17e84305f9d7f64ee907e15b5cede1d16f2cf` — remove redundant help/modal labels
- `f0355cd7e28b1e69ca09e65ce09540262dfe222d` — final async invalidation, detached-form guard, and dataset sentinel correction

## Next canonical step

Turn 6 — The Receipts / leaderboard, after this correction record and master architecture update are committed.
