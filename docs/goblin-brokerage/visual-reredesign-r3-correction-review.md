# Goblin Investing Visual Re-Redesign — R3 Correction Review

**Branch:** `goblin-visual-reredesign`  
**R3 base:** `29b3f3c8ecc413fa1285b84fe5d92cdb5afead03`  
**Status:** CLOSED-LOOP VISUAL REVIEW COMPLETE / OWNER CORRECTION PASSES COMPLETE / R4 LIVE RUNTIME QA NOT STARTED

## Review method

R3 was reviewed as a whole-site visual integration turn rather than by source inspection alone.

The candidate surfaces were rendered in local Chromium using the actual R3 HTML/CSS with representative application data/state where live backend access was unavailable. The review covered the R3 steering requirements: Rules, identity, operator/admin/edit/help surfaces, lesson independence, card-soup/repetition, responsive behavior, accessibility safeguards, and subsequent owner-directed visual corrections.

## Initial R3 corrections

### Mobile Rules seal collision

The first narrow Rules render placed the circular `DESK 03` cover seal too low, allowing it to overlap the `OPERATING` title. The mobile seal was reduced and moved upward while preserving the desktop cover composition.

### Lesson rounded-card repetition

The lesson correctly had its own editorial identity, but repeated rounded hero, chart, future, add-on, safety, comparison, and modal containers created the card-soup pattern R3 was required to challenge. Those surfaces were restyled around editorial rules, sidebars, divided data rows, and flat comparison structures while preserving the article's content, pacing, calculations, and voice.

### Mobile help close-control regression

The first R3 help render allowed the new paper summary styling to win the cascade over the mobile `CLOSE` presentation. The mobile R3 help rules now explicitly preserve the contained bottom sheet and its clear close control.

### Lesson proof timing

The first article proof captured reveal/counter content mid-transition. The proof harness was corrected to wait for the existing animation duration before capture; runtime animation behavior was not changed for this issue.

## First owner correction pass after R3 review

### Remove Rules `Desk Directory`

The directory section duplicated obvious site navigation and weakened the manual's procedural hierarchy. It was removed entirely. Subsequent manual section numbers were collapsed so Called It is section `02` and Win the Week is section `03`.

All existing `rules.js` dynamic IDs and data attributes remain unchanged.

### Modal sizing

Auth, admin, Called It edit, and lesson information sheets were visually correct in material language but too willing to become full-height drawers on narrow screens.

The correction layer keeps them as content-sized working sheets:

- auth is capped at 72% of the mobile viewport;
- admin is capped at 76%;
- Called It edit is capped at 80%;
- lesson information sheets are capped at 86%;
- desktop admin is widened to a practical working width and capped at 76% viewport height;
- overflow remains internal to the sheet when the content exceeds available height.

No modal controller, focus, inert-background, Escape, validation, or save behavior changed.

### Weekly-result fail-closed typography

The owner proof exposed a fail-closed weekly-result headline inheriting too much of the oversized winner typography and breaking into huge fragments.

The failure-state selector now has its own bounded display scale and normal wrapping so a load-failure message remains readable inside the posted-result sheet.

### Receipts leader hierarchy

The prior all-time leader blocks gave individual record holders nearly the same visual prominence as receipt history entries.

They were first compressed into category summary rows with the category on the left and record holder/count on the right. A subsequent owner review found the connecting rules themselves visually noisy; those connectors were then removed in the second correction pass described below.

### Desktop opening-section width

The CRT weekly requirement and training folder were intentionally narrower during R2, but the owner review correctly identified that this made the top of the desktop homepage feel disconnected from the wider Win the Week / Called It / Receipts composition.

At desktop widths both opening artifacts now use the full homepage shell width. Mobile widths remain unchanged.

### Called It empty-ticket height

A hard fixed-height card with internal scrolling was rejected because it would weaken the physical-ticket metaphor and usability.

Instead, each two-ticket filing row uses normal CSS grid stretch behavior:

- a filled ticket is free to grow to the height its content requires;
- its unused sibling stretches to the same row height;
- no ticket-body scrollbar is introduced;
- two empty tickets retain the shared baseline minimum height.

The representative desktop proof measured the filled and unused tickets within approximately 1 px of one another while preserving natural content flow.

## Second owner correction pass — line audit and state wording

The owner then identified two remaining decorative-rule problems in rendered screenshots and questioned whether `Unavailable` was being used for signed-out visitors.

### Receipts connector-line cleanup

The Receipts leader area had accumulated too many horizontal devices at once: title separator, leader container borders, dotted leader connectors, leader row separators, and the history table rule. In the rendered page these read as accidental breaks rather than ledger structure.

The correction removed:

- leader-grid top and bottom borders;
- dotted connectors between category and record holder;
- leader-row separator rules;
- the heading-row bottom rule;
- the heavy history-table bottom rule.

One restrained line remains before the historical rows, where it has a clear document purpose. The final leader hierarchy is now simply:

- category on the left (`WEEKLY WINS`, `CALLED IT WINS`);
- record holder and count on the right;
- whitespace providing the separation instead of connector graphics.

