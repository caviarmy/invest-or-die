# R4 Receipts Mobile Follow-up

**Branch:** `goblin-visual-reredesign`  
**Trigger:** owner mobile screenshot after the first R4 Receipts clipping correction  
**Status:** corrected and re-rendered; this follow-up supersedes the earlier Receipts mobile proof

## Finding

The first R4 clipping correction removed measurable horizontal overflow, but the owner screenshot showed that the visual safe area was still too aggressive:

- the right tractor-feed holes were visually cut by the paper edge;
- the record-holder/count column sat too close to the right rail;
- the page therefore still looked clipped even though the DOM width metrics were technically within bounds.

This was treated as a failed visual proof rather than accepted because `scrollWidth === clientWidth` is not sufficient when decorative imagery is intentionally placed on the edge.

## Correction

The mobile Receipts rules now:

- increase the paper's left/right content safe area from 34 px to 40 px;
- reduce each feed rail to 14 px;
- inset both feed rails 8 px from the paper edge so the circles render fully inside the sheet;
- bound the record-holder/count group to a maximum 46% right column;
- right-align holder/count inside that bounded column;
- reduce narrow-mobile title and leader typography slightly so the safe area does not depend on clipping.

No Receipts data, history rendering, leaderboard logic, or application JavaScript changed.

## Browser proof

A Chromium document-injection harness using the corrected Receipts markup/classes and mobile rules was rendered at 390 px and 320 px.

Measured `scrollWidth / clientWidth`:

### 390 px

- document: `390 / 390`
- receipt sheet: `370 / 370`
- title: `290 / 290`
- weekly leader row: `290 / 290`
- Called It leader row: `290 / 290`
- right feed rail: 14 px wide, inset 8 px

### 320 px

- document: `320 / 320`
- receipt sheet: `300 / 300`
- title: `220 / 220`
- weekly leader row: `220 / 220`
- Called It leader row: `220 / 220`
- right feed rail: 14 px wide, inset 8 px

Visual inspection confirms both feed rails are fully visible, the counts remain clear of the right rail, and long historical detail strings wrap before the paper edge.

## Gate impact

This is an R4 visual correction only. It does not authorize cutover or merge. The live-browser/device/auth blockers in `visual-reredesign-r4-runtime-qa.md` remain unchanged.
