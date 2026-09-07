# Goblin Brokerage Redesign — Turn 0 Baseline

Branch: `goblin-brokerage-redesign`
Baseline from `main`: `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`

This document records the frontend state before redesign work begins. Turn 0 intentionally makes no production or visual changes.

## Current render ownership

### `index.html`
Owns the static page shell and placeholders for:
- header/navigation
- current week / buy-in tracker
- current lesson
- Win the Week
- Called It heading/help/add button
- participant grid
- Receipts / leader summary
- auth, Called It, and admin week modals

It currently loads both canonical and patch layers:
- `css/site.css`
- `css/dashboard-polish.css`
- `js/mutation-guard.js`
- `js/app.js`
- `js/dashboard-polish.js`
- an inline module that separately manages Add Challenge auth visibility and stale Called It modal cleanup

### `js/app.js`
Canonical dashboard controller. It currently owns:
- session/data state
- tracker rendering
- weekly winner rendering
- participant rendering
- challenge Check Price / Submit for Review bindings
- history rendering
- review and cooldown-reset admin actions
- auth modal/sign-in/sign-out
- generic modal open/close/body-scroll handling
- admin weekly winner/settings modal

Important mismatch: its `openEditModal()` still implements the older two-slot manager. It also renders the admin participant button as `Edit` and does not implement the newer per-play pencil workflow directly.

Important auth mismatch: `renderAccount()` does not itself make signed-out Add Challenge visibility authoritative. The inline module in `index.html` currently corrects that behavior after render.

### `js/called-it-ui.js`
Canonical Called It presentation helpers. It owns:
- formatting and HTML escaping
- direction / action / goal labels
- null-safe target qualification display logic
- challenge card markup
- the legacy challenge form markup
- ticker autocomplete result markup

It also contains a temporary save-close `MutationObserver` that watches `participantsGrid` to close the Called It modal after a successful save. That behavior should become an explicit success path in `app.js` rather than observer-driven DOM inference.

### `js/dashboard-polish.js`
Temporary behavior patch added after the original Called It implementation. It currently owns behavior that must be migrated before this file can be deleted:
- direction-to-action option mapping:
  - Up → Buy / Hold
  - Down → Sell / Not Buying
  - Flat → Hold / Not Buying
- one-play-at-a-time add/edit modal
- owner metadata edit via `edit_own_called_it_metadata`
- admin full challenge edit
- next-available-slot lookup for Add Challenge
- per-play pencil button injection
- conversion of admin participant `Edit` button to `+ Add`
- admin Receipts `Delete row` injection and delete binding
- signed-in Add Challenge slot-full state
- legacy form option narrowing

It currently uses MutationObservers on the participant grid, edit modal contents, and history table. Some callbacks mutate the subtree being watched.

### `js/mutation-guard.js`
A global wrapper around `window.MutationObserver` added after an Android Chrome freeze caused by self-triggering observer loops. It disconnects observers while callbacks run and reconnects afterward.

This is a safety shim, not desired architecture. The redesign must eliminate the observer-driven decoration that made this necessary before removing it.

### `css/site.css`
Canonical shared styling for dashboard, forms, modals, rules page, and responsive layout. It still represents the existing rounded dark-SaaS visual system.

### `css/dashboard-polish.css`
Temporary styling patch. It currently contains:
- blue lesson treatment
- Up/Down/Flat prediction colors and market emoji decoration
- per-play pencil positioning
- single-play modal styles
- admin history-delete styling
- mobile Called It help viewport fix/backdrop

These rules should move into the redesigned canonical `site.css` only where the underlying behavior/style still exists.

### `js/auth.js`
Canonical session/auth helper. Returns Supabase client, user, and participant profile. No redesign reason to change its backend contract.

### `js/market.js`
Canonical browser interface to securities search and the server-authoritative `called-it` Edge Function. No visual redesign reason to change this module.

### `js/plays.js`
Canonical dashboard data loader and weekly/settings persistence. `getOwnerSlots()` is the authoritative frontend helper for choosing each participant's current slot state.

### `rules/index.html`
Standalone rules page using `site.css` and dynamic values from `js/rules.js`. It currently shares the generic header/card vocabulary and will be visually redesigned later, not during architecture cleanup.

### `BACKEND_SETUP.md`
Confirms that Called It challenge mutation remains server-authoritative and that the frontend redesign must not move price/state authority into browser code.

## Recent changes that must be preserved

