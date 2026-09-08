# Goblin Brokerage Redesign — Turn 7 Rules Page + Article Integration

**Branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Turn-start redesign head:** `27cb351f4277cd9b155c7c601605822d77fa2db7`  
**Turn 7 correction code head:** `f2ed2d2e3a54c5266ef9d668651714a402089e9c`  
**Status:** CODE COMPLETE / CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Completed:** 2026-09-07

## Goal

Make the Rules page and current lesson article visibly belong to the same Goblin Investing product without flattening the article into the dashboard aesthetic.

The v6 Turn 7 requirements were:
- shared masthead;
- shared typography;
- financial/ledger language on Rules;
- removal of card-heavy Rules layout;
- high Rules readability;
- article keeps editorial freedom while inheriting the brand shell;
- do not over-goblin the article.

Turn 8 goblin-seasoning work was not started.

## Environment / scope

- working frontend: `goblin-brokerage-redesign`;
- live frontend: `main`;
- Turn 7 start head: `27cb351f4277cd9b155c7c601605822d77fa2db7`;
- shared production Supabase backend: unchanged;
- no auth, RLS, RPC, Edge Function, market, Called It controller, dashboard, or Receipts contract changed.

Runtime files changed:
- `rules/index.html`;
- `js/rules.js`;
- `css/site.css`;
- `learn/invest-or-die/index.html`.

Documentation changed/added:
- `docs/goblin-brokerage/turn-7-completion.md`;
- `docs/goblin-brokerage/turn-7-correction-review.md`;
- `docs/goblin-brokerage/implementation-control.md`.

## Rules page

The Rules page now reads as a single rulebook/ledger document rather than a generic guide made from visually independent blocks.

Implemented:
- retained the shared Goblin Investing wordmark masthead and active Rules navigation;
- retained IBM Plex Sans / Condensed / Mono product typography;
- placed the full Rules content on one off-white paper record surface;
- replaced decorative section kickers with structural `01–04` document indices;
- used hard ledger rules, double dividers, and a narrow document-number column rather than rounded cards;
- converted setup steps into square numbered rule rows;
- converted homepage explanations and Called It rules into separator-based records;
- removed background-card treatment from the due-diligence definition and Cancel note;
- preserved one-column mobile reading order and two-column desktop groupings only where they improve scanning;
- retained semantic h1/h2/h3 structure and explicit section `aria-labelledby` relationships.

The page intentionally does not add decorative stamps. The paper/ledger grammar is enough for Turn 7; additional personality belongs to Turn 8.

## Rules truth / dynamic settings

Turn 7 preserved the existing public `game_settings` read for configurable Called It rules but hardened its display boundary.

Configurable values:
- Goes Up percent;
- Goes Down percent;
- About the Same percent;
- challenge duration;
- review cooldown;
- flat claim window;
- Approved payout.

They now:
- render as `—` until a current finite value is actually read;
- reject `null`, `undefined`, blank/whitespace, and `NaN` as missing;
- preserve legitimate numeric zero;
- format percentages and currency only after a valid value exists.

This prevents fallback/default numbers from masquerading as the currently configured rules if the public settings request fails.

The stale fixed example “Week 6 means $30” was removed. The Rules page now tells players to use the homepage for the current weekly buy-in requirement rather than duplicating mutable tracker state.

The Receipts explanation also now says “Called It wins leaderboard,” matching the actual Turn 6 label instead of the older “Most Called Its” wording.

## Lesson article integration

The article remains deliberately more expressive than the dashboard and Rules page.

Preserved:
- existing article copy and profanity;
- large `PAY / YOUR / FUCKING / SELF / FIRST` editorial sequence;
- existing calculation examples and Model notes;
- charts, comparison layouts, cards, and article-specific color treatment;
- scroll-reveal/counter behavior.

Integrated into Goblin Investing:
- page title now identifies Goblin Investing;
- shared IBM Plex font delivery replaces Inter;
- shared `site.css` is loaded so the product masthead uses the canonical shell;
- shared Goblin Investing wordmark header links home;
- Rules navigation is available from the article;
- `HOUSEHOLD SECURITIES DESK` remains the same static masthead artifact language used elsewhere;
- one cobalt `TRAINING BULLETIN / 001` register ties the article to the homepage lesson panel;
- a semantic page `h1` was added without forcing an additional visible title into the existing editorial opening.

No approval stamp, fake status, goblin illustration, fantasy motif, or extra bureaucratic micro-labeling was added to the article.

## Existing article sheet controls hardened during Turn 7

Because Turn 7 touched the article shell, its existing information sheets were included in the mandatory modal/accessibility review.

Source-level corrections now provide:
- 44px info triggers and close controls;
- dialog role and labeled modal semantics;
- `aria-hidden` state;
- background inertness while open;
- focus entry and Tab/Shift+Tab containment;
- Escape close;
- intentional backdrop close that requires pointer-down/up on the backdrop;
- trigger-focus restoration;
- body-scroll recovery;
- viewport-bounded, intentional sheet scrolling;
- no fixed backdrop blur.

The first shell integration also received a source correction so the scoped article section rule does not override the original warpath padding/geometry.

## Shared CSS scope

