# Goblin Brokerage Redesign — Turn 6 The Receipts / Leaderboard

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `f352592bc50ddb0a5953d7442615feae157afd2e`  
**Initial Turn 6 code head before documentation:** `937308726c63a872311dd340d44d1bc194f357e9`  
**Turn 6 correction code head:** `9b8b1e64dd8485d23d18777606a036be34006c92`  
**Status:** CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Completed / corrected:** 2026-09-08

## Goal

Turn The Receipts and its leader summary into the paper-ledger / financial-record surface defined by the redesign architecture while preserving existing results-history behavior, admin review actions, cooldown reset, exact-row debug deletion, and leaderboard counting.

Turn 7 rules-page/article work was deliberately not started during Turn 6 or its correction review.

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
- `docs/goblin-brokerage/turn-6-correction-review.md`
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
- green `APPROVED` and red `REJECTED` path-only stamp assets for real Called It review outcomes;
- neutral `UNDER REVIEW`, `RECORDED`, and truthful `STATUS UNAVAILABLE` treatments;
- admin debug delete remains visible to admins but subordinate through hierarchy/border treatment rather than low-opacity text.

The two visible leader labels remain because they resolve a real ambiguity: one block counts Win the Week victories and the other counts approved Called It victories.

## Desktop ledger

The existing semantic table remains the canonical markup at widths where the six-column geometry has enough room.

It uses:
- paper/ink styling;
- explicit column headers with `scope="col"`;
- a screen-reader caption;
- fixed tabular geometry;
- wrapping for participant names and long detail text;
- right-aligned mono payout values;
- inline review status and admin controls.

The data columns remain Date, Player, Result, Details, Status, and Prize.

The correction review widened the Prize column from 9% to 11% and keeps the vertical receipt treatment through 899px. The six-column desktop table now starts at 900px rather than 700px.

## Mobile / tablet ledger

At widths up to and including 899px, the same semantic history rows reflow into vertical receipt records in normal document flow.

Record order:
1. date + prize;
2. player;
3. result type;
4. details;
5. review/record state and any admin actions.

There is no 760px minimum-width table and no horizontal history scroll wrapper. Long names/details wrap instead of forcing a sideways ledger. No nested vertical scroll surface was introduced.

The correction review explicitly checked the layout-mode boundary rather than checking only narrow phones. Source-level checks now cover values immediately below and above the receipt/table transition.

## Preserved behavior

Unchanged:
- Under Review / Approved / Rejected Called It workflow;
- weekly leader counting;
- Called It leader counting only approved Called It rows;
- admin Approve action;
- admin Reject action;
- cooldown reset behavior;
- admin debug Delete row control;
- deletion predicate remains `results_history.id = data-history-delete-id` so only the intended history record is targeted;
- all server-authoritative challenge state remains outside this visual turn.

The redesign changes presentation and history display-boundary handling only.

## Semantic state / payout correction

The initial Turn 6 source review caught missing-number coercion but did not go far enough. A later adversarial review found three semantic-display problems:

1. Weekly winner records were being visually labeled `Approved`, even though Win the Week has no approval workflow. This invented a state for decorative convenience. Weekly rows now display `Recorded`, which is supported by the fact that the record exists in results history.
2. Called It rows under review store `reward_amount = 0` as an implementation value until the review outcome is recorded. Rendering that as `$0.00` made a pending payout look final. Under Review and unknown-status rows now display `—` in Prize. Rejected rows may display the authoritative zero payout; Approved rows display the recorded payout.
3. The admin review button previously said `Approve +$X` using the dashboard settings already loaded in the browser. The backend determines the authoritative payout when the review state is recorded, so a mutable settings change could make the button promise a stale amount. The button now simply says `Approve`.

These corrections preserve the distinction between database representation and user-facing financial meaning.

## Numeric sentinel correction

Turn 6 also retains the history-specific numeric boundary helper introduced in the initial implementation. It treats:
- `null` as missing;
- `undefined` as missing;
- blank/whitespace string as missing;
- `NaN` as missing;
- numeric `0` as legitimate zero;
- negative values as legitimate values;
- normal positive values as legitimate values.

Weekly returns display `—` for missing data instead of false zero. The same guard is used for Called It starting, target, and qualifying prices.

Missing/unknown Called It review status does not default to `Approved`; it renders `Status unavailable` and its payout is not presented as final.

## Accessibility / interaction gate

Structural accessibility was handled during this turn rather than deferred:
- leader metric labels are real `h3` headings;
- the results table has a caption and scoped column headers;
- repeated admin review/reset/delete buttons have participant/date-specific accessible names where applicable;
- all history admin buttons have a source-level minimum height of 44px;
- admin control text was increased from 8px to 10px during correction review;
- the Delete row control no longer uses reduced opacity for resting text, preserving readable contrast while remaining visually subordinate;
- approved/rejected stamp images are decorative while equivalent status text remains in the accessibility tree;
- no custom ARIA widget role was added;
- no new modal, popover, focus contract, event-order dependency, timer, observer, or async request was introduced.

