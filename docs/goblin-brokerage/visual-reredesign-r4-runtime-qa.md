# Goblin Investing Visual Re-Redesign — R4 Runtime QA / Cutover Gate

**Branch:** `goblin-visual-reredesign`  
**R4 start:** `aa0e824edfc3aad6cacf59fd3cf99fb318fd14bb`  
**Candidate head before this record:** `f87d1703728c391164269f57e1f69fc9208a84c6`  
**Production `main`:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9` (unchanged)  
**Status:** AUTOMATED / CONNECTED-BACKEND QA COMPLETE AS FAR AS ENVIRONMENT ALLOWS — CUTOVER BLOCKED PENDING LIVE BROWSER / DEVICE QA AND EXPLICIT OWNER APPROVAL

## R4 objective

R4 is the real-runtime and cutover gate. It does not itself authorize a merge to `main`.

The QA environment available in this session has one hard limitation: local Chromium is blocked by organization policy from navigating to localhost/public sites, and the Opera Browser Connector is nonfunctional. Chromium can still render exact candidate HTML/CSS through DevTools `setDocumentContent`, but it cannot run the branch as an internet-connected browser against Supabase. Therefore this record separates:

1. live production Supabase/RLS evidence;
2. exact-candidate local browser interaction/composition evidence;
3. source-verified network/race behavior;
4. checks that remain genuinely unproven and block cutover.

No result below is promoted from source inspection to “live browser passed” unless it was actually exercised.

---

## R4 defects found and corrected

### 1. Signed-out presentation observer loop

The R3 presentation-only `MutationObserver` converted the signed-out status string into a clickable Sign in control. Because the replacement DOM retained the exact same combined `textContent`, the observer could repeatedly rebuild its own output in a live browser.

**Correction:** `makeSignedOutActionClickable()` now exits when `.inline-auth-link` already exists.

**Verification:** local browser test produced exactly one inline Sign in control, clicking it forwarded to the existing auth button once, and repeated unrelated DOM mutations left the link count at one.

### 2. Mobile Receipts right-edge clipping

Owner/device proof showed the continuous-feed Receipts surface crowding/cutting text and paper imagery on the right edge.

**Corrections:**

- removed negative mobile side margins from the receipt sheet;
- established a fixed safe content column inside the tractor-feed holes;
- reduced and inset the feed-hole rails;
- bounded all receipt rows/details to the safe column;
- changed phone leader summaries to two bounded columns, with record count below the holder;
- added narrow-mobile title sizing so `RECEIPTS` itself cannot exceed the safe paper width.

**Measured verification:**

- 390 px: document `390 / 390`, receipt sheet `366 / 366`, title `298 / 298`, both leader rows `298 / 298`;
- 320 px: document `320 / 320`, receipt sheet `300 / 300`, title `232 / 232`, both leader rows `232 / 232`.

The values above are `scrollWidth / clientWidth`. No horizontal overflow remains in the receipt sheet at either width.

---

# Connected production-runtime evidence

## Current production data

Read directly from the connected Supabase project during R4:

- current game week: `6`;
- weekly stock-buy minimum: `$5`;
- Called It Up: `15%`;
- Called It Down: `15%`;
- About the Same: `±3%`;
- challenge duration: `28 days`;
- review cooldown: `7 days`;
- flat claim window: `7 days`;
- Called It payout: `$5`;
- current weekly winner: `Cal`, `+1.4%`, Aug 30–Sep 5, 2026;
- active public Called It rows: `2` (`TSLA` down and `MSFT` up);
- current active participants: Covey, Cal, Charbonneau;
- admin profile exists separately and remains readable to the admin session under current RLS semantics.

The current weekly chart exists in the public `weekly-charts` bucket as `current.jpg`, JPEG, about 139 KB.

## Signed-out / anonymous public read

RLS was exercised under the `anon` role rather than inferred from policy text.

Visible rows at test time:

- active participants: `3`;
- current Called It plays: `2`;
- game settings: `1`;
- weekly winner: `1`;
- results history: `1`;
- active securities reference rows: `7,711`.

This confirms the intended contract: signed-out users can read the public dashboard/results. Sign in is required for Called It actions, not for viewing results.

## Participant visibility

RLS was exercised with Covey's user id placed into the authenticated JWT-claims context inside a transaction.

Observed:

- active participant roster visible: Covey, Cal, Charbonneau;
- current public plays visible: `2`;
- Covey's own current plays visible: `2`;
- settings and results history visible.

## Admin visibility

RLS was exercised with the Admin user id in authenticated JWT-claims context.

Observed:

- active participant roster plus the Admin self-profile were visible;
- current plays, settings, and history were visible.

## Owner metadata edit

The existing production-compatible `edit_own_called_it_metadata` RPC was invoked as Covey against Covey's active TSLA challenge inside a transaction using its existing values.

The RPC returned the correct challenge/owner/status/action and the transaction was rolled back. No production content changed.

Column grants were also inspected: authenticated direct UPDATE is restricted to only:

- `amount_committed`;
- `updated_at`;
- `reason`;
- `portfolio_action`;
- `action_amount`.

Authoritative ticker/direction/price/target/status fields are not part of the owner UPDATE grant.

## Admin settings / winner authorization

RLS write behavior was exercised using no-op updates inside transactions:

- participant session updating `game_settings`: `0` rows;
- admin session updating `game_settings`: `1` row;
- admin session updating `weekly_winner`: `1` row.

All transactions were rolled back.

## Real zero values

R4 explicitly checked zero-value semantics without leaving production mutations behind.

Inside a transaction, the database accepted:

- review cooldown `0`;
- Called It payout `0`;
- weekly winner return `0`.

The transaction was rolled back. Frontend zero handling remains explicit:

- numeric parsing treats `0` as numeric rather than absent;
- money formatting renders `0` as currency rather than an unavailable sentinel;
- history percentage formatting renders a zero return as `0.00%`;
- Rules settings treat zero cooldown/payout as present values.

## Edge Function / market authority

Production `called-it` Edge Function is ACTIVE, version 2.

Although its platform `verify_jwt` switch is disabled, the function implements its own mandatory bearer-token validation through `getActor()` before dispatching any action. It continues to own:

- create;
- check;
- submit;
- cancel;
- review;
- reset cooldown;
- admin edit;
- market quote retrieval and target calculation.

The current quote cache shows Twelve Data as the provider for existing TSLA/MSFT calls. The cache is internal and not browser-readable.

---

# Exact-candidate local browser QA

The branch cannot be navigated as a network-connected site in this environment, but the exact candidate HTML/CSS can be loaded into Chromium through DevTools document injection. This was used for responsive/layout and controller-level tests.

## Responsive widths

Candidate document width equaled viewport width at:

- 320 px;
- 390 px;
- 412 px;
- 700 px;
- 900 px;
- 1440 px.

No page-level horizontal overflow was measured.

## Receipts semantics / clipping

After the R4 correction:

- both tractor-feed rails remain fully visible;
- `THE RECEIPTS` remains within the safe paper column;
- record-holder summary text remains bounded;
- history detail text wraps inside the ledger rather than being clipped;
- no full-sheet or row-level horizontal overflow was measured at 320 or 390 px.

## Keyboard focus containment / restoration

The existing homepage modal-controller logic was exercised in Chromium with the real auth modal markup.

Passed:

- opening auth focuses `#authEmail`;
- background siblings become inert;
- Tab from the last focusable wraps to the first;
- Shift+Tab from the first wraps to the last;
- Escape closes the modal;
- focus returns to the invoking Sign In button;
- inert state is cleared after close.