### Training-folder link cleanup

The homepage lesson folder's `Read the file` link used both underlined text and a separate full-width bottom border. The latter looked like a stray line extending away from the action.

The detached rule was removed. Only the words `Read the file` retain a normal text underline, with the arrow remaining separate.

### Whole-site line audit

After those corrections, the homepage, Called It, Receipts, lesson article, and Rules surfaces were reviewed for additional rules that read like arbitrary layout breaks.

Remaining visible lines were retained only where they communicate the represented artifact or a real boundary, including:

- navigation-directory cell divisions;
- CRT readout/baseline treatment;
- posted-result paper/evidence structure;
- Called It ticket form rules;
- ledger row separators within actual receipt history;
- binder/manual page rules;
- editorial data divisions inside the lesson article;
- footer boundary.

No additional connector-style decorative rule analogous to the Receipts and training-folder issues remained in the reviewed mobile or desktop compositions.

## Signed-out versus unavailable semantics

Before changing copy, the repository backend contract was rechecked.

Goblin Investing deliberately exposes the public dashboard to signed-out visitors. Signed-out users are intended to be able to read active participants, current challenges, game settings, weekly winner data, and The Receipts. Authentication is required for participant/admin actions, not for viewing these results.

Therefore R3 does **not** change a public data-load failure into `Log in to see results`. That would incorrectly describe the product's authorization model.

Instead:

- initial placeholders say `Loading…` rather than `Unavailable`;
- genuine public load failures use plain language such as `couldn't load` and, where useful, ask the visitor to refresh;
- leader placeholders no longer display `Unavailable` as though it were a record-holder name;
- the normal signed-out Called It action prompt uses a real clickable `Sign in` control;
- that inline sign-in control delegates to the existing `authButton` behavior and therefore opens the existing authentication modal rather than introducing a second auth path.

This copy adjustment is implemented by `js/visual-r3-state-copy.js`, a presentation-only DOM layer. It does not fetch data, change session state, alter authorization, mutate business data, or override fail-closed decisions from `app.js`.

## De-AI review results

### Homepage

Passed after line audit. The artifact system remains distinct: CRT terminal, training folder, posted winner evidence, Called It filing rail, and continuous-feed Receipts. Accidental connector lines were removed rather than adding more themed decoration.

### Called It

Passed. Multi-call and empty-ticket proofs retain immediate prediction hierarchy and physical filing-ticket identity. The empty ticket has the same physical depth as its used sibling without becoming a scroll container.

### Receipts

Passed after both owner corrections. Leader summaries now read as quiet ledger headers, not historical receipt entries and not diagram-like connected labels.

### Rules

Passed. The redundant Desk Directory is removed; the page remains an operations binder/manual rather than antique paper or a card collection.

### Lesson

Passed. The editorial surface remains intentionally distinct from the brokerage office system. The homepage training-folder action no longer has a detached decorative underline.

### Operator surfaces

Passed. Auth/admin/edit surfaces remain office forms while using proportionate sheet dimensions rather than mandatory full-screen drawers.

## Responsive / owner-correction proof

The correction passes reviewed:

- desktop full-width terminal;
- desktop full-width lesson folder;
- 390 px weekly-result load-failure typography;
- 390 px Receipts leader hierarchy;
- desktop filled + unused Called It ticket pair;
- 390 px auth sheet;
- 390 px admin sheet;
- 390 px Called It edit sheet;
- 390 and 1440 px Rules after Desk Directory deletion;
- final 390 px Receipts line cleanup;
- final 390 px training-folder link cleanup;
- final full-homepage 390 and 1440 px line audits.

No horizontal document overflow appeared in the reviewed 390 or 1440 px page proofs.

Fresh Chromium navigation in the sandbox remained restricted, so the final line-audit captures used the existing Chromium debugging session with the exact candidate HTML/CSS injected through the browser debugging protocol. This was used for visual/composition review only and is not represented as R4 live-backend/runtime QA.

## Accessibility / functional review

No authority-bearing application logic was changed by these R3 owner corrections.

Confirmed:

- Rules retains the existing `rules.js` settings hooks and live status region;
- homepage modal runtime ownership remains in the existing controller;
- the correction CSS changes sizing/material/layout, not focus or interaction behavior;
- `visual-r3-state-copy.js` delegates sign-in to the existing auth control rather than implementing authentication;
- public read authorization and backend data loading remain unchanged;
- reduced-motion rules remain present;
- the R2 fail-closed `[hidden]` safeguard remains intact.

Actual device/auth/backend behavior remains an R4 runtime-QA concern rather than something inferred from screenshots.

## Current correction scope

The second owner correction pass from branch SHA `c8618833a5bbcd0207185b49bfc4180940b78feb` is limited to presentation surfaces and this review document. No Supabase, schema, RLS, Edge Function, market, Called It authority, or authentication implementation was changed.

## Conclusion

No known visual/source blocker remains for R3 after the owner correction passes. The branch remains the visual release candidate ready for R4 real-runtime QA.

No merge to `main` was performed. R4 has not started.