- `3c268b595b3bc40bae752326cfff9cedf83510c3` — backend direction/action constraint and admin history-delete authorization.
- `02c392c08f1f1c51867ce464e2dd2d81615be682` — introduced single-play editing/admin history tooling in the temporary dashboard polish layer.
- `cac1892a761c0004e34afdbd70e4b15b54166cea` — hardened the signed-out Add Challenge state with an inline auth patch.
- `860a1e770cacbf4a174851e10d216fc15ab8188b` / `9816eaf306aa2ed8447056135517f0d81d1fa4ed` — added and loaded the MutationObserver guard after the mobile Chrome freeze.
- `bd004376aea46117138d223f55acb608c4ad11be` / `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9` — added market emoji and red/green direction styling.

## Turn 1 migration checklist

Do not delete patch files until every item below has a canonical replacement and has been verified.

### Auth / Add Challenge
- [ ] Make `app.js` the only authority for Add Challenge visibility and disabled state.
- [ ] Hidden + disabled when signed out.
- [ ] Hidden + disabled for accounts without an active participant profile.
- [ ] Visible only when the signed-in participant is allowed to create/manage challenges.
- [ ] Remove the inline auth module from `index.html` after this is proven.

### One-play challenge management
- [ ] Replace the old two-slot `openEditModal()` path with explicit single-play add/edit behavior.
- [ ] Render pencil edit controls directly from canonical challenge markup, not by DOM injection.
- [ ] Render admin `+ Add` controls intentionally from `renderParticipants()`, not by relabeling existing nodes.
- [ ] Determine next available slot from already-loaded dashboard state where possible; avoid an extra database query solely to decorate the UI.
- [ ] Preserve owner metadata-only editing and admin full-call editing.
- [ ] Close the modal explicitly after successful save/cancel; do not infer save completion with a MutationObserver.

### Direction/action rules
- [ ] Move the action-option mapping to `called-it-ui.js` (or another deliberate canonical helper).
- [ ] Generate only valid choices for the selected direction.
- [ ] Keep the database/server constraint as the final authority.
- [ ] Remove legacy-form post-render option rewriting.

### History admin delete
- [ ] Render the admin delete action directly from `renderHistory()` using the history row's own `id`.
- [ ] Bind delete explicitly in `app.js`.
- [ ] Do not re-query history and match DOM rows by array index.

### Help / modal safety
- [ ] Move the mobile help viewport-safe styles into canonical CSS.
- [ ] Ensure help close/open cannot leave an overlay intercepting touches.
- [ ] Keep one explicit modal body-scroll lock/unlock implementation.
- [ ] Remove unnecessary large fixed backdrop blur where possible.

### Observer removal
- [ ] Remove participant-grid decoration observer.
- [ ] Remove edit-modal option-narrowing observer.
- [ ] Remove history decoration observer.
- [ ] Remove Called It save-close observer from `called-it-ui.js`.
- [ ] After all observer-dependent behavior is gone, delete `js/mutation-guard.js`.

### Patch-file removal
- [ ] Delete `js/dashboard-polish.js` only after its behavior is canonical.
- [ ] Delete `css/dashboard-polish.css` only after needed rules are moved/replaced.
- [ ] Remove both references from `index.html`.

## Known architectural risks to address in Turn 1

1. `app.js` and `dashboard-polish.js` both bind behavior to the same Add Challenge/admin edit controls, using capture + `stopImmediatePropagation()` to override canonical behavior.
2. `dashboard-polish.js` mutates watched DOM subtrees; this is the origin class of the Android Chrome freeze.
3. `called-it-ui.js` independently watches `participantsGrid` as a save-success signal.
4. History delete currently maps DOM rows back to database rows by index after a second query, which is less reliable than rendering the row id directly.
5. `bindTickerSearch()` in `app.js` attaches a document click listener each time a form is bound; the single-play consolidation should avoid uncontrolled listener accumulation.
6. CSS behavior is split between two stylesheets with overlapping selectors such as `.lesson-panel` and prediction controls.

## Files intentionally not changed in Turn 0

All production/frontend behavior files remain byte-for-byte at the branch baseline. No Supabase migrations, Edge Functions, policies, quote logic, or production `main` files are modified in this turn.

## Turn 0 exit condition

The redesign may move to Turn 1 when:
- the redesign branch exists from the exact current `main` baseline;
- this ownership/migration map is committed on that branch;
- production behavior is unchanged;
- the next turn can remove patch architecture without having to rediscover why each patch exists.
