# Goblin Brokerage Redesign — Implementation Control

**Authoritative design brief:** `goblin_investing_redesign_master_v5.md`  
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
- Manual Android/browser QA: DEFERRED UNTIL LATER INTEGRATED QA
- Next canonical turn: Turn 6 — The Receipts / leaderboard

Read the completed-turn records in order. In particular, read `turn-5-completion.md` and `turn-5-correction-review.md` before touching Called It or beginning Turn 6.

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
- apply label economy to proposed visible labels before implementing them;
- identify realistic worst-case legal values/strings that could affect layout;
- if creating external branded SVGs, require outlined text/path geometry rather than live device-font text;
- if changing an exported helper, formatter, shared CSS utility, or shared render primitive, enumerate its consumers and identify any out-of-turn surfaces it can affect;
- if instructional copy changes inside a role-shared component, check signed-out, owner, admin-self, admin-other, and disabled/unavailable contexts where applicable;
- if a compact empty state sits in Grid/Flex, inspect parent stretch behavior and shared/inherited min-heights, including a mixed row with one populated and one empty item;
- if numeric/currency formatting or temporary numeric storage is touched, test sentinel inputs: null, undefined, blank string, numeric zero, negative, NaN, and normal positive values;
- treat DOM `dataset`/attributes, serialized form values, query parameters, and local storage as numeric boundaries too; blank string is not a safe missing numeric sentinel;
- identify whether the changed component creates a nested vertical scroll surface on mobile;
- for structural UI changes, identify the intended semantic heading structure and accessible names for repeated controls;
- inventory every custom interactive hit target, not only shared `.button` elements.

After coding:
- re-fetch modified files from the working branch;
- compare the full branch diff to `main` for accidental files;
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
- verify labels match the actual data geometry they describe;
- run a visible-label economy pass separately from semantic/accessibility labeling;
- perform a source-level worst-case content check using actual field/numeric bounds and 320–360px assumptions even when runtime QA is deferred;
- verify external branded SVGs contain no live `<text>` unless explicitly documented;
- load primary remote web fonts from the document head rather than CSS `@import`;
- verify any shared-helper change did not alter an out-of-scope surface; if it did, split semantic/shared output from turn-specific presentation;
- verify role-sensitive instructions point to a control/action that actually exists for each role that can see the copy;
- verify compact empty states remain compact after Grid/Flex cross-axis sizing and desktop media rules are applied;
- verify display formatters **and temporary numeric state** preserve missing values as missing rather than coercing them into legitimate-looking zeroes;
- avoid nested vertical `overflow:auto` inside repeated slips/cards unless there is a documented interaction need and mobile testing covers it;
- perform a semantic accessibility gate now: heading hierarchy, accessible control names, selected-state semantics, and status meaning;
- check every interactive row/toggle/icon/autocomplete option against the ~44px mobile hit-target rule where practical;
- for `aria-modal="true"` surfaces, verify focus entry, background inertness/inaccessibility, Tab/Shift+Tab containment, Escape/close behavior, body-scroll recovery, and focus restoration;
- for custom ARIA widget roles such as `listbox`, `option`, `menu`, or `tab`, require the matching keyboard/focus interaction model; otherwise prefer native controls/semantics rather than decorative ARIA;
- for toggle-like button groups, expose selected state semantically (`aria-pressed`, radio semantics, etc.) and update it whenever the visual selection changes;
- for help/onboarding copy describing a multi-step server workflow, identify exactly which step creates or persists authoritative state and phrase the copy accordingly;
- for existing records edited under mutable global settings, distinguish stored historical terms from values that would be recalculated today; opening an editor must not silently rewrite the displayed historical target using current settings;
- when a selected entity becomes unresolved during search/edit, clear dependent previews **and invalidate pending work** rather than leaving or restoring stale price/target output;
- for mobile sheets/popovers, distinguish intentional viewport-containment scrolling from accidental nested scrolling, and explicitly prevent background-page scrolling while the sheet is open;
- mark CODE COMPLETE separately from QA COMPLETE;
- update the relevant turn record before moving on.

## Visual-review truth test

Every later visual turn must explicitly answer these questions before it is called code-complete:

1. **Truth:** Does any visual element claim a live state the application does not actually know?
2. **Geometry:** Do labels/headings correspond to the actual values/layout beneath them?
3. **Bounds:** Do legal worst-case strings and numeric values fit narrow mobile assumptions?
4. **Independence:** Will external assets render consistently without device-specific fonts or hidden dependencies?
5. **Cleanup:** Did replacing markup also remove the obsolete implementation residue it replaced?
6. **Scope:** Did a shared helper/utility change alter surfaces outside the current turn?
7. **Role:** Does instructional copy still make sense for every role that can see it?
8. **Sentinels:** Can null/blank/missing data become a legitimate-looking value in API, formatter, DOM dataset, or serialized state?
9. **Scroll topology:** Did the redesign create an unnecessary nested vertical scroll region?
10. **Semantics:** Does the new visual hierarchy have matching headings and accessible control names?
11. **ARIA contract:** If a custom widget role was added, is its required keyboard/focus behavior actually implemented?
12. **Authority timing:** Does workflow copy distinguish preview/selection from the step that persists official server-authoritative state?
13. **Historical terms:** Does editing an existing record preserve its stored target/price until a real term-changing action intentionally restarts it?
14. **Dependent preview freshness:** When a stock/entity selection becomes unresolved, are stale dependent values cleared immediately?
15. **Async ownership:** Can a late response update UI after the user has moved to another selection/component?
16. **Snapshot coherence:** Are values displayed together derived from the same authoritative preview response when one is available?
17. **Invalidation:** Do clear/new-selection/close/replacement events invalidate pending work?
18. **Stale-component isolation:** Can a detached component write a late success/error into current shared UI?
19. **Modal completeness:** Is an actual modal's background inaccessible and its keyboard focus contained?
20. **Hit target:** Did every custom interactive element receive the same mobile target scrutiny as ordinary buttons?
21. **Label economy:** What ambiguity does each visible micro-label resolve? If none, remove it.

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
