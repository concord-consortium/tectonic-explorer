# Terms of Use Link and Licensing Copy for Tectonic Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/TE-10
**Repo**: https://github.com/concord-consortium/tectonic-explorer
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **In Development**

## Overview

Tectonic Explorer's About and Share dialogs get the license and Terms of Use copy approved for CODAP's About dialog, replacing the old copyright block that put the content under CC BY 4.0, so that every Geo app says the same thing: the source is MIT, and use of the hosted site is governed by Concord's Terms of Use. The top bar's About and Share controls become keyboard-reachable buttons, and both dialogs get the dialog role, a name, focus on their Close button when they open, a focus trap and focus return.

## Project Owner Overview

Concord published non-commercial Terms of Use for everything served from its servers, and the Geo simulations are widely embedded in commercial curricula. Each Geo app needs the same visible statement that use of the hosted site is governed by those terms and that commercial use needs a separate written agreement. Today Tectonic Explorer's About and Share dialogs say the software is MIT and the content is CC BY 4.0, and say nothing about the Terms of Use.

After this change both dialogs end with the CODAP wording, with working links to the MIT License, the Terms of Use, concord.org/licensing and licensing@concord.org. The dialogs look the same as before apart from that copy. Keyboard and screen-reader users can now reach About, are told they are in a dialog named "About: Tectonic Explorer", stay inside it while it is open, and return to About when it closes. Kiley reviews the result on the branch deploy before merge.

## Background

