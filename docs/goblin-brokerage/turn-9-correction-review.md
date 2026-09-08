# Goblin Brokerage Redesign — Turn 9 Correction Reviews

**Branch:** `goblin-brokerage-redesign`  
**Turn 9 review base:** `30fc74595ae6b5ecc582a09f140f13b86d4bd238`  
**Runtime source head after both review passes:** `56dbb5889f52f89bea4da145bb30d785e1d79548`  
**Production `main`:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`  
**Status:** BOTH MANDATORY SOURCE-LEVEL REVIEW PASSES COMPLETE / ANDROID AND INTEGRATED BROWSER RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-08

This record deliberately separates the two review passes required by `goblin_redesign_review_protocol.md`. The second pass was not treated as a restatement of the first.

# Pass 1 — Mandatory adversarial correction review

## Method

Assumption: the Turn 9 implementation could be subtly wrong even if its normal self-review looked complete.

The pass re-read the Turn 9 requirements, current source, prior Turn 5–8 correction contracts, and the Turn 9-only diff. It tried to falsify truth/provenance, numeric-sentinel, responsive, accessibility, performance, workflow, and scope claims.

## Finding 1 — plausible dashboard fallback data masqueraded as current state

**Severity:** release blocker

The dashboard fallback object contained named participants and plausible mutable settings such as Week 6, `$5` weekly purchase minimum, and Called It percentages/durations/payout. A configuration or data failure could therefore present believable but unverified state as current application truth.

### Correction

- replaced plausible fallback values with explicit unavailable state;
- added `available: false` to the unavailable dashboard model;
- mutable settings are null;
- participants/plays/history are empty;
- successful authoritative load sets `available: true`;
- tracker, weekly winner, participants, Receipts, and controls distinguish unavailable from authoritative empty/no-record state.

This is fail-closed presentation, not a backend behavior change.

## Finding 2 — dashboard failure could overwrite session truth

**Severity:** high

Session retrieval and dashboard-data retrieval shared an error path. A data query error could produce a signed-out-looking local session even when authentication itself had succeeded.

### Correction

Session refresh and dashboard-data refresh now have separate failure handling. Data can become unavailable without inventing a different auth state.

No `auth.js` contract changed.

## Finding 3 — missing Called It target values could become numeric zero

**Severity:** release blocker

The old qualification helper compared checked prices using direct `Number(...)` conversion. Missing values such as null can become zero in JavaScript. A browser-only `GOAL MET` state could therefore be derived from incomplete stored terms.

### Correction

- checked prices must be finite positive numbers;
- Up/Down targets must be finite positive numbers;
- Flat requires finite positive low/high values and valid expiry/claim dates;
- incomplete terms return not-qualified;
- Submit for Review is not exposed from incomplete browser state.

The server remains authoritative and still rechecks on submission.

## Finding 4 — preview settings could silently fall back to an older snapshot

**Severity:** high

Turn 5 established a coherent-snapshot rule: one preview response returns both quote and target settings. Turn 9 found that incomplete preview settings could still fall back to dashboard settings loaded at another time.

### Correction

A fresh goal preview now requires a complete finite-positive settings snapshot from that preview response. Missing/incomplete settings show `Current challenge settings unavailable.` instead of mixing ages.

## Finding 5 — blank admin numeric fields could silently save as zero

**Severity:** release blocker

`Number('') === 0`. Existing save helpers converted admin values directly, meaning blank input could become a legitimate zero in fields where zero is valid, especially review cooldown, payout, or weekly return.

### Correction

`numericInput()` now treats null, undefined, and blank strings as missing before conversion. Real numeric zero is still retained when field rules allow it. Blank fields fail validation rather than becoming zero.

## Finding 6 — missing action amounts could be normalized into `$5`

**Severity:** high

Existing record edit UI used a `$5` fallback for a missing action amount. This could rewrite or visually legitimize absent historical metadata.

### Correction

- missing stored amount renders as missing in the edit field;
- display copy uses `amount unavailable` rather than inventing `$5`;
- submit validates at least `$5` only for Buy/Hold/Sell;
- Not Buying remains amountless.

## Finding 7 — remaining platform emoji broke same-workflow direction language

**Severity:** medium

The form and filed slips had already moved to repository-authored direction SVGs, but `directionLabel()` still emitted chart emoji in shared text/history output.

### Correction

Shared semantic direction text is now plain `GOES UP`, `GOES DOWN`, or `FINISHES ABOUT THE SAME`. The authored SVG family remains visual presentation for form/slip surfaces. No platform emoji remains in the same Called It direction workflow.

## Finding 8 — heading hierarchy was incomplete

**Severity:** medium

The dashboard lacked a coherent page-level heading structure after earlier visual restructuring.

### Correction

A semantic page heading was restored while keeping visual hierarchy unchanged. Participant names remain headings under the Called It section.

## Finding 9 — narrow header and tablet boundary were source-predictable squeeze points

**Severity:** medium

The 320px phone header could become crowded by the wordmark, Rules link, and auth button. At 700px the signed-in account label became visible at the same breakpoint where wider header geometry activated, creating another likely squeeze zone before the full desktop layout.

### Correction

- 320–420px header spacing/wordmark/control sizing is tightened;
- signed-in account label remains hidden through 899px;
- desktop account label returns at 900px+;
- no content or auth behavior changed.

## Finding 10 — interactive target scrutiny was inconsistent

**Severity:** medium

Earlier turns hardened conventional buttons, help, and ticker results, but the brand/home link, text-style actions, footer/editorial links, and generic disclosure target treatment were not all held to the same mobile-target standard.

### Correction

Shared source now applies approximately 44px minimum target geometry to these interactive elements where practical and adds visible focus treatment.

Paper Called It focus uses the existing dark-green light-surface override rather than the dark-page green outline.

## Finding 11 — optional winner chart could load eagerly

**Severity:** low / performance

The weekly chart is supporting evidence and may be off-screen on initial load.

### Correction

The chart uses lazy loading and asynchronous decoding hints. No new dependency or framework was added.

## Finding 12 — de-AI label residue

**Severity:** low / aesthetic

`WEEKLY PERFORMANCE DESK` added another small institutional kicker above a section whose hierarchy already communicated the same meaning.

### Correction

Removed the redundant label. The useful Win the Week title and actual rule remain.

## Adversarial pass conclusion

After corrections, no source-level blocker remained from this pass. The pass did **not** declare Android/browser QA complete.

# Pass 2 — Mandatory cross-turn integration review

## Method

This was a separate pass after the adversarial corrections. It re-read the combined product as a single workflow and specifically checked whether Turn 9 changes or prior-turn surfaces conflict when integrated:
- shared CSS versus Rules and article local ownership;
- form → active slip → Receipts direction/state language;
- auth/data failure interaction;
- historical edit terms versus current settings;
- modal/help scroll and focus contracts;
- breakpoint changes across dashboard, Rules, Receipts, and article;
- de-AI/truth philosophy across a secondary editorial surface.

## Integration finding 1 — lesson article invented reader state

**Severity:** high truth / medium aesthetic

The lesson article contained a bright pill reading:

`YOU ARE HERE · THIS IS WHAT YOU'RE DOING NOW`

