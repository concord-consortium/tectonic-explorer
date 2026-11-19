# Terms of Use Link and Licensing Copy for Tectonic Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/TE-10

**Status**: **Closed**

## Overview

Tectonic Explorer's About and Share dialogs get the license and Terms of Use copy approved for CODAP's About dialog, replacing the old copyright block that put the content under CC BY 4.0, so that every Geo app says the same thing: the source is MIT, and use of the hosted site is governed by Concord's Terms of Use. The top bar's About and Share controls become keyboard-reachable buttons, and both dialogs get the dialog role, a name, focus on their Close button when they open, a focus trap and focus return.

TE-10 is one of five matching Geo stories (HURR-70, SE-4, TE-10, WM-67, FM-5). The decisions shared by all five (the geo-common decisions, numbered 1 to 11 below where cited) were made across the five stories; this spec applies them to Tectonic Explorer. Tags such as **[beyond story]** compare a requirement with the Jira story text, as geo-common does.

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
  - lets focus go while the simulation's "Model Stopped" dialog is open over it, and leaves Esc pressed there to that dialog;
  - returns focus to the About button when it closes, including after a click that opened it without focusing the button, as a click in Safari does.
- **R12. The Share dialog** behaves as R11 says for About, with the name "Share: Tectonic Explorer", and returns focus to the Share button when it closes. Its Copy Link and Copy HTML buttons still copy while focus is trapped.
- **R13. The dialogs look as they do today**: same size, position, title, buttons, scrolling and open and close animation, with no focus ring drawn around the dialog box.

### Unchanged

- **R14.** The About dialog's descriptive paragraphs and its creator and NSF credit line are unchanged; their links keep their current attributes. The Share dialog's link and embed textareas and its Copy Link and Copy HTML buttons are unchanged.

### Tests

- **R15.** Unit tests render the real About and Share content (not the copy component alone) and cover, for each: the four hrefs, asserted as literal URLs rather than the constants module's values; `target` and `rel` on the three web links and their absence on the mailto link; each web link's accessible name including the " (opens in a new tab)" hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-in phrases; that the copy is the content's last block (R1); the copyright line, with the clock pinned to a fixed date and the year asserted as a literal, under two different pinned years, so neither a year computed as the code computes it nor a hardcoded year passes; and that the R5 text is absent.
- **R16.** Top-bar tests cover, for About and for Share: that it is a button reached by Tab that opens its dialog with Enter, with focus on the dialog's Close button, and logs its `AboutDialogOpened` or `ShareDialogOpened` event; that the dialog has the dialog role, `aria-modal` and its name ("About: Tectonic Explorer", "Share: Tectonic Explorer"); that focus moves into it and stays inside it across Tab and Shift+Tab; that Esc, the Close button and a click on the overlay each close it and return focus to the button that opened it, also, by Esc and by Close, when a click opened it without focusing the button; that reopening it during its close animation puts focus on Close again; that when Model Stopped opens over About, focus moves into Model Stopped and Esc closes only Model Stopped, returning focus to About's Close; and, for Share, that Copy Link and Copy HTML each select their textarea and copy with focus kept in the dialog. Each test fails under a mutation of the code it guards.

### Review

- **R17.** Kiley reviews the result on the branch deploy before merge (story acceptance criterion). CI's S3 deploy publishes each branch at `https://models-resources.concord.org/tectonic-explorer/branch/<name>/index.html`, where `s3-deploy-action` strips a leading Jira key from the branch name, so this story's branch is at `https://models-resources.concord.org/tectonic-explorer/branch/add-terms-of-use-link/index.html`. That page opens on the mode chooser, which has no top bar; the review uses a simulation view, for example `index.html?geode=true&planetWizard=true`, and covers both About and Share.

## Technical Notes

