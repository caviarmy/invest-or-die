# Goblin Brokerage Redesign — Turn 6 The Receipts / Leaderboard

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `f352592bc50ddb0a5953d7442615feae157afd2e`  
**Turn 6 code head before documentation:** `937308726c63a872311dd340d44d1bc194f357e9`  
**Status:** CODE COMPLETE / SOURCE REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Completed:** 2026-09-07

## Goal

Turn The Receipts and its leader summary into the paper-ledger / financial-record surface defined by the v5 architecture while preserving existing results-history behavior, admin review actions, cooldown reset, exact-row debug deletion, and leaderboard counting.

Turn 7 rules-page/article work was deliberately not started.

## Environment / authority matrix

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- turn-start redesign head: `f352592bc50ddb0a5953d7442615feae157afd2e`
- production `main` head at turn start: `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`
- shared backend: production Supabase, unchanged
- history source: existing `results_history` query in `js/plays.js`, unchanged
- Called It review/reset authority: existing `called-it` Edge Function actions, unchanged
- history debug delete: existing direct `results_history` delete by exact history-row `id`, unchanged
- backward-compatibility impact on live frontend: none because no backend contract was changed and `main` was not edited

## Files changed

Runtime frontend:
- `index.html`
- `css/site.css`
- `js/app.js`

New outlined SVG assets:
- `assets/stamps/approved.svg`
- `assets/stamps/rejected.svg`
- `assets/stamps/permanent-record.svg`

Documentation:
- `docs/goblin-brokerage/turn-6-completion.md`
- `docs/goblin-brokerage/implementation-control.md`

No changes were made to:
- `js/plays.js`
- `js/market.js`
- `js/auth.js`
- `js/called-it-ui.js`
- Supabase schema/RLS/RPCs
- Edge Functions
- Rules page
- Lesson article

## Receipts visual system

The Receipts is now one off-white financial-record surface rather than another dark dashboard/card section.

Implemented:
- paper background with dark ink and explicit light `color-scheme`;
- hard ledger rules instead of rounded cards;
- a path-only `PERMANENT RECORD` stamp at the section heading;
- integrated all-time leader summary separated by ledger rules rather than generic rounded leader cards;
- removal of the decorative trophy emoji and redundant `MOST ...` kicker treatment;
- mono dates, financial details, payouts, counts, statuses, and admin actions;
- green `APPROVED` and red `REJECTED` path-only stamp assets;
- neutral `UNDER REVIEW` and truthful `STATUS UNAVAILABLE` treatments;
- admin debug delete remains visible to admins but is lower-emphasis than review/reset actions.

The two visible leader labels remain because they resolve a real ambiguity: one block counts Win the Week victories and the other counts approved Called It victories.

## Desktop ledger

The existing semantic table remains the canonical markup on desktop.

It now uses:
- paper/ink styling;
- explicit column headers with `scope="col"`;
- a screen-reader caption;
- fixed tabular geometry;
- wrapping for participant names and long detail text;
- right-aligned mono payout values;
- inline review status and admin controls.

The data columns still mean exactly what they did before: Date, Player, Result, Details, Status, and Prize.

## Mobile ledger

At widths below 700px, the same semantic history rows reflow into compact vertical receipt records in normal document flow.

The mobile record order is:
1. date + prize;
2. player;
3. result type;
4. details;
5. review status and any admin actions.

There is no 760px minimum-width table and no horizontal history scroll wrapper. Long names/details wrap instead of forcing a sideways ledger. No nested vertical scroll surface was introduced.

## Preserved behavior

Unchanged:
- Under Review / Approved / Rejected workflow;
- weekly leader counting;
- Called It leader counting only approved Called It rows;
- admin Approve action;
- admin Reject action;
- cooldown reset behavior;
- admin debug Delete row control;
- deletion predicate remains `results_history.id = data-history-delete-id` so only the intended history record is targeted;
- all server-authoritative challenge state remains outside this visual turn.

The redesign changes presentation and history display-boundary handling only.

## Sentinel / truth correction

The source pass found existing history rendering that used `Number(row.return_percent)` directly. That allowed `null` or blank values to become a believable `0.00%`.

Turn 6 adds a history-specific numeric boundary helper rather than altering the shared money formatter. It treats:
- `null` as missing;
- `undefined` as missing;
- blank/whitespace string as missing;
- `NaN` as missing;
- numeric `0` as legitimate zero;
- negative values as legitimate values;
- normal positive values as legitimate values.

Weekly returns now display `—` for missing data instead of false zero.

The same history-specific guard is used for Called It starting, target, and qualifying prices so a legitimate zero is not lost by truthiness and a missing value is not fabricated.