TE-10 is the Tectonic Explorer story in a set of five matching Geo stories (HURR-70, SE-4, TE-10, WM-67, FM-5). The decisions shared by all five are in the global oob doc `streams/terms-of-use/geo-common.md` (decisions 1 to 11); Kiley Brown decided 3, 5, 6 and 9 on 2026-11-17 and Doug took the rest. This spec applies them to Tectonic Explorer rather than re-deciding them. HURR-70 (hurricane-model, PR #163) is the first of the five built to that doc, and is the worked example for the copy component, the new-tab link, the constants module and the tests.

What the code has today (`packages/tecrock-simulation`, the only package with an About dialog; `tecrock-table` has none):

- `src/components/top-bar.tsx` renders the top bar on every simulation view. It has a refresh icon, an About `<span onClick>` and a Share `<span onClick>`, and two react-toolbox `Dialog`s (2.0.0-beta.13) titled "About: Tectonic Explorer" and "Share: Tectonic Explorer", each closed by Esc, an overlay click or a Close action button.
- `src/components/about-dialog-content.tsx` and `share-dialog-content.tsx` both end in `<Copyright />` (`src/components/copyright.tsx`) inside a 13px wrapper. Its text: "Copyright © {year} The Concord Consortium. All rights reserved. The software is licensed under the MIT license. The content is licensed under a Creative Commons Attribution 4.0 International License. Please provide attribution to the Concord Consortium and the URL https://concord.org."
- react-toolbox's `Dialog` renders a plain `<div data-react-toolbox="dialog">` holding `<section role="body">` with an `<h6>` title and a `<nav>` of buttons. It forwards no extra props to that `div`, so it cannot be given `role="dialog"`, `aria-labelledby` or a focus trap, and its `title` prop is typed as a string. Checked in Chromium on master: the div has no role, and opening About leaves focus on `<body>`. It also renders through `ReactDOM.unstable_renderSubtreeIntoContainer`, which logs a React 18 "no longer supported" error each time a dialog opens.
- The top bar is not hidden in any embed: no config or URL parameter removes it, and the app does not wait for an Activity Player message before rendering. Checked in Chromium: the simulation loaded in a plain iframe shows the top bar and About.
- The landing page (`ModeWizard`, shown when neither `geode` nor `rocks` is set), the `?samples` index and the `?authoring` page have no top bar.
- The repository's LICENSE is MIT and its default branch is `master`, so the story's "flag to Kiley if not MIT" condition does not trigger.

## Requirements

### License copy

- **R1. One license-copy component** renders the copy below and is the last block of both the About dialog and the Share dialog content, replacing `<Copyright />` and its 13px wrapper in each. `src/components/copyright.tsx` is deleted (decision 5).
- **R2. Copy, word for word** (geo-common "Copy"; CODAP `V3.AboutDialog.*` with the product and host swapped), in this order:
  - Paragraph 1: **Tectonic Explorer is free, open-source software.** The Tectonic Explorer source code is released under the [MIT License], so you’re welcome to use, modify, and build on it.
  - Paragraph 2: **Your use of Tectonic Explorer at tectonic-explorer.concord.org** is governed by our [Terms of Use]. The hosted version is free for non-commercial use; commercial use requires a separate written agreement. For more information, visit [concord.org/licensing] or contact [licensing@concord.org].
  - Copyright line: `© {current year} The Concord Consortium, Inc.`
  - The leading phrase of each paragraph is bold. "you’re" uses the curly apostrophe U+2019 (decision 1).
- **R3. Text size**: the two paragraphs use the dialogs' existing paragraph style (15px with a 10px top margin, from `about-dialog.scss` and `share-dialog.scss`); the copyright line keeps the old block's 13px.
- **R4. Year** is `new Date().getFullYear()` at render time. No range and no build-time constant (decision 1).
- **R5. The old text is gone** from both dialogs: no "Creative Commons", "CC BY" or "All rights reserved" (decision 5).

### Links

- **R6. Link targets**, kept in one constants module rather than inline in JSX:
  - MIT License: `https://github.com/concord-consortium/tectonic-explorer/blob/master/LICENSE`
  - Terms of Use: `https://concord.org/terms-of-use/`
  - concord.org/licensing: `https://concord.org/licensing`
  - licensing@concord.org: `mailto:licensing@concord.org`
- **R7. Web links open in a new tab**: the three web links have `target="_blank"` and `rel="noopener noreferrer"` (decision 2), and append visually hidden text " (opens in a new tab)", so their accessible name is the visible text plus the hint. The mailto link is a plain same-tab `<a>` with no hint.
- **R8. Links in the copy are underlined.**

### Reachability

- **R9. No other new surface**: no top-bar Terms of Use item, no heading over the copy, no CODAP-style links row (decision 6). The landing, `?samples` and `?authoring` pages are unchanged (decision 11), as is the splash screen.
- **R10. About and Share are each a `<button type="button">`** (decision 4: **[applies story]** for About, **[beyond story]** for Share), looking as they do today (same font, color, size, position and hover, with no button border or background), keeping `data-test="top-bar-about"` and `data-test="top-bar-share"` and the `AboutDialogOpened` and `ShareDialogOpened` logs. Each shows a visible focus indicator on keyboard focus, drawn inside the 20px top bar so that neither the top of the viewport nor the simulation view below it hides any side of it. Refresh stays as it is.

### Dialog behavior

- **R11. The About dialog** (decision 7):
  - has `role="dialog"` and `aria-modal="true"`, and its accessible name is its title, "About: Tectonic Explorer";
  - puts focus on its Close button when it opens, so focus lands inside the element that carries the dialog's name and a screen reader announces the title (decision 7, **[beyond story]**). Opening by keyboard shows Close's focus indicator; opening by mouse shows none;
  - keeps Tab and Shift+Tab inside the dialog while it is open;
  - still closes on Esc, on an overlay click and on its Close button;
  - returns focus to the About button when it closes, including after a click that opened it without focusing the button, as a click in Safari does.
- **R12. The Share dialog** behaves as R11 says for About, with the name "Share: Tectonic Explorer", and returns focus to the Share button when it closes. Its Copy Link and Copy HTML buttons still copy while focus is trapped.
- **R13. The dialogs look as they do today**: same size, position, title, buttons, scrolling and open and close animation, with no focus ring drawn around the dialog box.

### Unchanged

- **R14.** The About dialog's descriptive paragraphs and its creator and NSF credit line are unchanged; their links keep their current attributes. The Share dialog's link and embed textareas and its Copy Link and Copy HTML buttons are unchanged.

### Tests

- **R15.** Unit tests render the real About and Share content (not the copy component alone) and cover, for each: the four hrefs, asserted as literal URLs rather than the constants module's values; `target` and `rel` on the three web links and their absence on the mailto link; each web link's accessible name including the " (opens in a new tab)" hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-in phrases; that the copy is the content's last block (R1); the copyright line, with the clock pinned to a fixed date and the year asserted as a literal, under two different pinned years, so neither a year computed as the code computes it nor a hardcoded year passes; and that the R5 text is absent.
- **R16.** Top-bar tests cover, for About and for Share: that it is a button reached by Tab that opens its dialog with Enter, with focus on the dialog's Close button, and logs its `AboutDialogOpened` or `ShareDialogOpened` event; that the dialog has the dialog role, `aria-modal` and its name ("About: Tectonic Explorer", "Share: Tectonic Explorer"); that focus moves into it and stays inside it across Tab and Shift+Tab; that Esc, the Close button and a click on the overlay each close it and return focus to the button that opened it, also, by Esc and by Close, when a click opened it without focusing the button; that reopening it during its close animation puts focus on Close again; and, for Share, that Copy Link and Copy HTML each select their textarea and copy with focus kept in the dialog. Each test fails under a mutation of the code it guards.

### Review

- **R17.** Kiley reviews the result on the branch deploy before merge (story acceptance criterion). CI's S3 deploy publishes each branch at `https://models-resources.concord.org/tectonic-explorer/branch/<name>/index.html` (`deployRunUrl` in `.github/workflows/ci.yml`), where `s3-deploy-action` strips a leading Jira key from the branch name, so this story's branch is at `https://models-resources.concord.org/tectonic-explorer/branch/add-terms-of-use-link/index.html`. That page opens on the mode chooser, which has no top bar; the review uses a simulation view, for example `index.html?geode=true&planetWizard=true`, and covers both About and Share, since both show the copy.

## Technical Notes

- **Where the code lives**: everything is in `packages/tecrock-simulation`. The copy, the `ExternalLink` component and the link constants go in a new `src/components/license/` folder, as in HURR-70. The About button and the dialogs are in `src/components/top-bar.tsx`.
- **Reference implementation**: CODAP's About dialog (CODAP-1595 / codap#2758): strings `V3.AboutDialog.*` in `v3/src/utilities/translation/lang/en-US.json5`, links in `about-dialog-constants.ts`, new-tab links in `components/common/external-link.tsx` with hint `V3.ExternalLink.opensInNewTab`. HURR-70's `src/components/license/` is the Geo version of the same; this story's constants module differs from it only in the MIT URL.
- **No shared package**: the Geo apps share no component library, so Tectonic implements the copy locally; sameness comes from geo-common.md and an identical constants module.
- **Dialog**: react-toolbox's `Dialog` cannot take the role, label or focus trap (see Background), so R11 to R13 need a local dialog component that keeps react-toolbox's markup, theme classes, `Overlay`, `Button` and open/close animation, and adds the missing pieces. This keeps decision 7's "no migration to MUI": the dialog looks the same, only its markup gains attributes. Doug confirmed this approach on 2026-11-18 over migrating About and Share to MUI's `Dialog`, and geo-common.md's TE-10 row records it. The design is in implementation.md.
- **Copyright line size**: `about-dialog.scss` styles paragraphs as `.dialog .body p`, which outranks a `.licenseCopy .copyright` rule, so a `<p>` copyright line renders at 15px in About (13px in Share, whose rule is `.body p`). Measured in Chromium. The line is therefore a `<div>`, as the old block was, which no dialog paragraph rule reaches.
- **Embeds**: nothing in the app hides the top bar, so About and the copy are reachable in Activity Player, portal launches and third-party iframes alike. Decision 3 (hidden top bars) does not arise for Tectonic.
- **Link underline**: links in the dialogs are already underlined by the browser default (checked in Chromium on master); R8 is still set explicitly on the copy so a later global link style cannot remove it.
- **Orphaned style**: `share-dialog.scss` has a `.copyright` rule nothing uses (the old `Copyright` component never set a class). It goes with the copy change.
- **Logging**: no new log events.
- **CLUE-750 differences**: CLUE keeps a heading and a links row because its story and mockup require them; the Geo apps do not (decision 6).

## Out of Scope

- From the story: a third-party library acknowledgements list, usage tracking, changing the software license, localizing the legal copy, and a cookie banner.
- Converting Refresh to a button (decision 4 covers About and Share only).
- Existing credit links in the About dialog, including their `rel="noreferrer"` without `noopener` (geo-common "How links open").
- The other react-toolbox and MUI dialogs in the app (Advanced Options, data collection, Model Stopped).
- The landing, samples and authoring pages and the splash screen (decision 11).
- `tecrock-table`, the other four Geo apps and Boreal Forest Fire Explorer.

## Open Questions

<!-- Requirements-focused questions only (scope, acceptance criteria, business rules).
     Implementation questions go in implementation.md. -->

### RESOLVED: Judgment call: does the Share dialog get the accessibility fixes too?
**Context**: The story's requirement 5 names "any About dialog". Share uses the same react-toolbox `Dialog`.

**Options considered**:
- A) Use the new dialog for both About and Share.
- B) Fix About only and leave Share on react-toolbox's `Dialog`.

