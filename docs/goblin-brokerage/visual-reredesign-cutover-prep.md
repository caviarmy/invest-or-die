# Goblin Investing Visual Re-Redesign — Cutover Preparation

**Working branch:** `goblin-visual-reredesign`  
**Live frontend:** `main`  
**Shared backend:** Supabase project `zdxuaphrtedzzsiheslg`  
**Status:** CUTOVER PREPARATION COMPLETE / PRODUCTION MERGE NOT PERFORMED

## Purpose

This pass completes the deferred owner-edit authority migration required before the visual redesign can be merged to production, while preserving compatibility with the current live `main` frontend.

## Shared-backend preflight

Before changing Supabase, the release matrix was explicitly confirmed:

- working frontend: `goblin-visual-reredesign`;
- live frontend: `main`;
- backend: shared production Supabase project;
- previous owner-edit path: `edit_own_called_it_metadata` RPC plus narrow owner UPDATE grants;
- all other Called It mutations: `called-it` Edge Function;
- compatibility requirement: do not revoke the RPC/grants while live `main` still depends on them.

## Completed cutover steps

### 1. Added `owner_edit` to the `called-it` Edge Function

Production `called-it` was deployed as version 3 with a new authenticated `owner_edit` action.

The action:

- requires the existing `getActor()` bearer-token authentication;
- rejects inactive non-admin participants through the existing actor gate;
- allows the challenge owner;
- rejects a different non-admin participant;
- preserves admin authority;
- permits edits only while the challenge is `active`;
- validates the explanation;
- validates action amount bounds;
- validates that the selected action is compatible with the stored prediction direction;
- updates only `reason`, `portfolio_action`, `action_amount`, and `amount_committed`;
- does not recalculate or alter ticker, direction, starting price, targets, qualification fields, submission/review fields, status, or cooldown.

The platform `verify_jwt` switch remains unchanged from the previous function version because this function already performs mandatory bearer-token validation itself in `getActor()`.

### 2. Switched the redesign candidate to the Edge Function authority path

`js/backend.js` now contains a narrow cutover bridge for the one legacy RPC-shaped frontend call.

When the redesign frontend calls:

`edit_own_called_it_metadata`

on its Supabase client, only that function name is intercepted and translated into an authenticated POST to:

`called-it` → `owner_edit`

with the current challenge id, reason, portfolio action, and action amount.

All other Supabase `rpc()` calls continue to use the original Supabase client method unchanged.

This bridge preserves the existing `{ data, error }` frontend contract, so the established owner edit modal/controller does not need a risky late-stage rewrite.

A local functional harness confirmed:

- the action is `owner_edit`;
- the challenge id maps correctly;
- `new_reason` maps to `reason`;
- `new_portfolio_action` maps to `portfolio_action`;
- `new_action_amount` maps to `action_amount`;
- the bearer token and publishable-key headers are sent;
- successful Edge responses return the expected `{ data, error: null }` shape.

The updated `backend.js` also passes `node --check`.

### 3. Compatibility path deliberately retained for production `main`

Post-deployment database inspection confirmed:

- `edit_own_called_it_metadata` still exists;
- authenticated UPDATE remains limited to exactly:
  - `action_amount`
  - `amount_committed`
  - `portfolio_action`
  - `reason`
  - `updated_at`

No authoritative challenge term/lifecycle column has been added to the browser UPDATE grant.

This is intentional. Revoking these permissions now would break the current production frontend before the visual redesign is deployed.

## Authorization verification status

The deployed version-3 source explicitly implements the required owner/non-owner/inactive/admin branches.

Existing connected-backend R4 checks already verified the underlying production role data and previous owner-edit semantics through transaction-safe database tests. The current environment still cannot obtain real participant/admin browser tokens for an end-to-end POST against the new Edge action, so that one live authenticated-browser confirmation remains part of production smoke testing immediately after frontend cutover.

There are currently no inactive non-admin participant rows in the production roster to exercise as a live database fixture. The Edge actor gate nevertheless explicitly rejects `!active && !is_admin`; the inactive Admin profile remains intentionally permitted as admin.

## Backend documentation

`BACKEND_SETUP.md` now reflects the actual cutover state:

- `owner_edit` is an existing Edge Function action, not future work;
- the redesign candidate routes owner metadata edits through it;
- the legacy RPC/grants remain only for current live-main compatibility;
- they are scheduled for removal immediately after frontend cutover validation.

## Remaining production sequence

The remaining steps are intentionally coupled to the production frontend release:

1. merge/deploy the approved redesign frontend to `main`;
2. smoke-test signed-out public reads;
3. smoke-test participant owner edit through the production frontend;
4. smoke-test admin access/edit behavior;
5. revoke authenticated direct UPDATE grants on `called_it_plays`;
6. retire or restrict `edit_own_called_it_metadata`;
7. re-run Supabase security advisors;
8. perform final production smoke check.

Steps 5–6 must not occur before step 1 because the current production `main` frontend still uses the compatibility path.

## Merge authority

This preparation does not itself move `main` or authorize a production cutover. The visual steering document requires explicit owner authorization for the merge/cutover action.