- **Where the code lives**: everything is in `packages/tecrock-simulation`. The copy (`LicenseCopy`), the new-tab link (`ExternalLink`) and the link constants are in `src/components/license/`, as in HURR-70. The buttons are in `src/components/top-bar.tsx`, and the dialog both use is `src/components/top-bar-dialog.tsx`.
- **Reference implementation**: CODAP's About dialog (CODAP-1595 / codap#2758). HURR-70's `src/components/license/` is the Geo version of the same; this story's constants module differs from it only in the MIT URL. The Geo apps share no component library, so sameness comes from geo-common.md and an identical constants module.
- **Dialog**: react-toolbox's `Dialog` forwards no props to its root and takes its title only as a string, so it cannot carry the role, label or focus trap. `TopBarDialog` keeps react-toolbox's markup, theme classes, `Overlay`, `Button` and `ActivableRenderer` animation, so the dialogs look the same and the Cypress selectors (`[data-react-toolbox=dialog]`, `[data-react-toolbox=button]`, `section`) still match. It adds `role="dialog"`, `aria-modal`, `aria-labelledby` on the title, and MUI's `FocusTrap` (`@mui/material/Unstable_TrapFocus`, already in the package). It renders through `createPortal`; react-toolbox's `Portal` used `ReactDOM.unstable_renderSubtreeIntoContainer`, which logged a React 18 error on every open.
- **Focus on open**: `ActivableRenderer` mounts the dialog with `active` false, sets it true 20ms later, and on close keeps the dialog mounted for its 500ms animation, so a quick reopen reuses the mounted dialog. An effect that runs each time `active` turns true focuses Close (found as the `<nav>`'s last child, since react-toolbox's `Button` sits under HOCs whose refs are not the DOM button). `FocusTrap` is the child, so its effect runs first and may focus the container (`tabIndex={-1}`); the dialog's effect moves focus to Close in the same commit, before any paint.
- **Focus on close**: `TopBar` passes each button's ref as `opener`, and the cleanup of that effect focuses it, with `FocusTrap`'s own restore off (`disableRestoreFocus`). `FocusTrap` restores to the `relatedTarget` of the first focus inside the dialog, which is null when the button never had focus, as after a click in Safari or Firefox on macOS. React runs `FocusTrap`'s cleanup, which removes its focus-containing listener, before its parent's, so the trap does not pull focus back.
- **Model Stopped over a dialog**: the model keeps running while About or Share is open, and `simulation-store` shows "Model Stopped" (an MUI `Dialog` without a backdrop) when plate motion ends. MUI marks the other `<body>` children `aria-hidden`, including this dialog's wrapper, so `FocusTrap` gets `isEnabled` that is false while the wrapper is `aria-hidden`, letting focus stay in Model Stopped. react-toolbox's `Overlay` hears Esc on `<body>`, after React has already closed Model Stopped, so `aria-hidden` cannot tell whose Esc it was; the dialog closes on Esc only when the key went to its own content, or to `<body>` when nothing has focus. When Model Stopped closes, MUI returns focus to the dialog's Close.
- **Close's focus shade**: react-toolbox shades a flat button on any `:focus`; a scoped rule in `top-bar-dialog.scss` clears it on Close when Close is focused but not `:focus-visible`, so a mouse-opened dialog shows no indicator.
- **Top-bar focus ring**: the top bar is 20px tall and nothing drawn outside it shows, so the buttons' ring is inset (`outline-offset: -2px`) with 3px side padding, cancelled by the margins so the unfocused top bar is pixel-identical to master's.
- **Copyright line size**: `about-dialog.scss` styles paragraphs as `.dialog .body p`, which outranks `.licenseCopy .copyright`, so the copyright line is a `<div>`, which no dialog paragraph rule reaches.
- **Tests**: `top-bar.test.tsx` passes `@testing-library/react`'s act() wrappers to the hoisted `@testing-library/dom` that user-event uses, presses Esc through `fireEvent` (react-toolbox's `Overlay` checks `event.which === 27`), and waits for react-toolbox's `active` class before acting, since the trap and Esc engage only then. `fireEvent.click` stands in for a Safari click because it does not move focus. `@testing-library/user-event` 14.6.1 matches hurricane-model's lock.
- **Embeds**: nothing in the app hides the top bar, so About and the copy are reachable in Activity Player, portal launches and third-party iframes alike (decision 3 does not arise).
- **Lint**: `npm run lint` crashes on master (`@typescript-eslint/prefer-optional-chain` needs `parserOptions.project`); changed files are linted with that rule off. CI does not run lint.
- **CI**: `.github/workflows/ci.yml` is unchanged. Its cypress-io/github-action v4 step passes neither `start` nor `wait-on`, so HURR-70's v6 failure cannot occur, and v4's bundle ran green under Node 24 with this workflow's inputs. The S3 deploy still uses 2021 access-key secrets; a failed deploy goes to DEV-193, which covers the move to OIDC.

