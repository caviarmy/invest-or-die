# Goblin Brokerage Redesign — Implementation Control

**Authoritative design brief:** `goblin_investing_redesign_master_v2.md`  
**Working branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Shared backend:** production Supabase project is shared by `main` and the redesign branch.

This repository record exists so a fresh implementation turn can recover the critical execution rules even when the full master brief is supplied separately.

## Current status

- Turn 0: COMPLETE
- Turn 1: CODE COMPLETE
- Turn 1 correction review: COMPLETE except deferred owner-edit authority cutover
- Manual Android/browser QA: PENDING
- Next visual turn: Turn 2

Read `turn-0-baseline.md` for the original architecture map and `turn-1-completion.md` for the consolidation/correction record.

## Mandatory environment rule

Before changing auth, RLS, RPCs, Edge Functions, or any other shared backend behavior, write down:
1. working frontend branch;
2. live frontend branch;
3. Supabase project being changed;
4. current mutation authority path;
5. whether the backend change is backward-compatible with the live frontend.

Do not revoke or change a shared backend contract that production `main` still uses unless the production frontend is cut over in the same release.

## Mandatory review gates for every implementation turn

Before coding:
- fetch current files from the working branch, not merely the repository default branch;
- compare working branch head to `main`;
- identify preserved business invariants;
- inspect actual Supabase policies/grants/functions when auth/backend behavior is involved;
- identify whether any form preview can differ from server-authoritative save semantics.

After coding:
- re-fetch modified files from the working branch;
- compare the full branch diff to `main` for accidental files;
- syntax-check JavaScript;
- review mobile event ordering (`pointerdown`, focus/blur, `click`);
- verify overlays intercept taps and cannot click through;
- verify body-scroll lock has one explicit recovery path;
- review the full auth lifecycle, including auth events from outside the current UI action;
- check browser previews against server restart/freshness behavior;
- search for dead imports, obsolete selectors/classes, duplicate handlers, observers, timers, and stale docs;
- mark CODE COMPLETE separately from QA COMPLETE;
- update the relevant turn record before moving on.

## Deferred cutover gate

Before merging redesign to `main`:
1. add authenticated `owner_edit` to `called-it` Edge Function;
2. switch redesign frontend owner metadata editing to that action;
3. verify owner, non-owner, inactive, and admin cases;
4. deploy frontend cutover;
5. revoke authenticated direct UPDATE grants on `called_it_plays`;
6. retire/restrict `edit_own_called_it_metadata`;
7. run Supabase security advisors again.

This is intentionally deferred because production `main` still uses the RPC today.
