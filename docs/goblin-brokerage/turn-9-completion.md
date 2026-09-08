# Goblin Brokerage Redesign — Turn 9 Release-Candidate Audit

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `30fc74595ae6b5ecc582a09f140f13b86d4bd238`  
**Turn-start / current production `main` head:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`  
**Runtime source head before documentation:** `56dbb5889f52f89bea4da145bb30d785e1d79548`  
**Status:** CODE COMPLETE / ADVERSARIAL REVIEW COMPLETE / CROSS-TURN INTEGRATION REVIEW COMPLETE / ANDROID AND INTEGRATED BROWSER RUNTIME QA DEFERRED  
**Completed:** 2026-09-08  
**Correction review:** `turn-9-correction-review.md`

## Goal

Turn 9 treats the redesign as a release candidate and audits the combined product rather than adding another feature surface.

Required audit areas:
- mobile / responsive behavior;
- performance;
- accessibility;
- de-AI aesthetic quality;
- truth and provenance;
- cross-turn regression and workflow consistency.

The design north star remains **Human system, goblin damage**. No additional goblin decoration was added merely to increase personality, and the lesson article remains a distinct editorial surface rather than being flattened into the dashboard visual system.

Turn 10 was not started. The deferred owner-edit production cutover was not performed. `main` was not modified or merged.

## Environment and authority

- working frontend: `goblin-brokerage-redesign`
- live frontend: `main`
- production `main` remained at `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9` throughout Turn 9
- shared backend: production Supabase, unchanged
- Called It create/check/submit/cancel/admin-edit authority: existing `called-it` Edge Function, unchanged
- owner metadata authority: existing transitional `edit_own_called_it_metadata` RPC, unchanged
- auth implementation: unchanged
- market request implementation: unchanged
- RLS, grants, schema, migrations, Edge Functions, and Supabase configuration: unchanged

Turn 9 changes are frontend release-hardening changes. No server-authoritative challenge lifecycle, review, payout, eligibility, auth, or ownership rule was changed.

## Runtime files changed

- `index.html`
- `css/site.css`
- `js/app.js`
- `js/called-it-ui.js`
- `js/plays.js`
- `learn/invest-or-die/index.html`

Documentation:
- `docs/goblin-brokerage/turn-9-completion.md`
- `docs/goblin-brokerage/turn-9-correction-review.md`
- `docs/goblin-brokerage/implementation-control.md`

No Turn 9 changes were made to:
- `js/auth.js`
- `js/market.js`
- `js/backend.js`
- `js/rules.js`
- `rules/index.html`
- Supabase migrations, schema, RLS, grants, RPC definitions, or Edge Functions

## Truth / provenance audit

### Dashboard fallback state

The largest release-candidate truth defect was the old browser fallback model. When live dashboard data was absent or failed to load, the frontend could render plausible values such as:
- named participants;
- `Week 6`;
- `$5` weekly buy-in;
- current-looking Called It percentages, duration, cooldown, claim window, and payout.

Those values looked authoritative despite having no current provenance.

Correction:
- `fallbackDashboardData()` now represents unavailable data explicitly with `available: false`;
- participant/play/history arrays are empty;
- mutable settings are `null` rather than plausible defaults;
- live loaded data sets `available: true`;
- tracker, winner, participants, Receipts, and management controls render distinct unavailable states instead of treating a failed load as valid empty/current data.

A network/configuration failure can no longer silently turn a remembered/static value into current application truth.

### Session truth is separate from data-load truth

Dashboard refresh failure previously shared a catch path with session refresh. This could make a valid session appear signed out simply because the dashboard query failed.

Correction:
- session refresh and dashboard-data refresh now fail independently;
- a dashboard load failure fails the data surfaces closed without inventing a different auth state;
- add/admin controls require `state.data.available` in addition to their established role/session checks.

No auth contract changed.

### Called It target qualification

A source-level sentinel defect allowed missing target values to pass through JavaScript numeric coercion. In particular, `Number(null) === 0` could make a Down challenge with a missing target look qualified when a checked price was compared against zero-derived state.

Correction:
- qualification now requires finite positive checked prices and finite positive target/range values;
- flat challenges also require valid finite dates and a complete range;
- missing target data cannot produce `GOAL MET AT LAST CHECK` or expose Submit for Review.

The authoritative submit action still rechecks the price server-side; this correction only stops the browser from inventing a qualifying preview state.

### Preview snapshot coherence

Turn 5 established that a quote preview must use the quote and settings returned by the same preview response. Turn 9 found a remaining fallback path where absent preview settings could fall back to older dashboard settings.

Correction:
- preview settings are valid only when all three settings from the preview snapshot are present, finite, and positive;
- incomplete/missing preview settings render `Current challenge settings unavailable.`;
- no stale dashboard-setting substitution is used for a fresh quote preview.

### Blank numeric admin values

Another sentinel defect existed in admin save helpers: `Number('')` becomes zero. This was especially dangerous for fields where zero can be legitimate, such as review cooldown, payout, and weekly return.

Correction:
- `numericInput()` treats null, undefined, and blank strings as missing before numeric conversion;
- real numeric zero remains a legitimate value when the field's validation allows it;
- blank fields therefore fail validation rather than silently saving zero.

### Missing action amounts

Existing records with a missing action amount could be visually or editorially normalized into a legitimate-looking `$5` during edit/display.

Correction:
- stored missing amounts remain missing in edit fields;
- display copy says `amount unavailable` for Buy/Hold/Sell when needed;
- form submission explicitly requires at least `$5` for actions that require an amount;
- `Not Buying` remains amountless.

### State-provenance summary

| Surface | Visible state/value | Provenance after Turn 9 |
| --- | --- | --- |
| Tracker week / buy-in | Current week and cumulative buy-in | authoritative `game_settings`; unavailable when missing |
| Weekly winner | name, return, dates, chart | authoritative `weekly_winner`; unavailable when load fails |
| Active challenge | ticker, stored terms, last check, review status | authoritative `called_it_plays` fields |
| Goal-met callout | last check versus stored target | derived only from complete finite stored state; server submit still authoritative |
| Receipts | event/status/payout | existing `results_history` semantics retained from Turn 6 |
| Called It preview | quote + calculated goal | one preview-response quote/settings snapshot; advisory only |
| Rules configurable values | current settings | existing Turn 7 fail-closed public settings load, unchanged |
| Lesson numbers | model/example language | static editorial model, not live account state |

## Mobile / responsive audit

Source-level responsive review covered the narrow-phone assumptions and structural breakpoint boundaries used by the combined product.

Corrections:
- 320–420px header gets reduced gaps, a smaller wordmark, and compact account/nav controls;
- the signed-in account label is suppressed at 700–899px where it competed with the wordmark, navigation, and auth action;
- existing 899/900px Receipts record/table boundary remains intact;
- existing 380px Called It action-control stack remains intact;
- no new nested vertical scroll region was added to slips or repeated cards;
- full-height Called It paper sheet and help sheet remain intentional viewport-containment scroll surfaces on mobile.

The source review covered worst-case wrapping and breakpoint geometry. Actual Android rendering, virtual keyboard behavior, font metrics, and pointer behavior remain runtime QA.

## Accessibility audit

Source-level corrections and confirmations:
- dashboard has a coherent page-level heading structure rather than beginning with a later section heading;
- participant names remain semantic headings;
- direction controls retain `aria-pressed` and update it with visual selection;
- no fake ARIA listbox/menu/tab roles were introduced;
- modal focus entry, inert background, Tab containment, Escape/close, body-scroll recovery, and focus restoration remain in the controller;
- article modal retains the same complete modal contract through its namespaced implementation;
- primary interactive links, wordmark/home link, text-button controls, and editorial links now receive approximately 44px minimum target treatment where practical;
- visible focus treatment was strengthened for links/buttons/disclosures;
- paper Called It controls use a dark-green focus treatment appropriate to the light surface;
- Receipts admin controls retain their existing light-surface focus treatment;
- reduced-motion handling still covers shared CSS and the article's JavaScript counter.

Actual screen-reader, keyboard-browser, Android TalkBack, and physical touch-target testing remains runtime QA.

## Performance audit

Turn 9 did not add a framework, polling loop, observer-heavy compatibility layer, extra remote font family, or new runtime dependency.

Source-level correction:
- the optional weekly winner chart is marked for lazy asynchronous image decoding/loading so an off-screen chart does not need to compete with initial content unnecessarily.

Existing performance-positive architecture remains:
- static HTML/CSS/ES modules;
- one shared font request already preconnected in document heads;
- no large JavaScript framework;
- no continuous animation loop on the dashboard;
- article observers are scoped to its editorial effects and reduced-motion bypass remains in place.

No Lighthouse/Web Vitals/network timing claim is made because an integrated browser build with its real external dependencies could not be executed in the available environment.

## De-AI aesthetic audit

Turn 9 removed rather than added decorative narration:
- removed the redundant `WEEKLY PERFORMANCE DESK` kicker above Win the Week;
- removed platform chart emoji from the shared textual direction formatter, keeping the authored SVG family for visual direction marks;
- retained established brokerage/document artifacts only where they have a visible referent;
- did not add another seal, stamp, joke label, goblin icon, mascot, fantasy art, or fake financial state;
- preserved Rules as a document/ledger surface;
- preserved the lesson article's separate editorial visual language.

The cross-turn review found one remaining status-like article treatment: `YOU ARE HERE · THIS IS WHAT YOU'RE DOING NOW`. It implied live knowledge of the reader and used a status-pill treatment even though the section is a static model. It was replaced with the neutral editorial label `OPTION 2 · INVEST THE SAME $5`, and the unused pill/status CSS was removed.

