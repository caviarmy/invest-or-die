# Goblin Brokerage Redesign — Turn 4 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn 4 completion head reviewed:** `8719fac2ae04474f94c91f828c340eca9add1967`  
**Status:** CORRECTION CODE COMPLETE / RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-07

## Purpose

Review Turn 4 as code rather than trusting its completion summary, correct source-level issues before Turn 5, and turn the missed issue classes into mandatory architecture checks.

## Corrections made

### Shared direction helper no longer leaks Turn 4 presentation into other sections

Turn 4 changed the exported `directionLabel()` helper to put the market symbol first and to add a flat arrow. That helper is also used by Receipts/history and the owner-edit form, so a Turn 4 presentation change unintentionally altered surfaces reserved for later turns.

Correction:
- restored the shared semantic `directionLabel()` output to its pre-Turn-4 behavior;
- added a private `slipDirectionLabel()` used only by the brokerage slip;
- the Turn 4 slip keeps `📈 GOES UP`, `📉 GOES DOWN`, and `→ FINISHES ABOUT THE SAME` without changing Receipts or form presentation early.

### Empty-slot instruction is now role-safe

The same challenge renderer is used for an owner and for an admin managing another participant. The prior empty state said `Use Add Challenge`, which names the owner's global control and is not the admin's participant-specific `+ Add` control.

Correction:
- changed the instruction to `Use the add control above to file the next prediction.`
- this remains correct for either management path without pretending both roles use the same named control.

### Empty tickets are actually compact

Turn 4 visually lightened empty slots but left them inheriting the populated slip's desktop minimum height. CSS Grid also stretches sibling items by default, so an empty slip could still become as tall as a populated slip in the same row.

Correction:
- `.slot-list` now uses `align-items:start`;
- empty slips have their own smaller minimum height;
- desktop explicitly preserves the smaller empty-slip height after the populated `.play-slot` desktop rule.

### Money formatting now rejects missing sentinel values before numeric coercion

JavaScript converts `null` and an empty string to numeric zero. The shared `money()` formatter previously called `Number(value)` immediately, so missing monetary data could display as `$0.00`.

Correction:
- `money(null)`, `money(undefined)`, and blank strings now render `—`;
- a legitimate numeric `0` still renders `$0.00`;
- `goalLabel()` now avoids forms such as `—+` or `— or lower` when target data is missing;
- action amount display now renders a missing amount as `—` rather than silently dropping the value.

This applies the existing project invariant that an unchecked/null market price must never be interpreted as zero at the common formatting boundary.

### Removed nested vertical scrolling from challenge explanations

The prior `.reason-copy > div` rule created a nested `overflow:auto` region inside every long challenge slip. On a touch device that makes page scrolling compete with inner slip scrolling.

Correction:
- removed the internal vertical scrolling constraint;
- explanations now expand in normal document flow;
- long URLs/text still wrap using the existing slip rules.

### Narrow participant headers are more defensive

Participant headers now allow wrapping, and the action group is kept together at the end of the header. This reduces squeeze risk for long participant names on narrow viewports.

## Known accessibility cleanup still carried forward

Two source-level accessibility improvements identified in review were not forced into this correction commit because they live in `app.js` participant rendering rather than the Turn 4 slip renderer:
- change the participant-name element from a plain `div` to an actual heading;
- give each admin `+ Add` button a participant-specific accessible name instead of relying on the repeated visible `+ Add` text plus `title`.

These are not functional blockers, but the master plan now requires semantic-structure/accessibility checks during the structural turn itself instead of waiting for the final Turn 9 audit. They must be resolved before production merge, preferably the next time canonical participant rendering is edited.

## Why the previous architecture checks did not catch these

### 1. No shared-consumer blast-radius check

The process required scope discipline, but it did not require enumerating all consumers before changing an exported formatter/label/helper. A tiny shared-helper edit therefore modified Receipts and the owner-edit form even though Turn 4 was scoped only to slips.

**Prevention:** before changing an exported helper, shared CSS utility, or shared render primitive, enumerate every known consumer and explicitly confirm whether each resulting visual/behavior change is in scope.

### 2. Copy was reviewed for truth, not for role/action context

`Use Add Challenge` was not factually false, but it was not the correct named action for every user who could see it.

**Prevention:** instructional copy in a shared component must be checked against a role/access matrix: signed out, owner, admin managing self, admin managing another participant, unavailable/disabled state where relevant.

### 3. Empty-state review stopped at appearance

The plan said empty states should be compact, but review looked at the empty state's own CSS instead of the parent grid's cross-axis behavior. Grid stretch and a later desktop `.play-slot` minimum height could defeat the compact-state rule.

**Prevention:** compact empty-state review must include parent Grid/Flex stretch behavior, inherited/shared min-heights, and mixed rows containing one populated and one empty item.

### 4. The null-price invariant was not connected to common formatters

The master already said null market prices must never become zero. Turn 4 reviewed qualification logic, but did not test the shared display formatter's sentinel inputs. `Number(null) === 0` remained possible at presentation time.

**Prevention:** any numeric/currency formatter touched or relied upon by a redesigned authoritative display must be tested conceptually or mechanically with `null`, `undefined`, blank string, `0`, negative values, `NaN`, and ordinary positive values.

### 5. Bounds review ignored scroll topology

The prior review treated `max-height + overflow:auto` as a bounds safeguard. It did not ask whether that created an undesirable second vertical scroll surface inside a repeated mobile component.

**Prevention:** repeated cards/slips should use normal document flow for variable-height body content. Nested vertical scrolling requires an explicit reason and mobile interaction test; it is not a default overflow solution.

### 6. Accessibility was still being mentally deferred to Turn 9

Turn 4 created a stronger semantic visual hierarchy but retained a non-heading participant name and repeated generic admin button labels. A final accessibility audit is still useful, but structural semantics should be established when the structure is created.

**Prevention:** every structural redesign turn now performs a small semantic accessibility gate: heading hierarchy, accessible control names, touch target size, and status meaning. Turn 9 is verification, not the first time these are considered.

## Verification performed

- re-fetched the current redesign branch before correction;
- compared the redesign branch with `main`;
- re-fetched corrected `called-it-ui.js` and Called It CSS;
- verified `directionLabel()` and slip-only direction presentation are separate;
- verified `money()` rejects null/undefined/blank before `Number()` conversion;
- verified the empty-state instruction no longer names the wrong role-specific control;
- verified `.slot-list` no longer stretches compact empty tickets to populated-slip height;
- verified the nested `.reason-copy > div { overflow:auto }` rule is gone;
- correction code changed only `js/called-it-ui.js` and `css/site.css` before documentation.

## Runtime QA status

**CORRECTION CODE COMPLETE:** yes.  
**QA COMPLETE:** no.

Actual Android/browser runtime testing remains deferred until the integrated QA phase by project direction.

## Next canonical step

Turn 5 — Called It form + modal + help.
