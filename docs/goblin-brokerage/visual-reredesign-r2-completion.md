# Goblin Investing Visual Re-Redesign — R2 Homepage Visual Rebuild

**Branch:** `goblin-visual-reredesign`  
**R2 base:** `4512b5ad2245d104523ad6742656881555af2352`  
**Status:** SOURCE COMPLETE / VISUAL COMPOSITION REVIEW COMPLETE / INTEGRATED LIVE RUNTIME QA DEFERRED  
**Production `main`:** unchanged  
**R3:** not started

## Scope

R2 applies the owner-approved R1 visual language to the actual homepage markup while preserving the existing application contracts.

Changed runtime surface:

- `index.html`
- `css/visual-reredesign.css`
- `css/visual-r2-foundation.css`
- `css/visual-r2-artifacts.css`
- `css/visual-r2-responsive.css`

No R2 change was made to:

- `js/app.js`
- `js/called-it-ui.js`
- auth/session implementation
- market-data implementation
- Supabase schema, RLS, grants, RPCs, migrations, or Edge Functions
- Called It lifecycle/review/payout/cooldown authority
- Win the Week persistence/business rules
- production `main`

## Homepage visual integration

### Header / identity

The generic prior wordmark treatment is replaced on the homepage by the approved altered institutional nameplate: the original `HOUSEHOLD` designation remains visibly underneath a physical `GOBLIN` patch, followed by `INVESTING`.

The header now exposes five clear destinations as an office/file index: Week, Lesson, Called It, Receipts, and Rules. Existing sign-in/account elements retain their IDs and runtime ownership.

### Weekly requirement

The weekly requirement is now the approved CRT desk terminal rather than a dark fintech summary card. Existing dynamic IDs remain unchanged:

- `currentWeekValue`
- `purchaseMinimumValue`
- `purchaseMinimumNote`

The physical `INVEST OR DIE` note is retained from R1.

### Lesson

The existing lesson is integrated as the approved institutional blue training folder. The editorial destination and existing lesson behavior are unchanged.

### Win the Week

The result is now a posted paper result with attached portfolio evidence. Existing runtime IDs remain unchanged:

- `winnerContent`
- `winnerChartWrap`
- `winnerChart`
- `adminWeekButton`

Redundant board/evidence micro-labels were removed from homepage markup.

### Called It

The existing runtime renderer and event hooks were deliberately left unchanged. The R2 visual layer turns the existing play/slip markup into the approved filed prediction-ticket system:

- physical ticket stock;
- tear-off vertical stub;
- dominant ticker and direction stamp;
- form-like metadata;
- filing-rail participant surface;
- deliberately blank unused-ticket state.

The old empty-state explanation remains in the DOM for existing renderer compatibility but is visually suppressed; the visible artifact reads simply as an unused ticket.

### Receipts

The history surface is now continuous-feed accounting paper with tractor holes, ledger hierarchy, and a permanent-record stamp. The redundant explanatory paragraph was removed from homepage markup. Existing leader/history IDs and table semantics remain unchanged.

## Truth and authority preservation

R2 does not introduce new current-looking values. Existing JavaScript continues to own all mutable text and state.

The visual layer includes an explicit `[hidden]` safeguard because styled controls must not override runtime hidden states. Missing/unavailable values therefore remain unavailable, and hidden admin/owner controls remain hidden when the application says they are hidden.

## Responsive visual review

The R2 composition was rendered in Chromium at:

- 320px
- 390px
- 412px
- 700px
- 900px
- 1440px

Measured document width equaled viewport width at every reviewed width.

The 700/900 transition was explicitly inspected: ticket slips stack at the narrow state and return to the two-ticket filing layout at the wider state without horizontal overflow.

## Browser QA classification

The available environment could not navigate the branch as a live integrated GitHub/Supabase application. Visual review therefore used an isolated Chromium composition harness built from the R2 homepage markup and exact R2 visual styles with representative dynamic state injected after load. A compatibility subset of the existing shared stylesheet was used for the harness, and remote IBM Plex font loading was unavailable.

This is sufficient for the R2 visual/composition correction loop, but it is not being reported as live auth, Supabase, network, exact-font-metric, or physical-device runtime QA. Those remain later runtime gates.

## Stop condition

R2 homepage source and browser composition review are complete. No production cutover was performed. R3 has not started.