## Cross-turn workflow consistency

Turn 9 rechecked the combined flows established by Turns 5–8:
- ticker search still invalidates prior search/quote work on input change, clear, new selection, close, and component replacement;
- detached/replaced form responses still cannot write late success/error state into the current modal;
- admin edit still preserves historical price/target until ticker or direction actually changes;
- server-authoritative create/check/submit/cancel/review semantics are unchanged;
- Receipts still distinguishes Recorded, Under Review, Approved, Rejected, and unavailable status using Turn 6 semantics;
- pending/unknown Called It payouts are not presented as final values;
- Rules still distinguishes household weekly-buy-in enforcement from software enforcement;
- direction visuals remain one authored SVG family through form and filed-slip presentation, while shared history text remains plain semantic text;
- article local modal ownership remains namespaced and separate from shared `.modal` ownership.

## Source-level verification executed

Executed after source corrections:
- re-fetched current Turn 9 runtime source from `goblin-brokerage-redesign`;
- `node --check` passed for current `js/plays.js`;
- `node --check` passed for current `js/called-it-ui.js`;
- `node --check` passed for current `js/app.js`;
- inspected article correction commit and confirmed it changed only the static Option 2 label and removed its obsolete status-pill CSS;
- compared the Turn 9-only source diff from `30fc74595ae6b5ecc582a09f140f13b86d4bd238`;
- rechecked branch divergence from `main`;
- verified `main` remained unchanged at `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`.

