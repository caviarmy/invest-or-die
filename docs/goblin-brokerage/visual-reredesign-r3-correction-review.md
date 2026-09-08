# Goblin Investing Visual Re-Redesign — R3 Correction Review

**Branch:** `goblin-visual-reredesign`  
**R3 base:** `29b3f3c8ecc413fa1285b84fe5d92cdb5afead03`  
**Status:** CLOSED-LOOP VISUAL REVIEW COMPLETE / R4 LIVE RUNTIME QA NOT STARTED

## Review method

R3 was reviewed as a whole-site visual integration turn rather than by source inspection alone.

The candidate surfaces were rendered in local Chromium using the actual R3 HTML/CSS with representative application data/state where live backend access was unavailable. The review covered the R3 steering requirements: Rules, identity, operator/admin/edit/help surfaces, lesson independence, card-soup/repetition, responsive behavior, and accessibility safeguards.

## Finding 1 — mobile Rules seal collided with the cover title

**Finding:** the first narrow Rules render placed the circular `DESK 03` cover seal too low, allowing it to overlap the `OPERATING` title.

**Correction:** the mobile seal was reduced and moved upward while preserving the desktop cover composition.

**Result:** the cover title and seal are both legible at 320 and 390 px without changing the manual metaphor.

## Finding 2 — lesson retained too much generic rounded-card language

**Finding:** although the lesson article correctly had its own editorial identity, it still relied on repeated rounded hero, chart, future, add-on, safety, comparison, and modal containers. Across the whole product this created exactly the repeated-component/card-soup pattern R3 is required to challenge.

**Correction:** the article was restyled around editorial rules, sidebars, divided data rows, and flat comparison structures. Rounded-card repetition was removed while preserving the article's content, long-scroll pacing, dark editorial palette, profanity, calculations, and independent personality.

**Result:** the lesson remains intentionally different from the brokerage office system without looking like a separate generic app-template design system.

## Finding 3 — mobile help proof exposed a close-control specificity regression

**Finding:** the first R3 help render used the new paper treatment but the R3 summary styling won the CSS cascade over the existing mobile `CLOSE` presentation, leaving the `?` control as the visible close action.

**Correction:** the mobile R3 help rules explicitly preserve the viewport-contained bottom sheet and expose a clear `CLOSE` control while the native `details` mechanism remains unchanged.

**Result:** help remains a paper instruction sheet with an obvious close affordance and no horizontal clipping.

## Finding 4 — proof animation timing initially captured lesson content mid-transition

**Finding:** the first screenshot was captured immediately after reveal/counter activation, producing a partially transitioned headline/counter in the proof image.

**Correction:** the browser proof waits for the existing animation duration before capturing the representative article state.

**Result:** the final screenshot represents the settled visual state. This was a proof-harness timing issue; no runtime animation behavior was changed for it.

## De-AI review results

### Homepage

Passed. The R2 artifact system remains distinct and unchanged by R3: CRT terminal, training folder, posted winner evidence, Called It filing rail, and continuous-feed Receipts.

### Called It

Passed. Multi-call mobile proof retains immediate prediction hierarchy and ticket identity. Empty-state proof reads as intentionally unused filing stock rather than an explanatory empty-state card.

### Receipts

Passed. Mobile and desktop remain continuous-feed ledger paper with no added card or badge system.

### Rules

Passed. The page reads as an operations binder/manual, not antique paper and not a web-card collection.

### Lesson

Passed after correction. Editorial data presentation no longer repeats the same rounded container recipe throughout the page.

### Operator surfaces

Passed. Auth/admin/edit/help use restrained office/document materials rather than adding decorative stamps, mascots, or goblin labels.

## Responsive proof set

Reviewed final proof states:

- `r3-home-390.png`
- `r3-home-1440.png`
- `r3-called-multiple-390.png`
- `r3-called-empty-390.png`
- `r3-receipts-390.png`
- `r3-receipts-1440.png`
- `rules-320.png`
- `rules-390.png`
- `rules-desktop.png`
- `lesson-390.png`
- `lesson-content-390.png`
- `lesson-modal-390.png`
- `r3-auth-390.png`
- `r3-edit-390.png`
- `r3-admin-1100.png`
- `r3-help-390.png`

No horizontal document overflow remained in the tested widths.

## Accessibility / functional review

No application authority-bearing JavaScript was changed in R3.

Confirmed from source:

- Rules retains the existing `rules.js` data hooks and live status region;
- lesson modals retain `aria-modal`, valid `aria-labelledby` targets, Escape close, Tab containment, backdrop guard, inert background, and focus restoration;
- reduced-motion handling remains explicit;
- homepage modal/help runtime ownership remains in the pre-existing controller/native disclosure mechanism;
- no R3 visual rule overrides the R2 fail-closed `[hidden]` safeguard.

Actual assistive-technology/device behavior remains an R4 runtime-QA concern rather than something inferred from screenshots.

## Scope audit

Before documentation, the R3-only diff from `29b3f3c8ecc413fa1285b84fe5d92cdb5afead03` contained exactly:

- `assets/goblin-investing-wordmark.svg`
- `css/visual-r3-lesson.css`
- `css/visual-r3-operator.css`
- `css/visual-r3-rules.css`
- `css/visual-reredesign.css`
- `learn/invest-or-die/index.html`
- `rules/index.html`

No JavaScript, backend, auth, market, schema, RLS, migration, RPC, or Edge Function file appeared in the R3 runtime diff.

## Conclusion

No known visual/source blocker remains for R3. The branch is a visual release candidate ready for R4 real-runtime QA.

No merge to `main` was performed. R4 has not started.