The article does not read the participant's live brokerage activity. The statement was therefore static lesson language styled like current state. It also reproduced a familiar AI-product pattern: a rounded status pill narrating context that the interface does not actually know.

### Correction

Changed the label to:

`OPTION 2 · INVEST THE SAME $5`

and removed the unused `.you-are-here` / `.here-star` styling.

The article remains visually distinct and editorial. It was not restyled into the dashboard/Rules brokerage system.

## Integration finding 2 — shared focus styling had to be checked on paper surfaces

**Severity:** medium review finding, no additional source change required

Turn 9 strengthened global focus outlines using the bright dark-page green. The integration pass checked whether that created a low-contrast focus indicator on the off-white Called It sheet.

Current shared source already contains the required paper-specific override:

- single-play paper link/button/summary focus uses dark green `#1f4e23`;
- ticker result focus uses dark green;
- Receipts admin focus uses dark paper ink treatment.

No duplicate correction was required.

## Integration finding 3 — direction representation is now coherent without forcing one visual onto every surface

**Result:** passed

- create/edit prediction buttons: authored direction SVG + text;
- filed challenge slips: same authored SVG family + text;
- owner locked edit: same authored SVG family;
- Receipts/history: semantic text only, intentionally not decorative SVG.

The shared semantic formatter no longer injects platform emoji. This is a coherent workflow without over-theming the ledger.

