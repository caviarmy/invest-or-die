# Goblin Investing Visual Re-Redesign — R3 Secondary Surfaces / Integration Pass

**Branch:** `goblin-visual-reredesign`  
**R3 base:** `29b3f3c8ecc413fa1285b84fe5d92cdb5afead03`  
**Status:** SOURCE COMPLETE / VISUAL INTEGRATION REVIEW COMPLETE / RELEASE-CANDIDATE VISUAL BRANCH READY FOR R4 RUNTIME QA  
**Production `main`:** unchanged  
**R4:** not started

## Objective

R3 completes the approved visual system across Rules, operator/admin/edit/help surfaces, the lesson article, and shared secondary-page identity without changing application authority or business behavior.

## Runtime files changed

- `rules/index.html`
- `learn/invest-or-die/index.html`
- `assets/goblin-investing-wordmark.svg`
- `css/visual-reredesign.css`
- `css/visual-r3-rules.css`
- `css/visual-r3-operator.css`
- `css/visual-r3-lesson.css`

No R3 change was made to:

- `js/app.js`
- `js/called-it-ui.js`
- `js/rules.js`
- `js/auth.js`
- `js/market.js`
- `js/backend.js`
- `js/plays.js`
- Supabase schema, RLS, grants, migrations, RPCs, Edge Functions, or configuration
- Called It lifecycle / review / payout / cooldown authority
- Win the Week persistence or rules
- production `main`

## Rules — operations manual

Rules is rebuilt from the former ledger-like web document into the R1-approved late-20th-century operations-manual artifact.

The page now has:

- a restrained institutional manual cover;
- physical spine and binder/page relationship;
- three-hole paper margin;
- typed section/revision header and footer;
- office-directory structure instead of a grid of explanation cards;
- ruled procedural sections;
- restrained highlight/handwritten correction treatment;
- responsive mobile form that remains a binder/manual rather than degrading into generic cards.

The existing public-settings runtime contract remains untouched. The rebuilt page preserves the IDs and data attributes consumed by `js/rules.js`:

- `rulesSettingsStatus`
- `ruleUpGoal`
- `ruleDownGoal`
- `ruleFlatGoal`
- `data-rule-duration-adjective`
- `data-rule-claim-phrase`
- `data-rule-cooldown-phrase`
- `data-rule-payout`

Unavailable configurable values therefore continue to fail closed under the existing Rules implementation.

## Finalized identity

The old generic wordmark asset is replaced by the approved altered institutional nameplate:

- the original `HOUSEHOLD` designation remains visible and struck through;
- a physical-looking `GOBLIN` patch is applied over it;
- `INVESTING` remains the stable institutional name.

This finalized asset is used by Rules and the lesson article. The R2 homepage already uses the same identity construction directly in markup/CSS, so R3 does not disturb the approved homepage composition.

## Operator surfaces

R3 adds a visual-only operator layer imported by the existing homepage visual entrypoint.

### Authentication

The sign-in dialog now reads as an office credential form rather than a generic dark modal:

- off-white office stock;
- double-rule header;
- underlined fields;
- square controls;
- restrained `DESK 03` notation.

No auth logic or session handling changed.

### Admin game update

The admin sheet now reads as a working operations form. Win the Week and Called It settings remain plainly separated using document hierarchy instead of rounded cards or status decoration.

No persistence or validation logic changed.

### Called It edit

The existing paper-slip editing model is retained and visually tightened. The current `single-play-mode` controller, ticker preview behavior, focus ownership, and save/cancel flow remain unchanged.

### Help disclosure

Called It help now opens as a light paper instruction sheet. Mobile uses the existing contained sheet behavior with an explicit `CLOSE` control. The existing disclosure mechanism remains a native `details` element.

## Lesson article

The lesson remains intentionally independent from the brokerage dashboard/manual surfaces. R3 does not turn the article into a binder or terminal.

The de-AI pass removes the article's strongest repeated component pattern:

- large rounded hero card becomes an editorial ruled callout;
- chart cards become ruled data blocks;
- repeated future/add-on cards become editorial sections;
- repeated rounded statistic boxes become divided data rows;
- safety/comparison surfaces use editorial rules and sidebars instead of soft rounded containers;
- circular info controls become square editorial controls;
- lesson modal sheets become restrained document sheets rather than rounded app dialogs.

The article's pacing, profanity, calculations, model notes, modal subjects, and separate dark editorial language are preserved. Its existing focus-return, inert-background, backdrop guard, Escape handling, Tab containment, and reduced-motion logic remain present.

## Site-wide de-AI audit

R3 explicitly challenged the steering-document failure patterns.

### Repeated uppercase micro-labels

Retained only where they function as document metadata, filing metadata, or article sequencing. They are not used as a universal heading recipe.

### Repeated bordered rectangles / card soup

Rules no longer uses a collection of explanation cards. The lesson's repeated rounded-card system was flattened into editorial sections. Homepage R2 artifacts remain intentionally heterogeneous: terminal, training folder, posted result sheet, filed tickets, and continuous-feed ledger.

### Generic status pills

No new status-pill system was introduced. Existing states continue to use ticket/document semantics and existing authoritative wording.

### Redundant descriptions

Rules copy was compressed into manual procedures and directory entries. No new explanatory paragraphs were added to the homepage, Called It, or Receipts.

### Generic icons

No new icon family was introduced. The finalized identity is typographic/nameplate based rather than an arbitrary symbol.

### Motif repetition

Binder holes remain on Rules; tractor holes remain on Receipts; sticky paper remains on the terminal; stamps remain where the artifact supports them. These motifs are not mechanically copied across surfaces.

## Responsive review

Chromium composition review covered:

- Rules: 320, 390, 700, 900, 1440 px;
- lesson: 320, 390, 700 px;
- homepage regression: 390 and 1440 px;
- operator sheets: 390 px auth/edit/help and 1100 px admin;
- Called It multi-call and empty states at 390 px;
- Receipts at 390 and 1440 px.

Measured document width matched viewport width in the tested responsive passes. No horizontal overflow remains in the reviewed states.

## Accessibility / interaction safeguards

Source and proof review confirmed:

- existing homepage modal controller was not changed;
- existing Called It edit focus/inert/Escape behavior was not changed;
- lesson modal focus return, inert background, backdrop ordering, Escape, and Tab containment remain present;
- 44px close/action controls remain available;
- native help disclosure semantics remain intact;
- reduced-motion rules remain in the shared application and lesson surface;
- Rules setting status remains a live region;
- dynamic Rules values retain their existing runtime hooks;
- R2 hidden-state safeguard remains intact.

## Validation

- extracted lesson inline JavaScript passes `node --check`;
- Rules dynamic IDs/data attributes were checked for presence and uniqueness;
- lesson modal IDs and `aria-labelledby` references were checked for uniqueness and valid targets;
- turn-specific GitHub diff before documentation contained exactly seven visual/runtime files and no JavaScript/backend/auth/Supabase file.

## R3 conclusion

R3 is complete as a visual release-candidate pass. The branch is ready to enter **R4 — Real Runtime QA and Cutover Gate**.

R3 does **not** authorize a production merge or cutover. `main` remains unchanged and R4 has not started.
