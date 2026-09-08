# Goblin Brokerage Redesign — Turn 7 Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Turn-start head:** `27cb351f4277cd9b155c7c601605822d77fa2db7`  
**Correction code head:** `f2ed2d2e3a54c5266ef9d668651714a402089e9c`  
**Status:** CORRECTION REVIEW COMPLETE / ANDROID AND BROWSER RUNTIME QA DEFERRED  
**Reviewed:** 2026-09-07

## Review posture

This pass used the v6 adversarial-review rule: assume the Turn 7 implementation may be subtly wrong and try to falsify the completion claims rather than restating what was built.

Reviewed against:
- `goblin_investing_redesign_master_v6.md`;
- `implementation-control.md`;
- `turn-6-completion.md`;
- `turn-6-correction-review.md`;
- the Turn 7-only diff from `27cb351...`;
- current `rules/index.html`, `js/rules.js`, `css/site.css`, and `learn/invest-or-die/index.html`;
- the existing `game_settings` / Called It authority model where Rules text represents configurable application behavior.

## Findings corrected during the pass

### 1. Configurable Rules defaults could masquerade as current values

The first Turn 7 pass retained visible fallback values such as `15%`, `28 days`, `7 days`, and `$5` in the Rules markup while also loading current values from `game_settings`.

That meant a failed/missing settings request could leave defaults visible as if they were current application rules.

Correction:
- configurable values now start as `—`;
- `js/rules.js` fills them only after a finite value is returned from `game_settings`;
- percentage formatting now owns the `%` sign so a missing value does not render as a misleading `—%`;
- payout formatting remains currency only after a valid value is received;
- `null`, `undefined`, blank/whitespace, and `NaN` stay missing;
- legitimate numeric zero remains valid for settings that permit zero, such as review cooldown or payout.

This preserves the v6 distinction between a valid default in code/database design and a currently verified user-facing rule.

### 2. The lesson article's existing info sheets did not meet the modal contract

Turn 7 brought the article under the shared product shell, which also made its existing info-sheet behavior part of the structural/accessibility review.

The original sheets:
- had no dialog semantics;
- did not make background content inert;
- did not contain Tab/Shift+Tab focus;
- did not restore trigger focus;
- had no Escape close path;
- used 30px info targets and 32px close targets;
- had no explicit viewport-bounded sheet scrolling;
- used a fixed backdrop blur.

Correction:
- sheets now use `role="dialog"`, `aria-modal="true"`, labeled headings, and `aria-hidden` state;
- opening a sheet makes background body children inert;
- focus enters the close control and is contained while open;
- Escape, close button, and intentional backdrop click close the sheet;
- focus returns to the invoking info control;
- body scroll is restored on every close path;
- info and close controls are 44px;
- sheet height is bounded by `100dvh` and may scroll internally as an intentional viewport-containment surface;
- fixed backdrop blur was removed.

### 3. Article shell integration initially weakened the original warpath geometry

The first article integration introduced `.lesson-article section { padding: 42px 0; }` while the original `warpath` rule had only class-level specificity. Since the warpath itself is a section, the broader scoped section rule could win the padding declaration and change the intended editorial layout.

Correction:
- the original warpath geometry is explicitly preserved with `.lesson-article .warpath`;
- the article keeps its editorial content width and large typographic sequence while still inheriting shared product typography/header navigation.

## State provenance matrix

### Rules page

- Called It percentages, challenge duration, review cooldown, flat claim window, and Approved payout: **authoritative stored state** from `game_settings`, displayed only after a successful finite read.
- `Under Review`, `Approved`, `Rejected`, `Cancelled`, and `Expired` in explanatory copy: **static rule/lifecycle language**, not a claim about a current record.
- “Only Approved challenges count toward the Called It wins leaderboard”: **static behavior description** matching the existing approved-only leaderboard logic.
- `$1` Win the Week prize and the `$5` minimum for Buy/Hold/Sell: **static competition/business rules** retained from the pre-Turn-7 rules page; Turn 7 did not change their authority or behavior.
- section numbers `01–04`: **static document structure**, not state.

