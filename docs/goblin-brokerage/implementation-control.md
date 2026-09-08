# Goblin Brokerage Redesign — Implementation Control

**Authoritative design brief:** `goblin_investing_redesign_master_v6.md`  
**Working branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Shared backend:** production Supabase project is shared by `main` and the redesign branch.

This repository record exists so a fresh implementation turn can recover the critical execution rules even when the full master brief is supplied separately.

## Current status

- Turn 0: COMPLETE
- Turn 1: CODE COMPLETE
- Turn 1 correction review: COMPLETE except deferred owner-edit authority cutover
- Turn 2 visual foundation: CODE COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turn 3 Tracker + Current Lesson + Win the Week: CODE COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turns 2–3 source-level correction review: COMPLETE
- Turn 4 Called It participant sections + challenge slips: CODE COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turn 4 source-level correction review: COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turn 5 Called It form + modal + help: CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED
- Turn 4 participant accessibility carry-forward: RESOLVED during Turn 5 controller work
- Turn 6 The Receipts / leaderboard: CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED
- Turn 6 process review: architecture hardened with state-provenance, semantic-value, breakpoint-boundary, authority-label, readability/subordination, and adversarial correction-review gates
- Turn 7 Rules page + article integration: CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED
- Turn 7 adversarial review: corrected unverified configurable-rule fallbacks, article modal lifecycle/accessibility, and article shell CSS specificity before closing the turn
- Turn 8 Goblin seasoning + asset integration: CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED
- Turn 8 adversarial review: corrected direction-mark contrast across dark-slip and paper surfaces; confirmed seasoning remains sparse and non-authoritative
- Turns 7–8 combined post-review correction pass: SOURCE-LEVEL CORRECTIONS COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED
- Turns 7–8 combined corrections: completed form/slip direction-mark consistency, spatial asset integration, readable Rules failure states, household-vs-software enforcement wording, supported article font weights, JavaScript reduced-motion handling, and namespaced article modal ownership
- Manual Android/browser QA: DEFERRED UNTIL TURN 9 INTEGRATED QA
- Next canonical turn: Turn 9 — Mobile, performance, accessibility, and de-AI audit

Read the completed-turn records in order. Before beginning Turn 9, read `turn-7-8-combined-correction-review.md` as the latest authoritative cross-turn correction record in addition to `turn-8-completion.md` and `turn-8-correction-review.md`. The Turn 5 completion/correction records remain authoritative for later work that touches Called It behavior, Turn 6 remains authoritative for Receipts state/payout semantics, and Turn 7 remains authoritative for secondary-page integration.

## Mandatory environment rule

Before changing auth, RLS, RPCs, Edge Functions, or any other shared backend behavior, write down:
1. working frontend branch;
2. live frontend branch;
3. Supabase project being changed;
4. current mutation authority path;
5. whether the backend change is backward-compatible with the live frontend.

Do not revoke or change a shared backend contract that production `main` still uses unless the production frontend is cut over in the same release.

## Label economy / context-first labeling

Visible labels must earn their place.

Before adding or retaining a visible micro-label, kicker, caption, eyebrow, register, or repeated heading, ask:

> What ambiguity does this label resolve?

If hierarchy, value format, control affordance, or nearby context already communicates the meaning, omit the visible label.

Keep a visible label when it is genuinely needed for comprehension, real state, record/slot identity, or necessary instruction. Do not add labels simply to make the interface feel more financial/bureaucratic or to fill visual space.

This rule does **not** remove semantic/accessibility requirements. Inputs, dialogs, icon controls, repeated actions, and similar controls still need correct labels/names even when a redundant visible caption is removed.

## Truth requires provenance

For every visible status-like label, stamp, badge, color-state, official-sounding phrase, financial amount, and action promise, name its source before treating it as application truth.

Classify each item as:
- authoritative stored state;
- authoritative derived state;
- pending/provisional state;
- static artifact language.