## Runtime QA status

**CODE COMPLETE:** yes.  
**ADVERSARIAL CORRECTION REVIEW COMPLETE:** yes.  
**CROSS-TURN INTEGRATION REVIEW COMPLETE:** yes.  
**QA COMPLETE:** no.

Actual integrated browser/device QA is deferred.

The execution environment contains Chromium, but it could not resolve/load the GitHub branch or the external CDN/backend dependencies needed to exercise the real candidate. Source inspection and JavaScript syntax checks are not being reported as browser/device tests.

Deferred runtime QA includes:
- Android Chrome at 320–360px and common device widths;
- 380/381, 699/700, 899/900 breakpoint behavior with real IBM Plex metrics;
- signed-out, owner, admin-self, and admin-other workflows;
- ticker A→B out-of-order preview timing;
- clear ticker while requests are in flight;
- close/reopen modal while quote work is in flight;
- virtual keyboard behavior in the Called It sheet;
- pointer/backdrop ordering and tap-through checks;
- Tab/Shift+Tab containment and focus restoration in actual browsers;
- screen-reader semantics for reflowed Receipts;
- Rules success/error configuration states against live Supabase;
- article reduced-motion and modal behavior in a browser;
- actual image/font/network performance measurements.

## Release-candidate conclusion

Turn 9 source is ready to proceed to runtime QA / later release work without known source-level release blockers from this audit.

That does **not** mean production cutover is authorized. The deferred owner-edit authority cutover remains a pre-merge gate, and Turn 10 has not begun.
