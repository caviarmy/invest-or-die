# R1 Visual Language Review — Owner Feedback Revision

**Branch:** `goblin-visual-reredesign`  
**Base:** `aa39e44bc3b0b2a4098ee93f5a295f6dbb4a539a`  
**Scope:** isolated static design lab only  
**Live application files changed:** none  
**Supabase/auth/runtime connections:** none  
**R2:** not started

## Owner-feedback revision completed

The targeted R1 correction pass preserves the approved brokerage-office direction and changes only the weaker identity/header/terminal/Rules areas.

### Identity and header

The generic `GB` monogram is removed. The revised identity treats the original office designation as something physically altered: `HOUSEHOLD` remains faintly visible and struck through inside an institutional nameplate while a slightly crooked `GOBLIN` patch has been applied over it, followed by the stable `INVESTING` wordmark.

The previous `NEW MANAGEMENT` label is removed entirely. The altered nameplate now carries the takeover idea without explanatory copy.

Navigation now represents all five major user-facing destinations as a compact office/desk index:

1. Week
2. Lesson
3. Called It
4. Receipts
5. Rules

The navigation remains plain text with numbered file-index cues rather than pills, icons, or a generic SaaS menu.

### CRT intervention

`PAY IT.` is removed.

The terminal now carries an `INVEST / OR DIE` paper note with irregular edges, visible tape, rotation, drop shadow, and a folded lower corner. It reads as an object placed onto the machine after manufacture rather than a native UI control.

### Rules/manual correction

The Rules proof keeps the late-1970s/1980s operations-binder metaphor but has been recomposed as one physical desk artifact:

- dark desk/binder surround;
- narrow binder gutter/hinge between cover and page;
- restrained institutional cover;
- explicit `OPERATING / MANUAL` cover hierarchy;
- three-hole binder margin;
- typed section/revision header;
- rule equation and highlighted correction;
- page footer and numbering.

The corrected desktop proof no longer reads as two unrelated web cards and all intended cover/page elements are visible.

## Locked surfaces regression review

### Called It

Owner direction remains effectively 10/10. The ticket metaphor, ticket stock, tear-off stub, ticker hierarchy, direction stamp, price-to-target relationship, thesis treatment, filing rail, and empty ticket were not redesigned. The existing 390px Chromium proof remains clean and contained.

### The Receipts

Owner direction remains effectively 10/10. Continuous-feed paper, tractor holes, accounting hierarchy, permanent-record stamp, and ledger typography were preserved. The existing 390px Chromium proof remains clean and contained.

## Browser proof reviewed

The revision proof set was rendered in local headless Chromium from the isolated static design-lab source, not through the nonfunctional Opera connector.

Reviewed proofs:

- `mobile-top-390.png`
- `header-close-390.png`
- `mobile-called-390.png`
- `mobile-receipts-390.png`
- `desktop-rules.png`
- `whole-page-desktop.png`
- `mobile-top-320.png`

The 320px and 390px top-of-page proofs show the five-entry navigation, revised identity, CRT, and sticky note without horizontal clipping. The desktop whole-page proof shows the artifacts remaining visually distinct rather than collapsing into a common card system.

A later attempt to launch a new Chromium navigation in the current sandbox was blocked by the environment administrator. That later environment limitation does not replace or invalidate the already-rendered revision proof set and is not being represented as application runtime QA.

## Visual gate

| Gate | Assessment | Notes |
| --- | --- | --- |
| Overall visual quality | 9.0 / 10 | Targeted corrections improve the remaining weak surfaces without destabilizing the approved artifacts. |
| Theme | 9.3 / 10 | Institutional brokerage infrastructure remains primary; goblin interference now reads through physical alteration instead of explanatory labels. |
| Memorability | 9.2 / 10 | Altered brokerage nameplate, CRT with sticky note, ticket rail, continuous-feed ledger, and binder spread are independently memorable. |
| Called It | 10 / 10 directionally | Owner-locked visual direction preserved. |
| Receipts | 10 / 10 directionally | Owner-locked visual direction preserved. |
| Header / identity | 8.9 / 10 | No longer a generic initials logo; the altered institutional nameplate belongs to the site's fiction and remains legible at mobile size. |
| Rules proof | 9.1 / 10 | Desktop composition reads as a single operations-binder artifact and renders cleanly. |

## R1 final approval gate status

- [x] `PAY IT.` removed.
- [x] `INVEST OR DIE` rendered as a convincing physical note.
- [x] Navigation represents Week, Lesson, Called It, Receipts, and Rules.
- [x] `NEW MANAGEMENT` removed.
- [x] Generic `GB` monogram removed and replaced with an altered institutional identity.
- [x] Desktop Rules proof corrected.
- [x] Called It preserved.
- [x] Receipts preserved.
- [x] No generic SaaS visual system introduced.
- [x] No live application/backend/auth/business-rule files changed.

**Implementation-side R1 revision is complete. Owner approval is still required before R2.**