If its provenance cannot be named, it must not look like official state.

A valid database value is not automatically a valid user-facing conclusion. In particular, a stored numeric zero may be a final zero, a pending/default value, a placeholder, or a real entered value. Review semantic finality separately from numeric validity.

If action copy contains a mutable amount/price/percentage/date, compare the value shown by the UI with the value source used by the authoritative mutation. If those are not the same coherent snapshot/transaction contract, omit the mutable promise from the control and display the authoritative result afterward.

A static HTML fallback for a mutable setting must not silently present itself as the current rule. Until an authoritative value is loaded, either show an explicitly labeled fallback/default or fail closed with a missing/unavailable presentation.

A truthful failure state must also remain usable. Do not replace a fake value with malformed copy such as `— above` or `— days`. If authoritative configuration is unavailable, keep the sentence grammatical and explain that the current setting is unavailable.

Any rule or instruction using enforcement language such as `must`, `cannot`, `blocked`, `required to continue`, or `to keep playing` must name its enforcement source. If there is no application guard, identify it explicitly as a household/manual policy rather than implying software enforcement.

## Cross-turn integration rules

A later turn must review how its additions behave inside the workflow created by earlier turns, not only whether the new files satisfy the current-turn checklist.

- When introducing a custom icon/mark family, inventory every presentation of that concept inside the same interaction flow. Do not mix authored assets and platform emoji in one file → saved/result workflow without an intentional reason.
- Adding an asset is not completion by itself. For every arrow, seal, stamp, highlight, or annotation, identify what it visibly marks or points to and how it is spatially anchored. Remove decoration that has no referent.
- When a page begins consuming shared CSS, inventory local generic component names such as `.modal`, `.card`, `.sheet`, `.button`, or `.header`. Namespace local components when ownership differs from the shared component.
- When loading a limited font family/weight set, inventory all requested `font-weight`/style values on the page. Do not rely on nonexistent 850/950/1000 faces to create hierarchy.
- Reduced-motion review covers JavaScript-driven motion as well as CSS `animation` and `transition`.

## Mandatory review gates for every implementation turn

Before coding:
- fetch current files from the working branch, not merely the repository default branch;
- compare working branch head to `main`;
- identify preserved business invariants;
- inspect actual Supabase policies/grants/functions when auth/backend behavior is involved;
- identify whether any form preview can differ from server-authoritative save semantics;
- if selection-dependent async work exists, identify the request identity and every invalidation event: input change, clear, new selection, modal/component close, or replacement;
- if one preview response supplies both a base value and derivation settings, treat them as one coherent snapshot;
- when markup structure will be replaced, list the classes/containers expected to disappear;
- identify any new copy/icon that could be mistaken for live runtime status and name the authoritative state source;
- build a state-provenance matrix for every status/stamp/badge/official amount/action promise affected by the turn;
- for every financial value, distinguish numeric validity from semantic finality; identify zeros/defaults/placeholders that are valid values but not final outcomes;
- if action copy includes a mutable amount/price/percentage/date, compare its UI source to the authoritative mutation source;
- if mutable settings are loaded after initial HTML, identify what the pre-load/error state displays and ensure it cannot masquerade as current authoritative configuration;
- for rule/instruction copy that implies eligibility or blocking, identify the actual software guard; if none exists, plan manual/household-policy wording instead;
- apply label economy to proposed visible labels before implementing them;
- identify realistic worst-case legal values/strings that could affect layout;
- inventory every structural breakpoint used by the changed component and identify the minimum width of each layout mode;
- if creating external branded SVGs, require outlined text/path geometry rather than live device-font text;
- if adding a decorative mark/arrow/seal, name its visual referent and intended spatial anchor before implementation;
- if introducing a custom icon family, inventory all same-workflow input, active, saved/result, and summary representations of that concept;
- if changing an exported helper, formatter, shared CSS utility, or shared render primitive, enumerate its consumers and identify any out-of-turn surfaces it can affect;
- if a page consumes shared CSS while retaining local component styles, inventory generic selector collisions and define explicit ownership/namespacing;
- if loading remote font subsets, compare the loaded weights/styles with every weight/style requested by the page;
- if instructional copy changes inside a role-shared component, check signed-out, owner, admin-self, admin-other, and disabled/unavailable contexts where applicable;
- if a compact empty state sits in Grid/Flex, inspect parent stretch behavior and shared/inherited min-heights, including a mixed row with one populated and one empty item;
- if numeric/currency formatting or temporary numeric storage is touched, test sentinel inputs: null, undefined, blank string, numeric zero, negative, NaN, and normal positive values;
- treat DOM `dataset`/attributes, serialized form values, query parameters, and local storage as numeric boundaries too; blank string is not a safe missing numeric sentinel;
- identify whether the changed component creates a nested vertical scroll surface on mobile;
- for structural UI changes, identify the intended semantic heading structure and accessible names for repeated controls;
- inventory every custom interactive hit target, not only shared `.button` elements;
- if secondary/debug/admin controls will be visually subordinated, decide how hierarchy will be reduced without using unreadable font sizes/opacity/contrast.