## Out of Scope

- From the story: a third-party library acknowledgements list, usage tracking, changing the software license, localizing the legal copy, and a cookie banner.
- Converting Refresh to a button (decision 4 covers About and Share only).
- Existing credit links in the About dialog, including their `rel="noreferrer"` without `noopener` (geo-common "How links open").
- The other react-toolbox and MUI dialogs in the app (Advanced Options, data collection, Model Stopped).
- The landing, samples and authoring pages and the splash screen (decision 11).
- `tecrock-table`, the other four Geo apps and Boreal Forest Fire Explorer.

## Decisions

### Requirements

#### Does the Share dialog get the accessibility fixes too?
**Context**: The story's requirement 5 names "any About dialog"; Share used the same react-toolbox `Dialog`.
**Options considered**:
- A) Use the new dialog for both About and Share.
- B) Fix About only.

**Decision**: A. Share shows the same license copy, and two dialog implementations for one look in one top bar would be harder to maintain.

---

#### What size is the new copy?
**Context**: The old block sat in a 13px wrapper below the dialogs' 15px paragraphs; HURR-70 put its paragraphs at body size.
**Options considered**:
- A) Paragraphs at the dialogs' 15px style, copyright line at 13px.
- B) The whole copy at 13px.

**Decision**: A, matching HURR-70 and geo-common. The copy is the statement the story asks to be visible, not fine print.

---

#### Will the branch deploy R17 relies on still publish?
**Context**: The S3 deploy authenticates with 2021 access-key secrets; other Concord repos moved to OIDC, and DEV-193 covers the rest.
**Options considered**:
- A) Proceed; the first push shows whether the deploy works, and a failure goes to DEV-193.
- B) Add the OIDC switch to this story.

**Decision**: A. The keys cannot be checked without pushing, and the switch needs a per-repo IAM role, which is DEV-193's scope. Old keys stay active after a repo moves to OIDC until someone deletes them.

---

#### R16 did not test the overlay-click close
**Context**: The new dialog wires the overlay's click handler itself, so a mistake there would go unnoticed.
**Decision**: R16 covers the overlay click, including focus return.

---

#### R17's review did not include the Share dialog
**Context**: R1 puts the copy in Share too.
**Decision**: R17's review covers both About and Share.

### Implementation

#### How does the dialog get its role, label and focus trap?
**Context**: react-toolbox's `Dialog` forwards no props to its root and takes its title only as a string.
**Options considered**:
- A) A local `TopBarDialog` built from react-toolbox's `Overlay`, `Button`, `ActivableRenderer` and dialog theme, with MUI's `FocusTrap`.
- B) Migrate About and Share to MUI's `Dialog`.
- C) Keep react-toolbox's `Dialog` and set attributes on its DOM after mount, with a hand-written trap.

**Decision**: A. It keeps decision 7's "no migration" and today's look (pixel-identical in Chromium); B restyles both dialogs and changes the Cypress selectors, and C edits DOM React does not own. Doug confirmed A on 2026-11-18.

---

#### Where does the dev dependency go in the commit order?
**Context**: Only the dialog step's tests need user-event.
**Options considered**:
- A) Its own commit just before the dialog step.
- B) First, before the copy step.

**Decision**: A, so each commit builds and tests on its own and the copy step carries no unused dependency.

---

