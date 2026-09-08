# Goblin Investing Visual Re-Redesign — Cutover Completion

**Source branch:** `goblin-visual-reredesign`  
**UAT / release branch:** `main`  
**Shared backend:** Supabase project `zdxuaphrtedzzsiheslg`  
**Status:** CUTOVER COMPLETE / MAIN READY FOR OWNER UAT

## Release summary

The approved visual redesign was cut to `main` through PR #2 after R4 and the final mobile Receipts correction were accepted by the owner.

The release also completed the deferred Called It owner-edit authority migration so the production/UAT frontend no longer depends on direct browser UPDATE access to `called_it_plays`.

## Frontend cutover

GitHub PR #2 merged `goblin-visual-reredesign` into `main`.

The candidate was a clean descendant of the previous `main` state before merge:

- 171 commits ahead;
- 0 commits behind;
- the previous `main` SHA was the exact merge base.

The merged release includes the completed brokerage redesign, the visual re-redesign through R4, owner-approved correction passes, mobile Receipts clipping fixes, and the server-authoritative owner-edit frontend adapter.

## Owner-edit authority migration

### Edge Function

Production `called-it` is version 3 and includes authenticated `owner_edit`.

The action:

- uses the existing bearer-token `getActor()` authentication;
- rejects inactive non-admin participants;
- permits the record owner;
- rejects a different non-admin participant;
- preserves admin authority;
- permits edits only while the challenge is `active`;
- validates explanation text;
- validates action amount bounds;
- validates action compatibility with the stored prediction direction;
- updates only `reason`, `portfolio_action`, `action_amount`, and `amount_committed`;
- cannot change ticker, direction, price, targets, qualification, submission/review state, status, or cooldown.

### Frontend

The merged frontend routes the legacy owner-edit call shape to `called-it` → `owner_edit` while preserving the established `{ data, error }` controller contract.

No other Supabase RPC call is intercepted.

## Compatibility cleanup completed

After `main` was cut over, the temporary compatibility path was removed from the production database in migration:

`retire_called_it_owner_rpc_after_main_cutover`

The migration:

1. revoked authenticated UPDATE privileges on `reason`, `portfolio_action`, `action_amount`, `amount_committed`, and `updated_at`;
2. dropped the `owners can edit active challenge metadata` UPDATE policy;
3. dropped `public.edit_own_called_it_metadata(uuid, text, text, numeric)`.

Post-migration verification returned:

- owner-edit RPC exists: **false**;
- owner direct UPDATE policy exists: **false**;
- authenticated UPDATE columns on `called_it_plays`: **none**.

Public and authenticated SELECT behavior was not changed.

## Security advisor follow-up

The Supabase security advisor was rerun after the DDL cleanup. No new Called It warning was introduced.

The remaining project advisories are unrelated to this cutover:

- `internal_settings` and `market_quote_cache` have RLS enabled with no policies; these are intentionally internal/no-browser-access tables but remain INFO findings;
- `pg_net` is installed in `public`;
- Auth leaked-password protection is disabled.

These should be handled separately from visual-redesign UAT.

## UAT state

The owner explicitly chose to use `main` as the UAT surface because the site is not yet considered live.

The automated/source-side release work is complete. Owner UAT should now exercise the actual `main` experience, especially:

- signed-out public dashboard reads;
- participant sign-in;
- owner Called It metadata edit;
- create/check/submit/cancel flows;
- admin edit/review/cooldown actions;
- weekly winner/chart administration;
- Rules and lesson navigation;
- Android/mobile keyboard and touch behavior;
- narrow-mobile Receipts presentation.

Any defect found during UAT should be fixed from the current `main` release state or on a short-lived UAT fix branch, with backend authority changes reviewed separately.