**Decision**: A. Share shows the same license copy, and keeping two dialog implementations in one top bar for the same look would be harder to maintain than one. R12 records what Share gets, including focus return to the Share button (R10, decision 4).

### RESOLVED: Judgment call: what size is the new copy?
**Context**: The old `Copyright` block sat in a 13px wrapper, below the dialogs' 15px paragraphs. HURR-70 put its two paragraphs at body size and only the copyright line in the small style.

**Options considered**:
- A) Paragraphs in the dialogs' 15px paragraph style, copyright line at 13px.
- B) The whole copy at 13px, as the old block was.

**Decision**: A, matching HURR-70 and geo-common's "copyright line, in the existing small copyright style" (R3). The copy is now the statement the story asks to be visible, not fine print.

### RESOLVED: Low confidence: will the branch deploy R17 relies on still publish?
**Context**: The S3 deploy job authenticates with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` repo secrets set in 2021. Other Concord repos moved to OIDC this year (DEV-163, DEV-185, DEV-188; hurricane-model in July), and DEV-193 (To Do, Sprint 32) covers the repos still on keys. The repo has no workflow runs on record to show whether the keys still work.

**Options considered**:
- A) Proceed as written; the first push shows whether the deploy works, and a failure goes to Doug as DEV-193's work.
- B) Add the OIDC switch to this story.

**Decision**: A. The keys cannot be checked without pushing, and the OIDC switch needs a per-repo IAM role created with AWS access (starter-projects' `create-deploy-role.sh`), which is DEV-193's scope and not part of a 2-point copy story. Kirk's 2026-10-06 note in #dev shows the old keys stay active after a repo moves to OIDC until someone deletes them, so a working deploy is the likely outcome.

## Self-Review

Roles: WCAG accessibility expert, QA engineer, Kiley as acceptance reviewer, senior engineer. Checked in Chromium against the prototype dialog: the unfocused top bar matches master's pixel for pixel, the dialog paragraphs are 15px with a 10px top margin, links show the browser's focus ring, and Close shows react-toolbox's gray focus background.

### QA Engineer

#### RESOLVED: R16 did not test the overlay-click close
R11 keeps closing on an overlay click, and the new dialog wires the overlay's click handler itself, so a mistake there would go unnoticed. R16 now includes an overlay click.

---

### Kiley as acceptance reviewer

#### RESOLVED: R17's review did not include the Share dialog
The acceptance criteria ask for the copy on "any About / credits surface", and R1 puts it in Share too, but R17 only pointed at a simulation view. R17 now says the review covers both About and Share.