Missing/unknown Called It review status also no longer defaults to `Approved`; it renders `Status unavailable`. Weekly-win records continue to display Approved as they did before because the weekly-win history row is itself the completed winner record.

A Node sentinel check confirmed:
- missing/blank/NaN → `—`;
- `0` → `0.00%`;
- negative values retain their sign;
- positive values receive the leading `+`.

## Accessibility / interaction gate

Structural accessibility was handled during this turn rather than deferred:
- leader metric labels are real `h3` headings;
- the results table has a caption and scoped column headers;
- repeated admin review/reset/delete buttons now have participant/date-specific accessible names where applicable;
- all history admin buttons have a source-level minimum height of 44px;
- approved/rejected stamp images are decorative while equivalent status text remains in the accessibility tree;
- no custom ARIA widget role was added;
- no new modal, popover, focus contract, event-order dependency, timer, observer, or async request was introduced.

## Static bounds review

Source-level review covered the required narrow mobile range and worst-case legal/realistic values.

At 320–360px assumptions:
- the paper section retains normal page gutters;
- the `PERMANENT RECORD` mark scales below the available ledger width;
- long/tied leader names wrap;
- long participant names wrap;
- Called It detail strings expand vertically;
- the allowed `+10000.00%` weekly return fits in the full-width details row;
- a `$1,000.00` payout fits in the date/prize mobile header row;
- status plus multiple admin controls wraps in a full-width record row;
- no horizontal table minimum width remains.

Actual Android Chrome and signed-in/admin runtime rendering remains deferred to the integrated QA pass.

## Asset independence gate

`APPROVED`, `REJECTED`, and `PERMANENT RECORD` were created as outlined SVG geometry.

Verification performed:
- raster previews were generated and visually inspected before commit;
- committed assets were re-fetched from the redesign branch;
- all lettering is represented by `<path>` geometry;
- no committed asset contains a live `<text>` node;
- no font file or device-font dependency was added.

## Cleanup / scope review

Removed/replaced Turn 6 structure:
- trophy emoji markup;
- `.trophy` selector;
- generic rounded/dark leader-card styling;
- 760px history table minimum width;
- history horizontal `overflow:auto` wrapper;
- old dark receipt status badge styling.

Retained selectors all have current markup/render consumers.

No exported/shared JavaScript helper was changed. The new numeric helpers are private to `app.js` history rendering, so Win the Week, Called It slips/forms, rules, and future surfaces do not inherit Turn 6 presentation semantics.

No new patch file, inline JavaScript fix, MutationObserver, framework, or compatibility shim was added.

## Source-level validation

Completed:
- re-read authoritative v5 Turn 6 requirements;
- read `implementation-control.md`, `turn-5-completion.md`, and `turn-5-correction-review.md` before changes;
- recorded redesign and production heads;
- compared redesign to `main` before implementation;
- re-fetched the modified history renderer and stamp assets from `goblin-brokerage-redesign`;
- reviewed the Turn 6-only diff from `f352592...`;
- Node syntax check of the modified history-rendering block passed;
- numeric sentinel test passed;
- source-level 320–360px layout/bounds review completed;
- touch-target review completed;
- status-truth and label-economy reviews completed;
- SVG path/no-live-text review completed.

## Runtime QA status

**CODE COMPLETE:** yes.  
**SOURCE REVIEW COMPLETE:** yes.  
**QA COMPLETE:** no.

Per project direction, the redesign branch is not the live GitHub Pages frontend and actual integrated Android/browser QA remains deferred.

Still to verify later at runtime:
- actual IBM Plex font metrics in desktop ledger columns;
- 320–360px Android Chrome record wrapping;
- signed-out visual state;
- admin Under Review actions and touch wrapping;
- Approved/Rejected stamp loading in the deployed branch environment;
- screen-reader table behavior after mobile CSS reflow;
- exact-row delete end to end with an admin session.

## Turn 6 implementation commits

- `1aae60db8523167ab29dcd48b561ed64fb62e8a2` — history rendering, truthful sentinels/statuses, accessible admin action names
- `e2e10728d0e18cad8d8f3d65060e84e434922b82` — APPROVED stamp
- `7a432275b3dc6691a1f4656d0430286d20020984` — REJECTED stamp
- `3b2bb6107cf15090eaa0b2f4b6a57501379bd247` — PERMANENT RECORD stamp
- `f563a95010f755c57f7ec3468256ca556e01ce19` — Receipts/leader semantic markup
- `937308726c63a872311dd340d44d1bc194f357e9` — paper ledger and mobile record styling

## Next canonical step

Turn 7 — Rules page + lesson header consistency.
