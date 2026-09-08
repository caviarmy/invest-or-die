# Goblin Brokerage Redesign — Turn 8 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Turn-start head:** `2be9ce95f3dab32da1f6728bf8534dffebd6d492`  
**Correction code head:** `06bc909314073ee5588e84f143c0ba832970c59a`  
**Status:** CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-07

## Review posture

This pass used the v6 adversarial rule: assume the seasoning pass may have made the product worse, more decorative, less truthful, or less consistent, and try to falsify the Turn 8 completion claims.

Reviewed against:
- `goblin_investing_redesign_master_v6.md` Turn 8;
- the v6 asset strategy;
- `implementation-control.md`;
- `turn-7-completion.md`;
- `turn-7-correction-review.md`;
- the Turn 8-only diff from `2be9ce95...`;
- current dashboard, Rules, Called It renderer, and asset files.

## Finding corrected during the pass

### Medium — direction-mark palette did not initially survive both surfaces

The first versions of the rising/falling direction assets used dark paper-oriented colors. That looked appropriate on the paper form/editor but the rising green in particular had insufficient visual separation from the dashboard's near-black challenge-slip background.

Why this mattered:
- the icon is decorative, but invisible decoration does not add authorship;
- Turn 8 should not create an asset that only works on one of the surfaces where the renderer uses it;
- the architecture requires asset independence and a later accessibility audit should not have to discover an obvious source-level contrast problem.

Correction:
- rising: `#4C854E`;
- falling: `#B84A44`;
- flat: `#7D776B`.

Source calculations place each mark above roughly 3:1 non-text contrast against both the near-black dashboard surface and off-white paper surface.

## No additional source-level findings

### State provenance

None of the new seasoning introduces application state.

- Brokerage seal: static decorative brand mark.
- Crooked arrow: static annotation attached to existing joke copy.
- Direction SVGs: decorative representation of the already-known prediction direction; adjacent text remains authoritative/readable.

No new `Approved`, `Active`, live-market, regulated, verified, or official account claim was added.

### Semantic values / authority timing

Turn 8 introduces no numeric value, fallback, payout, price, date, or mutable setting.

No action label changed and no value was added to a mutation control.

### Shared-helper scope

The exported `directionLabel()` remains unchanged.

Turn 8 replaced the old private slip emoji formatter with a private slip markup formatter. This means:
- brokerage-slip presentation changes where intended;
- Receipts/shared consumers are not silently restyled;
- existing direction semantics remain unchanged;
- no server/controller input or output contract changes.

This deliberately follows the Turn 4 correction principle that slip-specific presentation must not leak into shared semantic helpers.

### Why not replace every direction emoji globally

The architecture describes custom direction assets as a medium-priority replacement opportunity, not a requirement to rewrite every semantic direction representation.

Turn 8 is explicitly a 10–15% seasoning pass. Converting every direction surface would widen the turn into shared presentation semantics and risk regression outside the brokerage slips.

Therefore:
- challenge slips and locked slip summary use the custom SVGs;
- existing shared direction strings remain unchanged;
- any remaining platform-emoji use is a possible Turn 9 de-AI/consistency observation, not an incomplete Turn 8 behavior contract.

### Joke-density audit

The dashboard already had:
- one tracker joke;
- one training stamp;
- champion stamp;
- Receipts record/state stamps.

Turn 8 adds only a hand arrow to the existing tracker joke. It does not add another dashboard stamp or new punchline.

Rules adds one brokerage seal and no joke copy.

Article receives nothing.

This remains within the architecture's instruction to use approximately 1–2 stamp-like marks per page/state and to keep goblin interference intermittent.

### “Ignore every joke” acceptance test

If all Turn 8 decorative marks are ignored or fail to load:
- tracker still communicates current week/buy-in requirement;
- Called It slips still contain explicit direction text;
- Rules still has complete heading/document hierarchy;
- no action disappears;
- no status meaning disappears;
- no navigation disappears;
- no layout depends on the decoration.

The underlying product remains coherent without the joke layer.

## Responsive / bounds review

New fixed asset dimensions:
- slip direction mark: 24×16;
- tracker arrow: 48×22;
- Rules seal: 72×72.

At 320–360px:
- no asset approaches the available page width;
- tracker annotation remains in normal document flow and can wrap;
- direction SVG and label remain within the existing full-width prediction strip;
- Rules seal remains inside the flexible paper header;
- no new positioned element can escape the viewport;
- no nested scrolling is introduced.

No structural breakpoint changed, so there is no new breakpoint-boundary mode to test in source.

## Accessibility review

- all new SVG `<img>` instances are decorative with empty alt text and `aria-hidden="true"`;
- direction remains written as text beside the icon;
- no information is conveyed by color alone;
- no interactive targets were created;
- no hit-target regression;
- no focus/ARIA/modal behavior changed.

## Asset review

All new assets:
- are SVG geometry;
- contain no `<text>`;
- use no external fonts;
- use no raster image;
- use no animation;
- are small and scalable;
- are repository-local.

The brokerage seal uses a geometric `GB` monogram and market/ledger lines rather than a fantasy or character motif.

## Regression / scope review

Turn 8 runtime changes are confined to:
- `index.html` — one decorative tracker arrow;
- `rules/index.html` — one decorative Rules seal;
- `js/called-it-ui.js` — private slip direction presentation;
- five new SVG assets.

No changes to:
- `js/app.js`;
- `js/plays.js`;
- `js/market.js`;
- `js/auth.js`;
- `js/backend.js`;
- `js/rules.js`;
- article page;
- `css/site.css`;
- Supabase schema/RLS/RPC/Edge Functions.

No new patch stylesheet or post-render decorator was introduced.

## Philosophy review

Turn 8 remains aligned with **human system, goblin damage**.

Human system remains dominant:
- scoreboard;
- brokerage slips;
- paper forms;
- Receipts ledger;
- Rules document;
- training bulletin.

Goblin interference remains sparse:
- one crooked annotation;
- an appropriated-looking GB seal;
- crude custom market marks.

No fantasy language, mascot, green goblin character, coins, parchment, cartoon Wall Street scene, or visual joke is used as the structural design language.

## Validation completed

- re-fetched current Turn 8 runtime files;
- re-fetched all new assets;
- verified new SVGs contain no live text;
- inspected Turn 8-only changed-file scope;
- source-reviewed 320–360px geometry;
- syntax-checked the changed direction markup helper in isolation;
- audited state provenance and authority timing;
- audited joke frequency page by page;
- corrected cross-surface direction-mark contrast;
- confirmed no behavior/controller/backend regression was introduced.

## Deferred runtime QA

Turn 9 should verify in a real browser/device:
- exact SVG baseline alignment in challenge slips;
- direction contrast with real display/font rendering;
- tracker note + arrow wrapping on Android Chrome;
- Rules seal position with loaded IBM Plex fonts;
- asset loading from deployed GitHub Pages paths;
- final whole-site de-AI / over-decoration balance.