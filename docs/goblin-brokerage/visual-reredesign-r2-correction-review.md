# Goblin Investing Visual Re-Redesign — R2 Correction Review

**Branch:** `goblin-visual-reredesign`  
**R2 base:** `4512b5ad2245d104523ad6742656881555af2352`  
**Status:** VISUAL CORRECTION REVIEW COMPLETE / LIVE INTEGRATED RUNTIME QA DEFERRED

## Review method

R2 was not closed from source inspection alone. The homepage composition was rendered repeatedly in Chromium with representative current data, empty slots, winner evidence, and Receipts history. Separate fail-closed and signed-out presentation states were also reviewed.

The review checked the R1 acceptance language against the homepage implementation: artifact identity, label deletion, card-soup, logo-swap resistance, Called It readability, empty states, truthful unavailable states, and responsive boundaries.

## Correction 1 — narrow CRT value clipping

**Finding:** the first 390px render allowed the `$30.00` terminal value to crowd/clip inside the mobile two-column readout.

**Correction:** narrow terminal typography and grid gaps were reduced while keeping Week and Due as separate dominant readouts.

**Result:** 320, 390, and 412px renders contain both values cleanly.

## Correction 2 — 320px Called It filing-rail overflow

**Finding:** the physical ticket rail exceeded the 320px viewport by approximately 2px because the participant rail's deliberate edge treatment combined with the narrow shell.

**Correction:** the <=380px participant-rail edge offset was reduced.

**Result:** document width now equals viewport width at 320px; the ticket metaphor remains intact.

## Correction 3 — hidden-state presentation

**Finding:** existing shared styles include display rules for some controls. A styled element carrying HTML `hidden` must never become visible merely because the new visual layer gives it a display value.

**Correction:** R2 adds `.visual-r2 [hidden] { display:none !important; }`.

**Result:** signed-out/admin-disabled controls remain visually hidden according to runtime state rather than visual styling.

## Correction 4 — unavailable winner geometry

**Finding:** the fail-closed `Weekly result unavailable.` state initially retained the normal winner/evidence grid geometry and broke the message awkwardly on mobile.

**Correction:** when the chart wrapper is hidden, the posted-result sheet becomes a single full-width surface and the unavailable headline receives restrained sizing/wrapping.

**Result:** the unavailable state is clear, intentional, and does not reserve a ghost evidence column.

## State review

### Representative current data

Passed at 320, 390, 412, 700, 900, and 1440px:

- current week/buy-in terminal;
- lesson folder;
- winner + attached chart;
- populated Called It ticket;
- unused ticket;
- multiple participants;
- Receipts leaders/history.

### Unavailable data

Passed at 390px:

- terminal shows `Week —` / `—` and unavailable copy;
- winner explicitly says the weekly result is unavailable;
- Called It states that current records are unavailable rather than inventing empty challenges;
- Receipts leaders/history remain unavailable rather than becoming zero-valued results.

### Signed-out presentation

Passed at 390px:

- Sign In remains available;
- owner/admin editing controls remain hidden;
- public artifacts remain readable.

## Anti-AI / theme review

- **Card-soup:** pass. Terminal, folder, posted result, ticket rail, and ledger remain structurally distinct artifacts.
- **Logo-swap:** pass. The altered brokerage nameplate and office artifacts do not reduce to a generic finance dashboard after a color/name swap.
- **Label deletion:** pass. R2 removes winner/evidence and Receipts explanatory labels that were no longer needed.
- **Repetition:** pass. Stamps, paper, machine surfaces, and annotations are tied to their represented objects rather than applied universally.
- **Called It:** approved R1 ticket direction preserved.
- **Receipts:** approved R1 continuous-feed ledger direction preserved.

## Scope review

The R2-only runtime diff contains homepage markup and R2 visual CSS only. No JavaScript, backend, auth, market, rules-authority, schema, RLS, migration, or Edge Function file was changed.

## Conclusion

No source-level or visual-composition blocker remains for R2. Exact external font metrics, live backend states, actual role sessions, physical touch behavior, and integrated network/runtime behavior remain later QA and are not inferred from this review.

R3 is not started. Production `main` is not modified or merged.
