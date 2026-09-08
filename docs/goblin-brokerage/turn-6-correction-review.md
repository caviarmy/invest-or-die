# Goblin Brokerage Redesign — Turn 6 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Initial Turn 6 code head:** `937308726c63a872311dd340d44d1bc194f357e9`  
**Correction code head:** `9b8b1e64dd8485d23d18777606a036be34006c92`  
**Status:** CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-08

## Review posture

This review treated the Turn 6 completion record as a set of claims to challenge rather than evidence that the implementation was correct. It re-checked the Receipts implementation against backend state semantics, legal numeric bounds, breakpoint transitions, prior-turn invariants, accessibility/readability, and the redesign philosophy of **human system, goblin damage**.

## Findings and corrections

### 1. Weekly rows used an invented `Approved` state

The initial renderer mapped every `weekly_win` row to `Approved`, even though Win the Week has no approval lifecycle.

Why this mattered:
- status-like visuals must be backed by real state;
- decorative bureaucracy must not invent application behavior;
- it weakened the human-system premise by making the ledger less truthful.

Correction:
- weekly rows now use `Recorded`;
- Approved/Rejected stamps remain exclusive to actual Called It review outcomes.

### 2. Under Review payout looked final

`results_history.reward_amount` is zero while a Called It challenge is Under Review and becomes the configured payout only when the authoritative review outcome is recorded. Rendering the stored zero as `$0.00` exposed an implementation representation as if it were a final financial result.

Correction:
- Under Review payout renders `—`;
- unknown-status payout also renders `—`;
- Rejected may render authoritative `$0.00`;
- Approved renders the recorded payout;
- weekly rows render their recorded reward value.

### 3. Approve button could promise a stale payout

The initial admin control displayed `Approve +$X` from the dashboard settings already loaded in the browser. Approval itself does not submit that amount; the backend/database determines the authoritative payout when the review state is recorded.

Correction:
- the control now says `Approve`;
- the resulting ledger displays the authoritative payout after refresh.

### 4. Breakpoint review checked phones but missed the first desktop width

The initial source review concentrated on 320–360px. History switched to a six-column table at 700px, where the 9% non-wrapping Prize column was too narrow for the legal `$1,000.00` payout.

Correction:
- vertical receipt mode now applies through 899px;
- the six-column table begins at 900px;
- desktop Prize allocation increases from 9% to 11%;
- breakpoint-boundary testing is now required at `breakpoint - 1` and `breakpoint`/`breakpoint + 1` as applicable.

### 5. Visual subordination reduced readability

The Delete row action met the 44px hit-target requirement but used 8px text and reduced opacity.

Correction:
- history admin action text is now 10px;
- Delete remains visually subordinate through border/color/hierarchy rather than opacity;
- minimum hit target remains 44px.

## Regression review

No Turn 4/5 controller or backend regression was introduced by either the original Turn 6 implementation or this correction.

Unchanged:
- `js/plays.js`
- `js/market.js`
- `js/auth.js`
- `js/called-it-ui.js`
- Called It Edge Function
- Supabase schema/RLS/RPCs
- review/cooldown authority
- exact-row history deletion behavior
- approved-only Called It leaderboard counting

Correction changes are confined to `js/app.js` Receipts rendering and `css/site.css` Receipts styles plus documentation.

## Philosophy review

The paper ledger direction remains aligned with the redesign. No additional goblin decoration was added.

The correction specifically reinforces the premise:
- the **human system** layer must be credible and truthful;
- the goblin layer can be funny or damaged, but must not fabricate financial/application state;
- `PERMANENT RECORD` remains an intentional bureaucratic joke/asset requested by the architecture and should be re-audited during the later goblin-seasoning turn for whether it reads as joke rather than literal guarantee.

## Prompting failures that allowed the misses

The existing review language was strong but underspecified in five places.

1. **Status truth was not provenance-driven.** Asking whether status copy is “real” was insufficient. The review must force every visible status to name its authoritative source or identify itself as static/decorative.
2. **Sentinel testing stopped at data type coercion.** `0` can be numerically legitimate while still being semantically provisional. Review must distinguish storage representation from user-facing finality.
3. **Responsive review was device-sample driven.** Checking 320–360px does not test the weakest width of a wider layout. Every breakpoint must be tested at its boundary with worst-case content.
4. **Touch-target review did not include text readability.** A 44px target can still contain inaccessible microtext. Hit area, font size, and contrast must be reviewed separately.
5. **Action labels were not compared to mutation authority.** Any value displayed on an action button must be the same value the authoritative mutation will use, or the button must omit the value.

## New mandatory review pattern

For future turns, the architecture/control checklist now requires:

- a **state provenance matrix** for every status-like label, stamp, color, amount, badge, and action promise;
- a **semantic-value audit** that asks whether stored zero/blank/default values are final, pending, fallback, or placeholder;
- a **breakpoint-boundary matrix** that checks worst-case content at each layout mode's minimum width and immediately around every breakpoint;
- an **authority-label audit** for mutable values displayed on controls/actions;
- a **readability-after-subordination audit** covering hit target, text size, opacity, and contrast separately;
- a short **adversarial correction review** after implementation and before the next turn is marked canonical.

## Correction commits

- `3ab46eff0dc831b38e84ed7484d4ebf5b9e40abb` — correct state/payout/action semantics
- `9b8b1e64dd8485d23d18777606a036be34006c92` — correct responsive/table/admin-control presentation

## Deferred runtime QA

Still deferred to integrated QA:
- Android Chrome receipt wrapping;
- 899px/900px runtime transition;
- IBM Plex metrics in desktop columns;
- screen-reader behavior after table-to-record CSS reflow;
- signed-in admin review/reset/delete interaction end to end.