### Lesson article

- `TRAINING BULLETIN / 001` and `HOUSEHOLD SECURITIES DESK`: **static artifact/brand language**.
- retirement amounts, percentages, and examples: **static editorial model content**, not live account/application state. Turn 7 preserved the article's existing content and its Model notes rather than converting those values into product status.
- no new live financial status, market status, account state, or server action promise was introduced.

## Responsive / bounds review

### Shared masthead

At 320–360px:
- the 154px wordmark plus Rules navigation fits the shared shell without introducing a new horizontal layout mode;
- the desk label remains hidden as before;
- navigation target height is now 44px.

At the 700px shared breakpoint:
- the wider shell, 174px wordmark, desk label, and Rules link fit the minimum desktop width;
- Turn 7 does not add another header breakpoint.

### Rules ledger

At 320–360px:
- sections remain one-column;
- paper horizontal padding leaves wrapping room for long rule text;
- setup-step numbering is a fixed narrow column with a shrinkable text column;
- Called It rules are one-column and contain no forced wide table or nested scroll region.

At 699/700px:
- the 700px layout changes to a 52px document index column plus flexible body;
- two-column explanation/rule groups use `minmax(0,1fr)`-compatible flexible content and hard separators rather than fixed card widths;
- long explanatory copy can wrap in either column.

### Lesson article

The article remains a narrow editorial document rather than adopting a new desktop grid. Its existing 380px narrow override remains in place.

Source-level narrow review covered:
- large warpath words at 320–360px;
- comparison rows with `$13.4k`-class values;
- 44px info controls inside cards;
- modal sheets constrained to the viewport;
- no fixed wide component was introduced by the shared masthead or training register.

Actual font metrics, Android Chrome rendering, and modal touch/keyboard behavior remain runtime QA items.

## Regression / scope review

Turn 7 changed only:
- `rules/index.html`;
- `js/rules.js`;
- `css/site.css`;
- `learn/invest-or-die/index.html`;
- Turn 7 documentation/control records.

No changes were made to:
- `index.html` dashboard markup;
- `js/app.js`;
- `js/plays.js`;
- `js/market.js`;
- `js/auth.js`;
- `js/called-it-ui.js`;
- Supabase schema, grants, RLS, RPCs, or Edge Functions;
- Turn 6 Receipts state/payout semantics.

The only shared CSS behavior change outside secondary-page selectors is `.nav-link` minimum height increasing from 38px to 44px, which affects the same shared masthead control on the dashboard and secondary pages without changing navigation behavior.

## Philosophy review

Turn 7 remains aligned with **human system, goblin damage**:
- Rules now reads as one credible paper/ledger rule document rather than card soup;
- numbered document structure and hard separators provide the financial/administrative identity;
- no fake approval/status stamps or invented lifecycle states were added;
- the article received only the product shell, typography family, and one cobalt training-file register;
- the article's editorial/profane identity and existing visual freedom remain intact;
- no additional goblin ornament was added. Turn 8 remains the designated seasoning pass.

## Validation completed

- re-fetched all modified runtime files from `goblin-brokerage-redesign`;
- inspected the Turn 7-only diff for accidental files;
- JavaScript syntax check passed for current `js/rules.js`;
- JavaScript syntax check passed for the article inline script;
- numeric-setting sentinel check confirmed missing/blank/NaN remain missing and zero remains zero;
- reviewed 320–360px and 699/700px source geometry;
- reviewed article modal focus/scroll contract at source level;
- confirmed no backend/controller changes were introduced.

## Deferred runtime QA

Still required later:
- Android Chrome secondary-page rendering at 320–360px;
- actual IBM Plex metrics and wrapping on Rules at 699/700px;
- article warpath typography on real mobile Chrome;
- opening/closing each article info sheet repeatedly;
- Tab/Shift+Tab, Escape, background inertness, scroll recovery, and trigger-focus restoration in a browser;
- screen-reader behavior for the article dialogs and Rules heading structure;
- remote font and wordmark loading in the deployed environment.