## Integration finding 4 — historical terms remain historical

**Result:** passed

Opening an existing admin edit still restores stored reference price and target. Current settings are fetched only when ticker/direction changes and the server will restart terms. Turn 9 preview fail-closed changes do not silently recalculate an unchanged historical record.

## Integration finding 5 — async ownership remains intact

**Result:** passed

The Turn 5 request-identity contract remains:
- every ticker input event invalidates old work;
- selecting a ticker invalidates older search work;
- quote preview carries a request identity;
- selected ticker must still match;
- component close/replacement advances quote identity;
- detached/replaced forms cannot write late success/error into the current modal.

Turn 9 did not add a competing request path.

## Integration finding 6 — server-authoritative behavior remains unchanged

**Result:** passed

Turn 9 changed frontend display validation/fail-closed behavior but did not alter:
- Called It Edge Function actions;
- market request wrapper;
- auth implementation;
- owner RPC contract;
- RLS/grants/schema;
- review/payout/cooldown authority;
- weekly winner persistence authority.

The new browser guards are conservative. They prevent unsupported UI conclusions; they do not authorize a mutation the server previously rejected.

## Integration finding 7 — Rules remains truthful and separate

**Result:** passed

Turn 7/7–8 corrections remain intact:
- configurable values fail closed;
- failure copy remains grammatical;
- weekly buy-in is explicitly a household rule rather than fake software enforcement;
- local page structure does not collide with the article modal implementation.

Turn 9 did not edit Rules source.

## Integration finding 8 — Receipts semantics remain intact

**Result:** passed

Turn 6 contracts remain:
- weekly rows are Recorded, not Approved;
- Under Review/unknown payout is not presented as final zero;
- Approved/Rejected status has actual review provenance;
- admin approve action does not promise a stale mutable payout amount;
- 899/900 receipt/table transition remains unchanged.

## Integration finding 9 — mobile scroll topology remains intentional

**Result:** source-level passed / runtime deferred

No new repeated nested vertical scrolling was introduced. The mobile Called It modal and help sheet retain intentional viewport-contained scroll surfaces with body scroll lock. Article modal remains namespaced with its own contained sheet.

Pointer ordering, virtual keyboard, and physical-device scroll behavior require runtime verification.

## Integration finding 10 — article independence remains intact

**Result:** passed

The article continues to use its own card/longform presentation and strong editorial pacing. Turn 9 corrected only a false status-like treatment and retained:
- independent article typography/composition;
- article-specific modal classes;
- article reduced-motion handling;
- no new brokerage-stamp decoration.

This preserves **Human system, goblin damage** without homogenizing the entire site.

# Validation after both passes

Completed source-level checks:
- current redesign runtime head re-fetched after the article correction;
- current `main` head re-fetched and unchanged;
- Turn 9-only compare confirmed exactly six runtime source files changed before documentation;
- branch-vs-main compare confirmed redesign remains ahead and not behind production;
- no Turn 9 auth/backend/Supabase file appeared in the Turn 9-only diff;
- `node --check` passed for current `js/plays.js`;
- `node --check` passed for current `js/called-it-ui.js`;
- `node --check` passed for current `js/app.js`;
- article correction commit was inspected directly and contains only the truthful Option 2 copy/CSS cleanup.

# Runtime QA classification

**SOURCE-LEVEL ADVERSARIAL REVIEW:** complete.  
**SOURCE-LEVEL CROSS-TURN INTEGRATION REVIEW:** complete.  
**ANDROID QA:** deferred.  
**INTEGRATED BROWSER QA:** deferred.  
**QA COMPLETE:** no.

Chromium is present in the execution environment, but the environment could not resolve/load the GitHub candidate or the external CDN/backend dependencies needed to exercise the actual application. Browser/device behavior was therefore not inferred from source inspection.

Runtime-only items remain documented in `turn-9-completion.md`.

# Scope / philosophy conclusion

The review corrections remove invented state, false numeric finality, stale snapshot mixing, narrow-layout risk, and redundant status narration. They do not add theme or new lifecycle semantics.

Turn 9 remains **Human system, goblin damage**.

Turn 10 was not started. The deferred owner-edit production cutover was not performed. Nothing was merged to `main`.
