# Goblin Brokerage Redesign — Turns 7–8 Combined Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Review base:** `9bd85fbdf2963be3469d3e9193f0865191247a67`  
**Correction code head:** `544641e83b043d242f5f4f2757b6aec5f3189b4e`  
**Status:** SOURCE-LEVEL CORRECTIONS COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-07

## Why this pass exists

Turns 7 and 8 each passed their original correction reviews, but a later combined review found several issues that were easier to see only after the secondary-page integration and seasoning work were considered as one product.

This pass did not begin Turn 9. It corrects source-level debt before the integrated release-candidate audit.

## Findings corrected

### 1. Called It direction treatment was inconsistent inside one workflow

Turn 8 introduced authored SVG direction marks for filed challenge slips, but the prediction buttons in the form still injected platform emoji through CSS.

That produced one visual language while filing a challenge and another after filing it.

Correction:
- prediction buttons now use the same repository-local up/down/flat SVG family as challenge slips;
- the old CSS `📈` / `📉` pseudo-elements were removed;
- direction text remains visible beside each decorative mark;
- `aria-pressed` remains the authoritative selected-state semantic;
- exported `directionLabel()` remains unchanged so Receipts/shared text consumers are not silently restyled by this correction.

### 2. Turn 8 assets were present but under-integrated

The tracker arrow and Rules seal had been inserted as plain images without layout treatment.

Correction:
- the tracker annotation now has a dedicated layout class and the crooked arrow is positioned as an actual upward/right annotation toward the buy-in area rather than an arbitrary trailing glyph;
- the Rules brokerage seal is positioned as a restrained stamped document mark in the file header rather than participating in ordinary paragraph flow;
- the seal remains decorative, low-opacity, slightly rotated, and non-authoritative;
- the direction strips/buttons now have explicit icon/text alignment and spacing.

The site still works if any of these decorative assets fail to load.

### 3. Rules failed closed but failed silently

Turn 7 correctly stopped unverified settings defaults from masquerading as current rules, but a failed settings request left sentences containing bare em dashes with no explanation.

Correction:
- Rules now contains a visible live-status message while current settings load;
- a failed or partial read explains that current configurable settings are unavailable while fixed rules still apply;
- goal clauses use readable fallback sentences such as `Current target unavailable.` rather than malformed `— above` language;
- duration, claim-window, cooldown, and payout fallbacks are grammatical phrases rather than numeric-looking placeholders;
- the status message disappears only when all current configurable values are successfully loaded.

No fallback numeric value is presented as current state.

### 4. Weekly-buy-in wording overstated application enforcement

The Rules page said participants had to stay current on the weekly buy-in requirement `to keep playing`.

Current source establishes:
- `game_settings.weekly_stock_buy_min` is stored and displayed;
- weekly winners are entered by the admin;
- the Called It server authority checks identity, active participant state, slot occupancy, cooldown, duplicate ticker, market data, and challenge rules;
- it does not read brokerage purchase history or weekly-buy-in compliance.

Correction:
- Rules now identifies weekly-buy-in compliance as a **household rule**;
- it explicitly says the site displays the requirement but does not automatically verify brokerage purchases or block play based on them.

This removes an enforcement claim the software does not support.

### 5. Article typography requested font weights that are not loaded

The article loaded IBM Plex Sans/Condensed/Mono only through weight 700 but retained many legacy `800`, `850`, `900`, `950`, and `1000` declarations.

Correction:
- article weight requests above 700 were normalized to the actual loaded 700 face;
- emphasis remains driven by scale, condensed type, spacing, composition, and color rather than unsupported numeric-weight escalation.

This also removes one obvious item from the later de-AI audit without flattening the article into the dashboard/Rules visual system.

### 6. Reduced-motion handling did not cover the JavaScript counter

The article CSS disabled transitions and animations for `prefers-reduced-motion`, but the number counter still ran a 900ms `requestAnimationFrame` animation.

Correction:
- the article reads `prefers-reduced-motion` in JavaScript;
- counters write their final formatted value immediately when reduced motion is requested;
- ordinary users retain the existing counter behavior.

### 7. Article modal class ownership was too generic after shared-CSS integration

Turn 7 made the article consume `site.css`, but the article still defined a separate component using the same generic `.modal` class used by the main application.

It worked only because article inline CSS came later in the cascade.

Correction:
- article modal classes are now namespaced as `.lesson-modal`, `.lesson-sheet`, `.lesson-sheet-top`, and `.lesson-close`;
- article JavaScript selectors were updated to the same namespace;
- shared application `.modal` behavior and article info-sheet behavior now have explicit ownership boundaries.

The Turn 7 focus containment, inert background, Escape close, backdrop handling, body-scroll recovery, and focus restoration remain intact.

## Regression review

The correction pass changes only:
- `index.html`;
- `rules/index.html`;
- `learn/invest-or-die/index.html`;
- `css/site.css`;
- `js/rules.js`;
- `js/called-it-ui.js`.

No changes to:
- `js/app.js`;
- `js/plays.js`;
- `js/market.js`;
- `js/auth.js`;
- `js/backend.js`;
- Supabase migrations, RLS, RPCs, grants, or Edge Functions;
- Called It server-authoritative quote/check/submit/review semantics;
- Turn 6 Receipts state/payout semantics.

`directionLabel()` intentionally remains unchanged to avoid changing shared semantic text outside this correction scope.

## Philosophy review

These corrections strengthen the v6 design intent rather than adding more theme.

- Rules remains a credible human ledger/document.
- The seal now behaves like a mark on paperwork rather than an inserted illustration.
- The tracker arrow now acts like an annotation rather than satisfying an asset checklist.
- The Called It form and filed slip use one authored brokerage-direction language.
- No new jokes, stamps, mascot material, fantasy language, or fake institutional state were added.
- The article retains editorial freedom; the correction removes fake font-weight intensity and CSS ownership ambiguity without forcing it into the dashboard visual grammar.

This remains **human system, goblin damage**.

## Validation completed

- compared the correction diff from `9bd85fb...`;
- confirmed exactly six runtime files changed;
- re-fetched current `js/rules.js` and article source after writes;
- Node syntax check passed for current Rules module source;
- Node syntax check passed for the corrected article inline script;
- isolated syntax/output check passed for the changed Called It direction-mark helper and prediction-button markup;
- confirmed the weekly-buy-in enforcement claim is not implemented in `js/plays.js` or the Called It server authority path;
- confirmed no backend/auth/history authority file changed.

## Deferred runtime QA

Turn 9 should still verify in a real browser/device:
- direction SVG alignment inside prediction buttons and filed slips;
- tracker arrow placement/wrapping at 320–360px and at the 700px boundary;
- Rules seal placement at narrow widths and with loaded IBM Plex metrics;
- Rules loading/success/error states against the live Supabase project;
- article typography after the weight normalization;
- article reduced-motion behavior using an actual browser preference;
- all four lesson info sheets for pointer, keyboard, focus, scrolling, and restoration behavior;
- full de-AI/over-decoration audit across the combined product.

## Next canonical step

Turn 9 — Mobile, performance, accessibility, and de-AI audit.

Turn 9 was not started during this correction pass.