After coding:
- re-fetch modified files from the working branch;
- compare the full branch diff to `main` for accidental files;
- inspect the turn-only diff and verify it contains only intended scope;
- syntax-check JavaScript;
- review mobile event ordering (`pointerdown`, focus/blur, `click`);
- verify overlays intercept taps and cannot click through;
- verify body-scroll lock has one explicit recovery path;
- review the full auth lifecycle, including auth events from outside the current UI action;
- check browser previews against server restart/freshness behavior;
- verify selection-dependent async responses cannot update a newer selection;
- verify clearing/replacing/closing a component invalidates pending timers/search/quote responses;
- verify async success **and error** handlers from detached/replaced components cannot mutate current shared UI;
- verify derived preview values use a coherent response snapshot rather than mixed-age inputs;
- search for dead imports, obsolete selectors/classes, duplicate handlers, observers, timers, and stale docs;
- reconcile removed markup classes against CSS and remove confirmed-dead selectors;
- verify status-sounding copy/icons are backed by real application state or reworded as static labels;
- re-run the state-provenance matrix against rendered output; no status-like decoration may invent a lifecycle/state merely because it fits the theme;
- verify stored zero/default/fallback values are not presented as final outcomes when their lifecycle meaning is pending/provisional;
- verify async-loaded mutable settings fail closed or are explicitly labeled as fallback/default until authoritative values arrive;
- verify unavailable/failure copy is still grammatical, readable, and useful rather than merely non-misleading;
- verify rules using enforcement language map to a real application guard or are explicitly identified as manual/household policy;
- verify any mutable value embedded in action copy is the same value/snapshot the authoritative mutation will use; otherwise remove the promise;
- verify labels match the actual data geometry they describe;
- run a visible-label economy pass separately from semantic/accessibility labeling;
- perform a source-level worst-case content check using actual field/numeric bounds and 320–360px assumptions even when runtime QA is deferred;
- additionally test worst-case content immediately around every structural breakpoint and at the minimum width of every wider layout mode;
- verify external branded SVGs contain no live `<text>` unless explicitly documented;
- verify every added decorative mark visibly annotates/marks a real referent; do not keep checklist decoration that merely exists;
- verify custom icon/mark families are consistent across the same workflow unless a different representation is intentional and documented;
- load primary remote web fonts from the document head rather than CSS `@import`;
- verify loaded font weights/styles actually cover every requested page weight/style; normalize unsupported numeric weights instead of relying on browser fallback;
- verify any shared-helper change did not alter an out-of-scope surface; if it did, split semantic/shared output from turn-specific presentation;
- verify local component selectors do not accidentally compete with shared global component selectors; namespace separate implementations;
- verify role-sensitive instructions point to a control/action that actually exists for each role that can see the copy;
- verify compact empty states remain compact after Grid/Flex cross-axis sizing and desktop media rules are applied;
- verify display formatters **and temporary numeric state** preserve missing values as missing rather than coercing them into legitimate-looking zeroes;
- avoid nested vertical `overflow:auto` inside repeated slips/cards unless there is a documented interaction need and mobile testing covers it;
- perform a semantic accessibility gate now: heading hierarchy, accessible control names, selected-state semantics, and status meaning;
- check every interactive row/toggle/icon/autocomplete option against the ~44px mobile hit-target rule where practical;
- separately inspect font size, contrast, and opacity for visually subordinate controls; a compliant hit target does not excuse unreadable microtext;
- verify `prefers-reduced-motion` disables or bypasses JavaScript-driven counters/tweens/scroll effects as well as CSS animations/transitions;
- for `aria-modal="true"` surfaces, verify focus entry, background inertness/inaccessibility, Tab/Shift+Tab containment, Escape/close behavior, body-scroll recovery, and focus restoration;
- for custom ARIA widget roles such as `listbox`, `option`, `menu`, or `tab`, require the matching keyboard/focus interaction model; otherwise prefer native controls/semantics rather than decorative ARIA;
- for toggle-like button groups, expose selected state semantically (`aria-pressed`, radio semantics, etc.) and update it whenever the visual selection changes;
- for help/onboarding copy describing a multi-step server workflow, identify exactly which step creates or persists authoritative state and phrase the copy accordingly;
- for existing records edited under mutable global settings, distinguish stored historical terms from values that would be recalculated today; opening an editor must not silently rewrite the displayed historical target using current settings;
- when a selected entity becomes unresolved during search/edit, clear dependent previews **and invalidate pending work** rather than leaving or restoring stale price/target output;
- for mobile sheets/popovers, distinguish intentional viewport-containment scrolling from accidental nested scrolling, and explicitly prevent background-page scrolling while the sheet is open;
- run the separate adversarial correction-review prompt below after the implementation self-check;
- do not advance the next canonical turn until correction review is complete or remaining items are explicitly classified as runtime-only QA;
- mark CODE COMPLETE separately from QA COMPLETE;
- update the relevant turn record before moving on.