#### How does Close take focus when the dialog opens?
**Context**: Decision 7 puts focus on Close on open. MUI's `FocusTrap` has no initial-focus option and focuses its container unless focus is already inside.
**Options considered**:
- A) `autoFocus` on Close.
- B) Close focused in an effect each time `active` turns true, found through a ref on `<nav>`.

**Decision**: B. A fires only when Close mounts, and a dialog reopened during its 500ms close animation is still mounted, so focus landed on the dialog box (found in the final code review and confirmed in jsdom and Chromium). geo-common decision 7 adopted "every time the dialog opens" for all five apps on 2026-11-19.

---

#### How does focus return to the opener?
**Context**: `FocusTrap` restores to the `relatedTarget` of the first focus inside the dialog, which is null when the opener never had focus, as after a click in Safari or Firefox on macOS.
**Options considered**:
- A) `TopBar` passes each button's ref as `opener`, and the dialog focuses it on close, with `FocusTrap`'s restore off.
- B) Keep `FocusTrap`'s restore.

**Decision**: A. B leaves focus on the page body after a mouse-opened dialog closes in those browsers; tests that open without focusing the button fail under B. geo-common decision 7 records this approach as acceptable for Tectonic.

---

#### What happens when Model Stopped opens over About or Share?
**Context**: The simulation opens Model Stopped on its own when plate motion ends, possibly while About or Share is open; the focus trap then pulled focus back into the dialog MUI had hidden with `aria-hidden` (found in the PR's Copilot review and reproduced in jsdom).
**Options considered**:
- A) Close About or Share when Model Stopped opens.
- B) Keep About or Share open beneath it: the trap lets focus go while the dialog is `aria-hidden`, and Esc pressed in Model Stopped closes only Model Stopped.

**Decision**: B. It keeps the dialogs independent (TopBar does not watch the simulation store), the reader returns to the About or Share text they had open, and MUI returns focus to its Close. Checked in Chromium by opening Model Stopped over About through the store.

---

#### Does a mouse-opened dialog show Close as focused?
**Context**: react-toolbox shades a flat button on any `:focus`; decision 7 says opening by mouse shows no indicator.
**Options considered**:
- A) A rule scoped to Close that clears the shade when it is focused but not `:focus-visible`.
- B) Leave react-toolbox's styling.

**Decision**: A, scoped to Close, so Copy Link and Copy HTML keep today's look (R14). Keyboard focus still shows the shade.

---

#### Does Tab order follow the visual order of About and Share?
**Context**: Both float right with About first in the DOM, so About is drawn rightmost but reached first by Tab.
**Options considered**:
- A) Keep the DOM order.
- B) Re-lay out the top bar so Tab runs left to right.

**Decision**: A. The two are adjacent and both open a dialog, so the reversed pair changes neither meaning nor reachability, and B re-lays out the top bar against R10's unchanged look.

---

#### How is the copyright line kept at 13px?
**Context**: `.dialog .body p` in `about-dialog.scss` outranks `.licenseCopy .copyright`.
**Options considered**:
- A) Make the line a `<div>`, as the old block was.
- B) Raise specificity or use `!important`.
- C) Flatten `about-dialog.scss` to `.body p`.

**Decision**: A. No rule competes for a `div`; B is brittle and C edits the dialog theme for the copy's sake.

---

#### About's focus ring showed only two sides
**Context**: With an outside offset, the ring around the 20px-tall button fell above the viewport and under the simulation canvas.
**Decision**: R10 requires the indicator inside the top bar; the ring is inset with padding cancelled by margins, keeping the unfocused top bar pixel-identical.

---

#### The top-bar tests logged act() warnings
**Context**: user-event resolves the hoisted `@testing-library/dom` 8.13, which `@testing-library/react` 14 never configures.
**Decision**: The test file passes `@testing-library/react`'s `asyncWrapper` and `eventWrapper` to that copy. `@testing-library/dom` must not be added to the package's dev dependencies, or user-event would still use the root copy.

---

#### Is a CI change needed before the first push?
**Context**: HURR-70 had to move cypress-io/github-action from v6 to v7.
**Decision**: No. v4 with this workflow's inputs ran green under Node 24; only a failure on the first push would add a workflow commit.
