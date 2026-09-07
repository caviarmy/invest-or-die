# Goblin Brokerage Redesign — Turn 1 Completion and Correction Review

**Branch:** `goblin-brokerage-redesign`  
**Baseline `main`:** `1b64fd6dd646f72ac06ec2170371e733cd8f7cb9`  
**Status:** CODE COMPLETE / MANUAL MOBILE QA PENDING  
**Reviewed:** 2026-09-07

## What Turn 1 consolidated

Turn 1 removed the temporary patch architecture and moved the behavior into canonical frontend files.

Removed:
- `css/dashboard-polish.css`
- `js/dashboard-polish.js`
- `js/mutation-guard.js`
- inline Add Challenge/auth patch from `index.html`
- observer-driven post-render decoration
- old two-slot Called It manager

Canonical ownership now:
- `js/app.js`: session state, render state, Add Challenge access, single-play add/edit controller, auth/modals, history admin actions, outside-pointer handling
- `js/called-it-ui.js`: direct Called It card/form markup, direction/action mapping, formatting
- `css/site.css`: all current dashboard/form/help styling

## Corrections found in the post-Turn-1 review

### Fixed

1. **Auth state subscription restored in canonical code.**
   - `app.js` now listens to Supabase auth-state changes after initial load.
   - non-initial auth events schedule a session/data refresh.
   - if the refreshed state has no user, open modals are closed and body scroll is restored.

2. **Ticker autocomplete no longer depends on `focusout.relatedTarget`.**
   - that pattern can be unreliable on Android touch browsers.
   - ticker result lists now stay open through the selection click and are closed by one document-level outside `pointerdown` handler.

3. **Admin edit preview now matches server restart semantics.**
   - when an admin changes ticker or prediction direction, the backend restarts terms from a fresh market quote.
   - the browser now fetches a fresh preview for changed terms rather than calculating a new goal from the stale original reference price.
   - reverting to the original ticker/direction restores the original call-price preview.

4. **Mobile help click-through hardened.**
   - a cheap fixed backdrop is restored on small screens.
   - it uses no blur/filter.
   - backdrop taps are intercepted and close the help instead of activating controls underneath.

5. **Dead consolidation residue removed.**
   - removed unused `actionLabel` import from `app.js`.
   - removed obsolete `.slot-form`, `.called-it-form`, `.manage-slot`, and old two-slot grid CSS.
   - consolidated duplicate `.called-it-static` rules.

6. **Backend documentation corrected.**
   - `BACKEND_SETUP.md` no longer incorrectly claims that authenticated participants have zero direct UPDATE capability on `called_it_plays`.
   - it documents the narrow transitional owner-metadata RPC/RLS path and the required cutover plan.

## Verified backend facts

Production Supabase was inspected during review:
- owner active-play UPDATE RLS is restricted by `owner_id = auth.uid()` and `status = 'active'`.
- authenticated UPDATE grants are column-limited to owner metadata fields.
- `edit_own_called_it_metadata` is `SECURITY INVOKER`.
- admin history DELETE is protected by an admin-only RLS policy.
- the server-authoritative ticker, direction, price, target, qualification, submission, review, and cooldown fields remain outside the owner metadata UPDATE grant.

## Intentional deferred item

### Owner metadata edit Edge Function cutover

The desired final architecture is that every Called It mutation goes through the `called-it` Edge Function. Production `main`, however, still uses `edit_own_called_it_metadata`, and both `main` and the redesign branch share the same production Supabase project.

Therefore the direct owner-metadata grant cannot safely be revoked during redesign development.

Before production merge:
1. add authenticated `owner_edit` to the `called-it` Edge Function;
2. switch the redesign frontend to `owner_edit`;
3. verify owner/non-owner/admin cases;
4. deploy the frontend cutover;
5. revoke authenticated direct UPDATE on `called_it_plays`;
6. revoke/retire the owner-edit RPC;
7. re-run Supabase security advisors.

This is a cutover dependency, not forgotten work.

## Manual QA still required

The redesign branch is not the GitHub Pages production branch, so the following are not marked verified until exercised in a browser:
- Android Chrome signed-in Add Challenge flow
- Android Chrome ticker-result tap selection
- Android Chrome help backdrop close behavior
- modal open/close/body-scroll recovery
- admin add/edit flow
- owner metadata edit flow
- auth change from another tab/session while a modal is open

## Architecture lessons added to the master plan

The initial master plan was too generic in several places. It now requires:
- working-branch vs production-branch comparison every turn;
- a shared-backend/environment authority matrix when auth/backend is involved;
- inspection of actual RLS/grants/functions rather than trusting architecture docs;
- full auth lifecycle review, not just initial visibility;
- preview-vs-save semantic checks for server-recalculated values;
- explicit mobile pointer/focus/click event-order review;
- overlay pointer interception checks;
- dead-import/obsolete-selector cleanup after consolidation;
- CODE COMPLETE and QA COMPLETE to be tracked separately;
- turn-status documentation to be updated before moving on.

## Turn 1 exit state

Turn 2 may begin after the correction code is re-fetched/syntax-checked and any available mobile smoke test is performed. If a mobile smoke test cannot be performed, Turn 2 may proceed only with the manual QA items explicitly carried forward as unresolved merge gates.