## Visual-review truth test

Every later visual turn must explicitly answer these questions before it is called correction-review complete:

1. **Truth:** Does any visual element claim a live state the application does not actually know?
2. **Provenance:** For every official-looking status/stamp/amount/action promise, what authoritative source or static-artifact classification supports it?
3. **Semantic finality:** Can a valid stored zero/default/fallback be mistaken for a final user-facing result while the lifecycle is still pending?
4. **Geometry:** Do labels/headings correspond to the actual values/layout beneath them?
5. **Bounds:** Do legal worst-case strings and numeric values fit narrow mobile assumptions?
6. **Breakpoint boundary:** Do worst-case values fit immediately below/at every structural breakpoint and at the minimum width of each wider layout mode?
7. **Authority timing:** Does any mutable value shown on an action come from the same snapshot/contract the authoritative mutation will use?
8. **Independence:** Will external assets render consistently without device-specific fonts or hidden dependencies?
9. **Cleanup:** Did replacing markup also remove the obsolete implementation residue it replaced?
10. **Scope:** Did a shared helper/utility change alter surfaces outside the current turn?
11. **Role:** Does instructional copy still make sense for every role that can see it?
12. **Sentinels:** Can null/blank/missing data become a legitimate-looking value in API, formatter, DOM dataset, or serialized state?
13. **Scroll topology:** Did the redesign create an unnecessary nested vertical scroll region?
14. **Semantics:** Does the new visual hierarchy have matching headings and accessible control names?
15. **ARIA contract:** If a custom widget role was added, is its required keyboard/focus behavior actually implemented?
16. **Historical terms:** Does editing an existing record preserve its stored target/price until a real term-changing action intentionally restarts it?
17. **Dependent preview freshness:** When a stock/entity selection becomes unresolved, are stale dependent values cleared immediately?
18. **Async ownership:** Can a late response update UI after the user has moved to another selection/component?
19. **Snapshot coherence:** Are values displayed together derived from the same authoritative preview response when one is available?
20. **Invalidation:** Do clear/new-selection/close/replacement events invalidate pending work?
21. **Stale-component isolation:** Can a detached component write a late success/error into current shared UI?
22. **Modal completeness:** Is an actual modal's background inaccessible and its keyboard focus contained?
23. **Hit target:** Did every custom interactive element receive the same mobile target scrutiny as ordinary buttons?
24. **Readable subordination:** Are secondary/debug controls still readable in font size/contrast/opacity after visual de-emphasis?
25. **Label economy:** What ambiguity does each visible micro-label resolve? If none, remove it.
26. **Philosophy:** Did the financial/bureaucratic theme invent fake system behavior merely because it looked on-theme?
27. **Fallback truth:** Can a static fallback/default for mutable configuration be mistaken for the current authoritative setting when loading fails?
28. **Enforcement truth:** Does language such as `must`, `blocked`, or `to keep playing` map to a real software guard? If not, is manual/household enforcement named explicitly?
29. **Failure usability:** When current data/configuration is unavailable, does the UI remain grammatical and useful rather than only technically truthful?
30. **Asset intent:** Does each arrow/seal/stamp/highlight visibly annotate or mark something, or was it added merely to satisfy an asset checklist?
31. **Workflow consistency:** Does the same concept use one coherent authored icon/mark language through input → saved/result states?
32. **Font reality:** Do all requested font weights/styles actually exist in the loaded font set?
33. **Reduced motion:** Are JavaScript-driven counters/tweens/effects bypassed when reduced motion is requested?
34. **CSS ownership:** Are local component implementations namespaced away from conflicting shared global selectors?