Turn 7 changed the Rules-specific CSS from the previous dark guide treatment to the paper ledger system.

The only deliberate shared masthead change outside secondary-page selectors is:
- `.nav-link` minimum height increased from 38px to 44px.

This improves the same navigation target on the dashboard, Rules page, and article without changing its state, routing, or visual vocabulary.

No Turn 6 history/receipt selectors or Called It form/slip selectors were changed as part of Turn 7.

## State provenance summary

- configurable Rules values: authoritative stored `game_settings` values, displayed only after successful finite read;
- Called It lifecycle words in Rules: static explanatory rule language matching existing application states, not live record claims;
- Called It wins leaderboard rule: static behavior description matching approved-only counting;
- Win the Week `$1` and Buy/Hold/Sell `$5` minimum: existing static business rules retained unchanged;
- Rules `01–04`: static document structure;
- `TRAINING BULLETIN / 001` and desk label: static artifact/brand language;
- lesson monetary examples: static editorial model content, not live user/account/application state.

No new mutable value was placed on an action control.

## Responsive / breakpoint review

### 320–360px

Rules:
- one-column document sections;
- wrapping text columns use shrinkable width;
- no fixed-width rule card or horizontal scroll surface;
- setup-step number column remains narrow while copy wraps;
- back link and Rules navigation meet the 44px source-level target.

Article:
- keeps its narrow editorial max width;
- large warpath typography retains its original responsive clamps;
- existing 380px comparison override remains;
- info controls are 44px;
- modal sheets remain within `100dvh` and use intentional internal scrolling when needed.

### 699 / 700px

Rules changes layout at the existing shared 700px breakpoint:
- minimum desktop shell still has room for wordmark, desk label, and Rules navigation;
- Rules document changes to number-column + content geometry;
- explanation and rule groups can become two columns without fixed card widths;
- long copy remains wrappable.

No new article desktop breakpoint was introduced.

## Accessibility / semantics

Rules:
- one page h1;
- each major Rules section has an h2 and `aria-labelledby`;
- subsection titles remain h3;
- numerical document indices are decorative and aria-hidden;
- back/navigation links have usable source-level hit heights.

Article:
- now has a semantic page h1;
- shared navigation has a labeled nav region;
- info controls retain specific accessible names;
- close buttons have modal-specific accessible names;
- dialog headings label each modal;
- modal keyboard/background/focus lifecycle is explicit at source level.

Runtime screen-reader and browser verification remains deferred.

## Adversarial correction review

The mandatory v6 second pass found and corrected three source-level issues rather than deferring them:

1. visible configurable Rules defaults could look current when settings failed;
2. the article's existing information sheets did not satisfy the full modal/focus/scroll contract;
3. the first article shell pass had a CSS specificity conflict that could alter the original warpath padding.

Details are recorded in `turn-7-correction-review.md`.

## Validation completed

- read v6 Turn 7 and page-specific requirements before changes;
- read `implementation-control.md`, `turn-6-completion.md`, and `turn-6-correction-review.md`;
- recorded Turn 7 start head and compared redesign with `main`;
- re-fetched current Rules markup, Rules loader, shared CSS, and article after changes;
- inspected the Turn 7-only diff;
- current `js/rules.js` syntax check passed;
- current article inline JavaScript syntax check passed;
- setting sentinel test passed for null/undefined/blank/zero/negative/NaN/positive/string-number inputs;
- source-level 320–360px and 699/700px geometry review completed;
- source-level article modal contract review completed;
- no backend/controller files were changed.

## Turn 7 code commits

- `c61ff172782afba41193d005cab4050979db8a3e` — initial dynamic Rules display hardening pass;
- `38dbb001eed37ced837f5cfb6f907420dc143c32` — rebuild Rules markup as ledger document;
- `cf5333c6acf105653644e3fb9068cabe67115aa6` — remove unused Rules setting expansion and retain finite-value guard;
- `1a5301c4e611f5df55df79ba6c5a116c4d16e569` — integrate Rules paper/ledger styling and masthead target sizing;
- `36b53d948bfe0bd050e5996e1b3d25821020c6f7` — initial article product-shell integration;
- `46026a096615bb37942f953cc86bfacf68525288` — make configurable Rules values fail closed visually;
- `306e3dc2b470e60091ef9dfaa9f2b8a7908b5a87` — render live rule percentages as complete semantic values;
- `f2ed2d2e3a54c5266ef9d668651714a402089e9c` — complete article sheet accessibility, scrolling, and warpath correction.

## Runtime QA status

**CODE COMPLETE:** yes.  
**CORRECTION REVIEW COMPLETE:** yes.  
**QA COMPLETE:** no.

Still deferred to the integrated runtime QA turn:
- 320–360px Android Chrome rendering of both secondary pages;
- 699/700px Rules transition with real IBM Plex metrics;
- actual article warpath line/word fit on Android Chrome;
- remote wordmark/font loading;
- all article sheet open/close paths on touch;
- Tab/Shift+Tab, Escape, inertness, scroll recovery, and focus restoration in a real browser;
- screen-reader interpretation of Rules hierarchy and article dialogs.

## Next canonical step

Turn 8 — Goblin seasoning and asset integration.

Turn 8 was not started during Turn 7.