## Responsive bounds review

The initial Turn 6 review focused too narrowly on 320–360px mobile. That missed the actual weak point: the first width at which the six-column table became active.

Correction review now applies two separate checks:

### Narrow content check
- 320px
- 360px
- 412px

At these widths:
- the paper section retains normal page gutters;
- the `PERMANENT RECORD` mark scales below the available ledger width;
- long/tied leader names wrap;
- long participant names wrap;
- Called It detail strings expand vertically;
- the allowed `+10000.00%` weekly return fits in the full-width details row;
- a `$1,000.00` payout fits in the date/prize receipt header;
- status plus multiple admin controls wraps in a full-width record row.

### Breakpoint-boundary check
For every layout-mode breakpoint, review the smallest width that activates the wider layout and the width immediately below it. For Receipts that means 899px and 900px, not merely representative phone widths.

The six-column table now starts only at 900px, and its Prize allocation is widened to 11% so the legal `$1,000.00` payout is not forced into the narrow 700px-era column.

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

No exported/shared JavaScript helper was changed. The new numeric/state helpers are private to `app.js` history rendering, so Win the Week, Called It slips/forms, rules, and future surfaces do not inherit Turn 6 presentation semantics.

No new patch file, inline JavaScript fix, MutationObserver, framework, or compatibility shim was added.

## What the initial review missed, and why

The misses were caused by review prompts that were individually reasonable but too narrow:

- `status-truth` asked whether a status existed, but did not require a **state provenance table** for every status-like label. That allowed `Approved` to be invented for weekly rows.
- numeric sentinel testing checked null/blank/zero conversion, but did not ask whether an **authoritative stored zero can still be semantically provisional**. That allowed Under Review `$0.00`.
- worst-case layout testing named 320–360px, but did not require testing **breakpoint boundaries ±1px** or the minimum width of every layout mode. That missed the 700px table transition.
- touch-target checks measured target size, but did not separately review **text readability/contrast after visual subordination**. That allowed an 8px, opacity-reduced Delete control.
- action-copy review did not require comparing displayed mutable values with the value source used by the authoritative mutation. That allowed `Approve +$X` to promise a potentially stale payout.

The architecture/control documents now make these checks explicit and require a separate adversarial correction review before advancing a turn.

## Source-level validation

Completed after correction:
- re-read authoritative Turn 6 requirements and design philosophy;
- re-read Turn 5 completion/correction records and current backend authority model;
- re-fetched modified files from `goblin-brokerage-redesign`;
- inspected the correction commits to verify `js/app.js` and `css/site.css` changed only the intended Receipts logic/styles;
- verified weekly status is now `Recorded`;
- verified pending/unknown Called It payout renders `—`;
- verified admin review action no longer embeds a mutable payout value;
- verified receipt mode applies through 899px and desktop table begins at 900px;
- verified desktop Prize column is widened to 11%;
- verified admin history controls retain 44px minimum height and use 10px text;
- verified Delete text no longer uses reduced opacity;
- retained numeric sentinel checks;
- retained SVG path/no-live-text checks;
- no backend or prior-turn controller files were changed.

## Runtime QA status

**CODE COMPLETE:** yes.  
**CORRECTION REVIEW COMPLETE:** yes.  
**QA COMPLETE:** no.

Per project direction, the redesign branch is not the live GitHub Pages frontend and actual integrated Android/browser QA remains deferred.

Still to verify later at runtime:
- actual IBM Plex font metrics in the 900px+ desktop ledger columns;
- 320–899px receipt wrapping on Android Chrome/tablet emulation;
- 899px/900px transition with worst-case values;
- signed-out visual state;
- admin Under Review actions and touch wrapping;
- Approved/Rejected stamp loading in the deployed branch environment;
- screen-reader table behavior after CSS reflow;
- exact-row delete end to end with an admin session.

## Turn 6 implementation commits

Initial implementation:
- `1aae60db8523167ab29dcd48b561ed64fb62e8a2` — history rendering, sentinel/status handling, accessible admin action names
- `e2e10728d0e18cad8d8f3d65060e84e434922b82` — APPROVED stamp
- `7a432275b3dc6691a1f4656d0430286d20020984` — REJECTED stamp
- `3b2bb6107cf15090eaa0b2f4b6a57501379bd247` — PERMANENT RECORD stamp
- `f563a95010f755c57f7ec3468256ca556e01ce19` — Receipts/leader semantic markup
- `937308726c63a872311dd340d44d1bc194f357e9` — paper ledger and initial mobile record styling

Correction implementation:
- `3ab46eff0dc831b38e84ed7484d4ebf5b9e40abb` — truthful weekly state, pending payout semantics, server-safe review label
- `9b8b1e64dd8485d23d18777606a036be34006c92` — tablet receipt boundary, wider desktop prize column, readable admin controls

## Next canonical step

Turn 7 — Rules page + lesson header consistency, after reading this completion record and `turn-6-correction-review.md`.