## Mandatory adversarial correction-review prompt

Run this as a separate pass after implementation. Do not merely restate the completion record.

```text
Assume the implementation may be subtly wrong. Try to falsify its completion claims.

Re-read the authoritative architecture, the current turn-only diff, the backend/data model that gives displayed states their meaning, and prior correction records.

Audit at minimum:
- state provenance for every status/stamp/badge/official amount/action promise;
- semantic meaning of zero/default/pending/fallback values, not only numeric validity;
- whether an HTML/default fallback for mutable configuration can masquerade as current state if loading fails;
- whether a truthful failure state is still grammatical and useful to the user;
- whether rule/eligibility copy implies software enforcement that no guard actually implements;
- authority timing for mutable values shown on actions;
- worst-case content immediately around every structural breakpoint, not only 320–360px;
- hit target, font size, contrast, and opacity separately for subordinate controls;
- whether decorative assets actually annotate/mark a visual referent rather than merely existing;
- whether custom icon families remain coherent across one interaction workflow;
- whether requested font weights/styles exist in the loaded font set;
- whether reduced-motion handling covers JavaScript-driven effects as well as CSS;
- whether local component selectors collide with shared global CSS ownership;
- regression scope against prior controllers/auth/backend/shared helpers;
- whether any themed financial/bureaucratic treatment makes the system less truthful.

Report findings by severity. Correct source-level issues now. Defer only items that genuinely require runtime/browser/device verification.
```

## Deferred cutover gate

Before merging redesign to `main`:
1. add authenticated `owner_edit` to `called-it` Edge Function;
2. switch redesign frontend owner metadata editing to that action;
3. verify owner, non-owner, inactive, and admin cases;
4. deploy frontend cutover;
5. revoke authenticated direct UPDATE grants on `called_it_plays`;
6. retire/restrict `edit_own_called_it_metadata`;
7. run Supabase security advisors again.

This is intentionally deferred because production `main` still uses the RPC today.
