# Goblin Investing Visual Re-Redesign — R3 Correction Review

**Branch:** `goblin-visual-reredesign`  
**R3 base:** `29b3f3c8ecc413fa1285b84fe5d92cdb5afead03`  
**Status:** CLOSED-LOOP VISUAL REVIEW COMPLETE / OWNER CORRECTION PASS COMPLETE / R4 LIVE RUNTIME QA NOT STARTED

## Review method

R3 was reviewed as a whole-site visual integration turn rather than by source inspection alone.

The candidate surfaces were rendered in local Chromium using the actual R3 HTML/CSS with representative application data/state where live backend access was unavailable. The review covered the R3 steering requirements: Rules, identity, operator/admin/edit/help surfaces, lesson independence, card-soup/repetition, responsive behavior, and accessibility safeguards.

## Initial R3 corrections

### Mobile Rules seal collision

The first narrow Rules render placed the circular `DESK 03` cover seal too low, allowing it to overlap the `OPERATING` title. The mobile seal was reduced and moved upward while preserving the desktop cover composition.

### Lesson rounded-card repetition

The lesson correctly had its own editorial identity, but repeated rounded hero, chart, future, add-on, safety, comparison, and modal containers created the card-soup pattern R3 was required to challenge. Those surfaces were restyled around editorial rules, sidebars, divided data rows, and flat comparison structures while preserving the article's content, pacing, calculations, and voice.

### Mobile help close-control regression

The first R3 help render allowed the new paper summary styling to win the cascade over the mobile `CLOSE` presentation. The mobile R3 help rules now explicitly preserve the contained bottom sheet and its clear close control.

### Lesson proof timing

The first article proof captured reveal/counter content mid-transition. The proof harness was corrected to wait for the existing animation duration before capture; runtime animation behavior was not changed for this issue.

## Owner correction pass after R3 review

The owner reviewed the rendered R3 proofs and requested six additional visual corrections. These were implemented as an R3 correction pass rather than starting R4.

### 1. Remove Rules `Desk Directory`

The directory section duplicated obvious site navigation and weakened the manual's procedural hierarchy. It was removed entirely. Subsequent manual section numbers were collapsed so Called It is section `02` and Win the Week is section `03`.

All existing `rules.js` dynamic IDs and data attributes remain unchanged.

### 2. Modal sizing

Auth, admin, and Called It edit surfaces were visually correct in material language but too willing to become full-height drawers on narrow screens.

The correction layer now keeps these as content-sized working sheets:

- auth is capped at 72% of the mobile viewport;
- admin is capped at 76%;
- Called It edit is capped at 80%;
- desktop admin is widened to a practical working width and capped at 76% viewport height;
- overflow remains internal to the sheet when the form is longer than the available height.

No modal controller, focus, inert-background, Escape, validation, or save behavior changed.

### 3. Weekly-result unavailable typography

The owner proof exposed a fail-closed weekly-result headline inheriting too much of the oversized winner typography and breaking into huge fragments.

The unavailable winner selector now has its own bounded display scale and normal wrapping. The final 390 px proof renders `WEEKLY RESULT UNAVAILABLE.` as a clear two-line message within the posted result sheet.

### 4. Receipts leader hierarchy

The previous all-time leader blocks gave individual record holders nearly the same visual prominence as receipt history entries.

The corrected summary is now two compact category rows:

- category is the primary left-aligned callout (`WEEKLY WINS`, `CALLED IT WINS`);
- a dotted ledger rule carries the eye across the row;
- record holder and count are secondary and right-aligned.

This preserves all existing leader IDs and runtime rendering.

### 5. Desktop opening-section width

The CRT weekly requirement and training folder were intentionally narrower during R2, but the owner review correctly identified that this made the top of the desktop homepage feel disconnected from the wider Win the Week / Called It / Receipts composition.

At desktop widths both opening artifacts now use the full homepage shell width. Mobile widths remain unchanged.

### 6. Called It empty-ticket height

A hard fixed-height card with internal scrolling was rejected because it would weaken the physical-ticket metaphor and usability.

Instead, each two-ticket filing row now uses normal CSS grid stretch behavior:

- a filled ticket is free to grow to the height its content requires;
- its unused sibling stretches to the same row height;
- no ticket-body scrollbar is introduced;
- two empty tickets retain the shared baseline minimum height.

The representative desktop proof measured the filled and unused tickets within approximately 1 px of one another while preserving natural content flow.

## De-AI review results

### Homepage

Passed. The artifact system remains distinct: CRT terminal, training folder, posted winner evidence, Called It filing rail, and continuous-feed Receipts.

### Called It

Passed. Multi-call and empty-ticket proofs retain immediate prediction hierarchy and physical filing-ticket identity. The empty ticket now has the same physical depth as its used sibling without becoming a scroll container.

### Receipts

Passed after owner correction. Leader summaries now read as ledger headers rather than historical receipt entries.

### Rules

Passed after owner correction. The redundant Desk Directory is removed; the page remains an operations binder/manual rather than antique paper or a card collection.

### Lesson

Passed. The editorial surface remains intentionally distinct from the brokerage office system.

### Operator surfaces

Passed after owner correction. Auth/admin/edit surfaces remain office forms while using proportionate sheet dimensions rather than mandatory full-screen drawers.

## Responsive / owner-correction proof

The owner correction pass reviewed:

- desktop full-width terminal;
- desktop full-width lesson folder;
- 390 px unavailable weekly result;
- 390 px Receipts leader hierarchy;
- desktop filled + unused Called It ticket pair;
- 390 px auth sheet;
- 390 px admin sheet;
- 390 px Called It edit sheet;
- 390 and 1440 px Rules after Desk Directory deletion.

No horizontal document overflow appeared in the corrected 390 or 1440 px page proofs.

## Accessibility / functional review

No application authority-bearing JavaScript was changed in R3 or in this correction pass.

Confirmed:

- Rules retains the existing `rules.js` settings hooks and live status region;
- homepage modal runtime ownership remains in the existing controller;
- the correction layer changes only sizing/material/layout, not focus or interaction behavior;
- reduced-motion rules remain present;
- the R2 fail-closed `[hidden]` safeguard remains intact.

Actual device/auth/backend behavior remains an R4 runtime-QA concern rather than something inferred from screenshots.

## Conclusion

No known visual/source blocker remains for R3 after the owner correction pass. The branch remains the visual release candidate ready for R4 real-runtime QA.

No merge to `main` was performed. R4 has not started.