## Help sheet containment

At a 390 × 360 viewport the Called It help sheet remained fully inside the viewport with `overflow-y: auto`. The CSS therefore has a contained scrolling path when vertical room is constrained.

A real touch-scroll gesture on Android is still a live-device check.

## Virtual-keyboard proxy

A 390 × 450 viewport was used as a reduced-height proxy for a mobile virtual keyboard while the Called It edit sheet contained content taller than the viewport.

Observed:

- sheet remained within the viewport;
- visible sheet height: 360 px;
- content scroll height: 1,017 px;
- overflow remained internal to the modal sheet.

This verifies responsive geometry, not actual Android keyboard/VisualViewport behavior.

## Reduced motion

Chromium was run with `prefers-reduced-motion: reduce` against the lesson surface.

Observed:

- reveal opacity: `1`;
- reveal transform: `none`;
- reveal transition duration: `0s`;
- bar transition duration: `0s`;
- lesson modal animation: `none`.

## Rules with real current settings

The exact Rules candidate DOM was rendered with the current live settings read from Supabase.

Observed text:

- Up: `15%` within `28 days`;
- Down: `15%` within `28 days`;
- About the Same: `3%` after `28 days`;
- claim window: `7 days`;
- review cooldown: `7 days`;
- payout: `$5.00`.

The settings-status warning hid when the complete setting set was supplied, and the page remained 390 px wide with no overflow.

## Unavailable state

The existing application remains fail-closed when dashboard/settings retrieval fails. The R3/R4 presentation layer changes copy only:

- public failures say the data "couldn't load";
- leader values become neutral dashes rather than a fake participant named `Unavailable`;
- the signed-out action prompt becomes a clickable Sign in control;
- none of these changes manufacture plausible data.

---

# Source-verified safeguards that could not be exercised against live network timing

## Ticker A → B stale-response race

The current `app.js` maintains both:

- a ticker-search `sequence` counter; and
- a per-form quote-request counter.

A changed search invalidates the previous search sequence. A quote response is discarded unless:

- the form is still connected;
- the form still belongs to the open edit modal;
- its request id is still current;
- the selected ticker still equals the expected ticker;
- any returned ticker still equals the expected ticker.

## Clear ticker in flight

Every ticker-search input event increments the quote-request id, clears the hidden ticker, clears the preview snapshot, and resets the quote/goal display before returning on an empty query. A prior in-flight response therefore fails the current-request check.

## Close/reopen modal in flight

Closing a modal increments the quote-request id for each open Called It form before the modal is removed from the active state. `requestQuotePreview()` also rejects a response when the form is disconnected or no longer contained by the edit modal.

These protections are source-confirmed and were covered by Turn 9 review, but this R4 environment cannot create real delayed Supabase/Twelve Data browser requests to prove their timing behavior end-to-end.

---

# Security / performance advisor observations

No R4 visual work changed database schema, RLS, grants, Edge Functions, or Supabase configuration.

Current Supabase advisors report pre-existing project observations:

- `internal_settings` and `market_quote_cache` have RLS enabled with no policies. This is intentional for current design because browser roles have no access and service-role access is used internally;
- `pg_net` is installed in the public schema;
- leaked-password protection is currently disabled in Supabase Auth;
- several recently added indexes are reported unused so far.

These were not introduced by `goblin-visual-reredesign`. They should not be misrepresented as visual-regression findings.

---

# Branch / drift audit

R4-specific diff from `aa0e824edfc3aad6cacf59fd3cf99fb318fd14bb` before this record:

- `css/visual-r3-owner-corrections.css`;
- `js/visual-r3-state-copy.js`.

R4 is three commits ahead and zero behind that starting SHA.

Full visual-redesign diff from the authoritative Turn 9 baseline contains visual assets/CSS, design-lab files, visual review docs, homepage/Rules/lesson markup, and the presentation-only state-copy module. It does **not** modify:

- `js/app.js`;
- `js/called-it-ui.js`;
- `js/plays.js`;
- `js/market.js`;
- `js/auth.js`;
- `js/backend.js`;
- `js/rules.js`;
- Supabase migrations;
- Edge Functions;
- RLS or grants.

Production `main` is still unchanged.

---

# Cutover blockers still requiring real live-browser/device evidence

The following R4 steering checks cannot honestly be marked passed from this environment:

1. real Android Chrome;
2. actual participant sign-in and owner session through the candidate frontend;
3. actual admin session through the candidate frontend;
4. admin editing another participant through the candidate UI;
5. create Called It through the candidate UI and live market quote path;
6. owner edit Called It through the candidate UI;
7. live ticker A → B delayed-response race;
8. live clear-ticker-in-flight race;
9. live close/reopen-modal-in-flight race;
10. real mobile virtual-keyboard behavior;
11. touch scrolling of the help sheet on a device;
12. review-state UI against an actual under-review challenge;
13. weekly-winner update including real chart upload through the UI;
14. real Google Font/image/network loading/performance from the deployed candidate.

Until those are run, **R4 is not a production cutover approval**.

---

# Mandatory authority work before redesign merge

The repository's backend handoff already records a deliberate temporary production-compatibility exception: owner metadata edit still uses `edit_own_called_it_metadata` directly.

Before the redesign can merge to `main`, the approved cutover work must:

1. add authenticated `owner_edit` to the `called-it` Edge Function;
2. move frontend owner edit to that server-authoritative action;
3. verify it with a real participant session;
4. revoke the transitional authenticated direct UPDATE grants;
5. retire or restrict the temporary RPC path.

This authority migration is **not performed in R4 without explicit owner approval**, because production `main` still depends on the current compatibility path.

---

# R4 gate status

**Automated / connected-backend QA:** passed to the extent this environment can exercise it.  
**Known R4 defects discovered:** corrected.  
**Backend/security/business-rule drift from visual branch:** none found.  
**Real browser/device/auth integration QA:** incomplete.  
**Owner final visual acceptance:** pending explicit final gate.  
**Production merge/cutover:** NOT AUTHORIZED / NOT PERFORMED.
