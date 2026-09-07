# Goblin Brokerage Redesign — Implementation Control

**Authoritative design brief:** `goblin_investing_redesign_master_v3.md`  
**Working branch:** `goblin-brokerage-redesign`  
**Production frontend:** `main` / GitHub Pages  
**Shared backend:** production Supabase project is shared by `main` and the redesign branch.

This repository record exists so a fresh implementation turn can recover the critical execution rules even when the full master brief is supplied separately.

## Current status

- Turn 0: COMPLETE
- Turn 1: CODE COMPLETE
- Turn 1 correction review: COMPLETE except deferred owner-edit authority cutover
- Turn 2 visual foundation: CODE COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turn 3 Tracker + Current Lesson + Win the Week: CODE COMPLETE / VISUAL RUNTIME QA DEFERRED
- Turns 2–3 source-level correction review: COMPLETE
- Manual Android/browser QA: DEFERRED UNTIL LATER INTEGRATED QA
- Next canonical turn: Turn 4 — Called It participant sections and challenge slips

Read `turn-0-baseline.md` for the original architecture map, `turn-1-completion.md` for the consolidation/correction record, `turn-2-completion.md` for the visual-foundation record, `turn-3-completion.md` for the top-page composition record, and `turn-2-3-correction-review.md` for the latest review findings and prevention rules.

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
- identify whether any form preview can differ from server-authoritative save semantics;
- when markup structure will be replaced, list the classes/containers expected to disappear;
- identify any new copy/icon that could be mistaken for live runtime status and name the authoritative state source;
- identify realistic worst-case legal values/strings that could affect layout;
- if creating external branded SVGs, require outlined text/path geometry rather than live device-font text.

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
- reconcile removed markup classes against CSS and remove confirmed-dead selectors;
- verify status-sounding copy/icons are backed by real application state or reworded as static labels;
- verify labels match the actual data geometry they describe;
- perform a source-level worst-case content check using actual field/numeric bounds and 320–360px assumptions even when runtime QA is deferred;
- verify external branded SVGs contain no live `<text>` unless explicitly documented;
- load primary remote web fonts from the document head rather than CSS `@import`;
- mark CODE COMPLETE separately from QA COMPLETE;
- update the relevant turn record before moving on.

## Visual-review truth test

Every later visual turn must explicitly answer five questions before it is called code-complete:

1. **Truth:** Does any visual element claim a live state the application does not actually know?
2. **Geometry:** Do labels/headings correspond to the actual values/layout beneath them?
3. **Bounds:** Do legal worst-case strings and numeric values fit narrow mobile assumptions?
4. **Independence:** Will external assets render consistently without device-specific fonts or hidden dependencies?
5. **Cleanup:** Did replacing markup also remove the obsolete implementation residue it replaced?

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
