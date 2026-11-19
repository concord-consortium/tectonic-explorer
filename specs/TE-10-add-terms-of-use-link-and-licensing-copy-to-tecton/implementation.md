# Implementation Plan: Terms of Use Link and Licensing Copy for Tectonic Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/TE-10
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **In Development**

## Implementation Plan

Three commits on `TE-10-add-terms-of-use-link`, all in `packages/tecrock-simulation`: the license copy in both dialogs, then the test dependency on its own, then the About button and the accessible dialog. Every code block below applies to master as written, and each step builds and passes on its own (see Verification). R17 is Kiley's review and needs no code.

### License copy in the About and Share dialogs

**Summary**: Adds the license-copy component, its new-tab link and its link constants, renders it as the last block of both dialog contents in place of `Copyright`, deletes `copyright.tsx` and the unused `.copyright` rule, and tests the copy through both dialogs. Covers R1 to R8, R14 and R15.

**Files affected**:
- `src/components/license/license-constants.ts` (new): the four link targets.
- `src/components/license/external-link.tsx` and `external-link.scss` (new): the new-tab link with its hidden hint.
- `src/components/license/license-copy.tsx` and `license-copy.scss` (new): the copy.
- `src/components/about-dialog-content.tsx`, `src/components/share-dialog-content.tsx`: render `LicenseCopy` in place of the 13px wrapper and `Copyright`.
- `src/components/copyright.tsx`: deleted.
- `src/components/share-dialog.scss`: drop the `.copyright` rule nothing uses.
- `test/components/license-copy.test.tsx` (new).

**Estimated diff size**: ~180 lines.

`src/components/license/license-constants.ts`:

```ts
export const kMitLicenseUrl = "https://github.com/concord-consortium/tectonic-explorer/blob/master/LICENSE";
export const kTermsOfUseUrl = "https://concord.org/terms-of-use/";
export const kLicensingUrl = "https://concord.org/licensing";
export const kLicensingEmail = "licensing@concord.org";
```

`src/components/license/external-link.tsx`:

```tsx
import React, { AnchorHTMLAttributes, ReactNode } from "react";

import css from "./external-link.scss";

interface IProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  href: string;
  children: ReactNode;
}

// A link that opens in a new tab and tells screen-reader users that it does.
export const ExternalLink = ({ href, children, ...others }: IProps) => (
  <a {...others} href={href} target="_blank" rel="noopener noreferrer">
    { children }
    <span className={css.visuallyHidden}> (opens in a new tab)</span>
  </a>
);
```

`src/components/license/external-link.scss`:

```scss
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

`src/components/license/license-copy.tsx`. The copyright line is a `<div>`, not a `<p>`: `about-dialog.scss` styles paragraphs as `.dialog .body p`, which outranks `.licenseCopy .copyright` and would set the line at 15px in About only.

```tsx
import React from "react";

import { ExternalLink } from "./external-link";
import { kLicensingEmail, kLicensingUrl, kMitLicenseUrl, kTermsOfUseUrl } from "./license-constants";

import css from "./license-copy.scss";

export const LicenseCopy = () => (
  <div className={css.licenseCopy} data-test="license-copy">
    <p>
      <strong>Tectonic Explorer is free, open-source software.</strong> The Tectonic Explorer source code is
      released under the <ExternalLink href={kMitLicenseUrl}>MIT License</ExternalLink>, so you’re welcome to use,
      modify, and build on it.
    </p>
    <p>
      <strong>Your use of Tectonic Explorer at tectonic-explorer.concord.org</strong> is governed by
      our <ExternalLink href={kTermsOfUseUrl}>Terms of Use</ExternalLink>. The hosted version is free for
      non-commercial use; commercial use requires a separate written agreement. For more information,
      visit <ExternalLink href={kLicensingUrl}>concord.org/licensing</ExternalLink> or
      contact <a href={`mailto:${kLicensingEmail}`}>{ kLicensingEmail }</a>.
    </p>
    <div className={css.copyright}>© { new Date().getFullYear() } The Concord Consortium, Inc.</div>
  </div>
);
```

`src/components/license/license-copy.scss`:

```scss
.licenseCopy {
  a {
    text-decoration: underline;
  }

  .copyright {
    margin-top: 10px;
    font-size: 13px;
  }
}
```

The two dialog contents and the orphaned rule:

```diff
diff --git a/packages/tecrock-simulation/src/components/about-dialog-content.tsx b/packages/tecrock-simulation/src/components/about-dialog-content.tsx
--- a/packages/tecrock-simulation/src/components/about-dialog-content.tsx
+++ b/packages/tecrock-simulation/src/components/about-dialog-content.tsx
@@ -1,5 +1,5 @@
 import React, { PureComponent } from "react";
-import Copyright from "./copyright";
+import { LicenseCopy } from "./license/license-copy";
 import config from "../config";
 
 export default class AboutDialogContent extends PureComponent {
@@ -45,9 +45,7 @@ export default class AboutDialogContent extends PureComponent {
           <a href="https://nsf.gov/" target="_blank" rel="noreferrer">National Science Foundation</a>
           &nbsp;grants DRL-1621176 and DRL-2006144.
         </p>
-        <div style={{ fontSize: "13px", marginTop: "15px" }}>
-          <Copyright />
-        </div>
+        <LicenseCopy />
       </div>
     );
   }
diff --git a/packages/tecrock-simulation/src/components/share-dialog-content.tsx b/packages/tecrock-simulation/src/components/share-dialog-content.tsx
--- a/packages/tecrock-simulation/src/components/share-dialog-content.tsx
+++ b/packages/tecrock-simulation/src/components/share-dialog-content.tsx
@@ -1,5 +1,5 @@
 import React, { PureComponent } from "react";
-import Copyright from "./copyright";
+import { LicenseCopy } from "./license/license-copy";
 
 function getURL() {
   return window.location.href;
@@ -21,9 +21,7 @@ export default class ShareDialogContent extends PureComponent {
           Paste HTML to embed in website or blog.
           <textarea id="iframe-string" value={getIframeString()} readOnly style={{ height: "4em" }} />
         </p>
-        <div style={{ fontSize: "13px", marginTop: "15px" }}>
-          <Copyright />
-        </div>
+        <LicenseCopy />
       </div>
     );
   }
diff --git a/packages/tecrock-simulation/src/components/share-dialog.scss b/packages/tecrock-simulation/src/components/share-dialog.scss
--- a/packages/tecrock-simulation/src/components/share-dialog.scss
+++ b/packages/tecrock-simulation/src/components/share-dialog.scss
@@ -7,9 +7,4 @@
   textarea {
     width: 100%;
   }
-
-  .copyright {
-    font-size: 12px;
-    margin-top: 15px;
-  }
 }
```

`test/components/license-copy.test.tsx`. One `describe.each` over the real About and Share contents, so dropping the copy from either dialog fails; hrefs are literal URLs; the year is pinned to 2031 for the suite and to 2047 in one test, so neither a hardcoded year nor a year computed as the code computes it passes.

```tsx
import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import AboutDialogContent from "../../src/components/about-dialog-content";
import ShareDialogContent from "../../src/components/share-dialog-content";

const webLinks = [
  ["MIT License", "https://github.com/concord-consortium/tectonic-explorer/blob/master/LICENSE"],
  ["Terms of Use", "https://concord.org/terms-of-use/"],
  ["concord.org/licensing", "https://concord.org/licensing"]
];

describe.each([
  ["About", AboutDialogContent],
  ["Share", ShareDialogContent]
])("license copy in the %s dialog", (_name, DialogContent) => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2031-03-04T12:00:00Z") });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("links the MIT License, Terms of Use and licensing page in a new tab", () => {
    render(<DialogContent />);
    const copy = within(screen.getByTestId("license-copy"));
    expect(copy.getAllByRole("link")).toHaveLength(4);
    for (const [text, href] of webLinks) {
      const link = copy.getByRole("link", { name: `${text} (opens in a new tab)` });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("links the licensing email in the same tab", () => {
    render(<DialogContent />);
    const mail = within(screen.getByTestId("license-copy")).getByRole("link", { name: "licensing@concord.org" });
    expect(mail).toHaveAttribute("href", "mailto:licensing@concord.org");
    expect(mail).not.toHaveAttribute("target");
    expect(mail).not.toHaveAttribute("rel");
  });

  it("shows the approved copy, in order, with the current year", () => {
    render(<DialogContent />);
    const copy = screen.getByTestId("license-copy");
    const blocks = [...copy.children].map(block => block.textContent?.replace(/\s+/g, " ").trim());
    expect(blocks).toEqual([
      "Tectonic Explorer is free, open-source software. The Tectonic Explorer source code is released under " +
      "the MIT License (opens in a new tab), so you’re welcome to use, modify, and build on it.",
      "Your use of Tectonic Explorer at tectonic-explorer.concord.org is governed by our Terms of Use (opens in a " +
      "new tab). The hosted version is free for non-commercial use; commercial use requires a separate written " +
      "agreement. For more information, visit concord.org/licensing (opens in a new tab) or contact " +
      "licensing@concord.org.",
      "© 2031 The Concord Consortium, Inc."
    ]);
    expect([...copy.querySelectorAll("strong")].map(s => s.textContent)).toEqual([
      "Tectonic Explorer is free, open-source software.",
      "Your use of Tectonic Explorer at tectonic-explorer.concord.org"
    ]);
  });

  it("computes the copyright year when it renders", () => {
    jest.setSystemTime(new Date("2047-11-20T12:00:00Z"));
    render(<DialogContent />);
    expect(screen.getByTestId("license-copy")).toHaveTextContent("© 2047 The Concord Consortium, Inc.");
  });

  it("is the last block of the dialog content", () => {
    render(<DialogContent />);
    expect(screen.getByTestId("license-copy").nextElementSibling).toBeNull();
  });

  it("drops the old Creative Commons copyright block", () => {
    render(<DialogContent />);
    expect(document.body).not.toHaveTextContent(/Creative Commons|CC BY|All rights reserved/);
  });
});
```

---

### Add user-event for keyboard tests

**Summary**: Adds `@testing-library/user-event` as a dev dependency so the next step's tests can drive Tab, Shift+Tab and Enter. Kept apart from code changes. Version 14.6.1 is the one hurricane-model locks, so the Geo apps' keyboard tests run on the same user-event.

**Files affected**:
- `packages/tecrock-simulation/package.json`: `"@testing-library/user-event": "^14.6.1"` in `devDependencies`.
- `package-lock.json`: the new package (about 22 lines).

**Estimated diff size**: ~23 lines.

Run from the repo root with Node 16 and npm 8, as CI does:

```bash
CYPRESS_INSTALL_BINARY=0 npm install -D @testing-library/user-event@14.6.1 -w packages/tecrock-simulation
```

---

### About and Share buttons and accessible top-bar dialog

**Summary**: Makes About and Share `<button>`s that look like the old spans, and replaces react-toolbox's `Dialog` in the top bar with a local `TopBarDialog` that keeps react-toolbox's markup, theme classes, `Overlay`, `Button` and `ActivableRenderer` animation and adds `role="dialog"`, `aria-modal`, a label tied to the title, focus on Close when the dialog opens, MUI's focus trap, which keeps focus inside, and focus returned by ref to the button that opened the dialog. Both About and Share use it, and it renders their shared Close action itself. Share's button and the focus on Close are **[beyond story]** (geo-common decisions 4 and 7). Covers R10 to R13 and R16.

**Files affected**:
- `src/components/top-bar-dialog.tsx` and `top-bar-dialog.scss` (new).
- `src/components/top-bar.tsx`: About and Share become buttons with refs; both dialogs use `TopBarDialog` and get their button as `opener`, and their Close actions move into it.
- `src/components/top-bar.scss`: the `rightLink` mixin becomes `rightButton`, with the button reset and inset focus outline, used by `.about` and `.share`.
- `test/components/top-bar.test.tsx` (new).

**Estimated diff size**: ~200 lines.

`src/components/top-bar-dialog.tsx`:

```tsx
import React, { ReactNode, RefObject, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import ActivableRenderer from "react-toolbox/lib/hoc/ActivableRenderer";
import { Overlay } from "react-toolbox/lib/overlay";
import { Button } from "react-toolbox/lib/button";
import dialogTheme from "react-toolbox/lib/dialog/theme.css";
import css from "./top-bar-dialog.scss";

interface ITopBarDialogAction {
  label: string;
  onClick: () => void;
}

interface IProps {
  active: boolean;
  title: string;
  actions?: ITopBarDialogAction[];
  onClose: () => void;
  opener: RefObject<HTMLElement>;
  theme?: Record<string, string>;
  children: ReactNode;
}

// react-toolbox's Dialog markup and theme, plus the dialog role, a label tied to the title, focus on Close when the
// dialog opens, a focus trap, and focus returned to the opener when the dialog closes.
const TopBarDialogBase = ({ active, title, actions = [], onClose, opener, theme = {}, children }: IProps) => {
  const titleId = useId();
  const navRef = useRef<HTMLElement>(null);
  // Runs on every open, including a reopen while the closing dialog is still mounted. Focus returns by ref, not
  // FocusTrap's restore, because Safari does not focus a clicked button.
  useEffect(() => {
    const openerNode = opener.current;
    if (active) {
      (navRef.current?.lastElementChild as HTMLElement | null)?.focus();
      return () => openerNode?.focus();
    }
  }, [active, opener]);
  const cls = (key: string) => classNames(dialogTheme[key], theme[key]);
  return createPortal(
    <div className={cls("wrapper")}>
      <Overlay active={active} onClick={onClose} onEscKeyDown={onClose} data-test="top-bar-dialog-overlay" />
      <FocusTrap open={active} disableRestoreFocus>
        <div data-react-toolbox="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
          className={classNames(cls("dialog"), css.dialog, cls("normal"), { [cls("active")]: active })}>
          <section className={cls("body")}>
            <h6 id={titleId} className={cls("title")}>{ title }</h6>
            { children }
          </section>
          <nav ref={navRef} className={cls("navigation")}>
            { actions.map(({ label, onClick }) =>
              <Button key={label} label={label} onClick={onClick} className={cls("button")} />) }
            <Button label="Close" onClick={onClose} className={classNames(cls("button"), css.close)} />
          </nav>
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
};

export const TopBarDialog = ActivableRenderer<IProps>()(TopBarDialogBase);
```

Notes on it:

- It renders through `createPortal` into `document.body`, where react-toolbox's `Portal` used `ReactDOM.unstable_renderSubtreeIntoContainer`, which logs a React 18 "no longer supported" error every time a dialog opens. The wrapper, overlay and dialog keep their places in `<body>`, so the theme's fixed positioning is unchanged.
- The theme merge (`cls`) does what react-toolbox's `themr` does for a `theme` prop: react-toolbox's class for each key, then the passed one.
- Close is rendered by the dialog, last in the actions row as both dialogs had it, and is found through a ref on `<nav>` as its last child, since react-toolbox's `Button` sits under HOCs whose refs are not the DOM `<button>`. `actions` holds only the other buttons (Share's Copy Link and Copy HTML).
- `ActivableRenderer` mounts the dialog with `active` false and sets it 20ms later, for the open animation, and on close sets `active` false and unmounts 500ms later; a reopen in that window reuses the mounted dialog. An effect that runs each time `active` turns true focuses Close, so the first open and a quick reopen behave alike (`autoFocus` would fire only at mount). `FocusTrap` (`@mui/material/Unstable_TrapFocus`, MUI 5.15 already in the package, `open={active}`) is the child, so its effect runs first and focuses the container (which needs `tabIndex={-1}`) when focus is outside; the dialog's effect then moves focus to Close in the same commit, before any paint, so the container never shows a ring. The trap wraps Tab and Shift+Tab.
- Focus returns to the opener through the `opener` ref, focused in the cleanup of an effect that runs while `active` is true, with `FocusTrap`'s own restore off (`disableRestoreFocus`). `FocusTrap` restores to the `relatedTarget` of the first focus inside the dialog, which is the opener only if the opener had focus: Safari (and Firefox on macOS) do not focus a clicked button, so after a mouse open it would restore to nothing, or to Close if the user had pressed Tab. React runs `FocusTrap`'s effect cleanup, which removes its focus-containing listener, before its parent's, so the trap does not pull focus back.
- react-toolbox's `<section role="body">` loses its invalid `role`, and the `<h6>` is always rendered, since both dialogs have a title.
- The overlay gets `data-test="top-bar-dialog-overlay"` for the overlay-click test; react-toolbox's `Overlay` passes unknown props to its `div`.

`src/components/top-bar-dialog.scss`. react-toolbox's flat buttons show their focus as a gray background on any `:focus`, so without this rule Close would look focused after a mouse click opens the dialog. The selector outranks react-toolbox's `.neutral:not([disabled]).flat:focus:not(:active)` without `!important`. Copy Link and Copy HTML keep react-toolbox's styling (R14). The dialog container never shows a focus ring: focus lands on Close, and a mouse click on the dialog's text focuses the container without `:focus-visible` (checked in Chromium with no outline rule).

```scss
// react-toolbox shades a flat button on any :focus. Close takes focus whenever the dialog opens, so its shade is kept to
// keyboard focus: a dialog opened by mouse shows no focus indicator.
.dialog .close:not([disabled]):focus:not(:focus-visible):not(:active) {
  background-color: transparent;
}
```

`top-bar.tsx` and `top-bar.scss`. The old `data-test="about-dialog"` prop is dropped: react-toolbox's `Dialog` never rendered it, and nothing selects it. The top bar is 20px tall and About and Share fill that height, so a ring drawn outside a button loses its top edge past the top of the viewport and its bottom edge under the simulation canvas, leaving two short vertical bars. The ring is therefore inset (`outline-offset: -2px`); 3px of side padding keeps it off the text, and matching margins (`margin-left: -3px`, and right margins 3px smaller: About 10px to 7px, Share 25px to 22px) keep both labels where they are, so the unfocused top bar is pixel-identical. The reset and ring live in one mixin, `rightButton` (the old `rightLink`, which only `.about` and `.share` use), so the two buttons cannot drift apart.

Both buttons keep their DOM order, About then Share, so Tab reaches About first although Share sits to its left (both float right); see the judgment call under Open Questions.

```diff
diff --git a/packages/tecrock-simulation/src/components/top-bar.scss b/packages/tecrock-simulation/src/components/top-bar.scss
--- a/packages/tecrock-simulation/src/components/top-bar.scss
+++ b/packages/tecrock-simulation/src/components/top-bar.scss
@@ -19,20 +19,31 @@
     font-size: 20px;
   }
 
-  @mixin rightLink {
+  // Nothing drawn outside the 20px top bar shows, so the focus ring sits inside the button: the side padding keeps it
+  // off the text, and each button's margins absorb that 3px on both sides so the labels sit as plain text would.
+  @mixin rightButton {
     @include topLink;
     float: right;
+    padding: 0 3px;
+    margin-left: -3px;
+    border: none;
+    background: none;
+    font-family: inherit;
     font-size: 15px;
     line-height: 20px;
+    &:focus-visible {
+      outline: 2px solid #111;
+      outline-offset: -2px;
+    }
   }
 
   .about {
-    @include rightLink;
-    margin-right: 10px;
+    @include rightButton;
+    margin-right: 7px;
   }
 
   .share {
-    @include rightLink;
-    margin-right: 25px;
+    @include rightButton;
+    margin-right: 22px;
   }
 }
diff --git a/packages/tecrock-simulation/src/components/top-bar.tsx b/packages/tecrock-simulation/src/components/top-bar.tsx
--- a/packages/tecrock-simulation/src/components/top-bar.tsx
+++ b/packages/tecrock-simulation/src/components/top-bar.tsx
@@ -1,6 +1,6 @@
-import React, { PureComponent } from "react";
+import React, { createRef, PureComponent } from "react";
 import FontIcon from "react-toolbox/lib/font_icon";
-import { Dialog } from "react-toolbox/lib/dialog";
+import { TopBarDialog } from "./top-bar-dialog";
 import ShareDialogContent from "./share-dialog-content";
 import AboutDialogContent from "./about-dialog-content";
 import { log } from "../log";
@@ -34,6 +34,9 @@ interface IState {
 }
 
 export default class TopBar extends PureComponent<IProps, IState> {
+  private aboutButton = createRef<HTMLButtonElement>();
+  private shareButton = createRef<HTMLButtonElement>();
+
   constructor(props: IProps) {
     super(props);
     this.state = {
@@ -69,13 +72,13 @@ export default class TopBar extends PureComponent<IProps, IState> {
     return (
       <div className={css.topBar} data-test="top-bar">
         <FontIcon className={css.reload} value="refresh" data-test="top-bar-refresh" onClick={reloadPage} />
-        <span className={css.about} onClick={this.openAboutDialog} data-test="top-bar-about">About</span>
-        <span className={css.share} onClick={this.openShareDialog} data-test="top-bar-share">Share</span>
+        <button type="button" ref={this.aboutButton} className={css.about} onClick={this.openAboutDialog} data-test="top-bar-about">About</button>
+        <button type="button" ref={this.shareButton} className={css.share} onClick={this.openShareDialog} data-test="top-bar-share">Share</button>
 
-        <Dialog actions={[{ label: "Close", onClick: this.closeAboutDialog }]} active={aboutDialogOpen} onEscKeyDown={this.closeAboutDialog} onOverlayClick={this.closeAboutDialog} title="About: Tectonic Explorer" theme={aboutTheme} data-test="about-dialog">
+        <TopBarDialog active={aboutDialogOpen} onClose={this.closeAboutDialog} opener={this.aboutButton} title="About: Tectonic Explorer" theme={aboutTheme}>
           <AboutDialogContent />
-        </Dialog>
-        <Dialog actions={[
+        </TopBarDialog>
+        <TopBarDialog actions={[
           {
             label: "Copy Link",
             onClick() {
@@ -87,14 +90,10 @@ export default class TopBar extends PureComponent<IProps, IState> {
             onClick() {
               copyTextarea("iframe-string");
             }
-          },
-          {
-            label: "Close",
-            onClick: this.closeShareDialog
           }
-        ]} active={shareDialogOpen} onEscKeyDown={this.closeShareDialog} onOverlayClick={this.closeShareDialog} title="Share: Tectonic Explorer" theme={shareTheme}>
+        ]} active={shareDialogOpen} onClose={this.closeShareDialog} opener={this.shareButton} title="Share: Tectonic Explorer" theme={shareTheme}>
           <ShareDialogContent />
-        </Dialog>
+        </TopBarDialog>
       </div>
     );
   }
```

`test/components/top-bar.test.tsx`. Esc goes through `fireEvent` because react-toolbox's `Overlay` checks `event.which === 27`, which user-event leaves at 0. user-event dispatches through `@testing-library/dom` at the repo root (8.13, hoisted for `tecrock-table`'s `@testing-library/react` 12), while `@testing-library/react` 14 configures its own nested copy (9.3) with React's `act()` wrappers, so the file passes those wrappers to the root copy; without that, a run logs 11 "not wrapped in act(...)" warnings. `@testing-library/dom` must not be added to this package's `devDependencies`: npm would install it in the package's own `node_modules`, the import would resolve there, and user-event would still use the root copy. The arrow functions are written `async()`, as the package's `space-before-function-paren: never` rule requires. One `describe.each` runs the same five tests for About and for Share, so the two cannot drift apart; `tabs` is how many Tabs from the page reach each button, and `logAction` the event its button logs (R10), checked against the mocked `log`, which is cleared before each test. One test opens the dialog with `fireEvent.click`, which does not move focus, as a click in Safari does not, and checks that Esc still returns focus to the button. A Share-only `it.each` presses Enter on Copy Link and Copy HTML (react-toolbox's `Button` blurs itself on mouseup, so a mouse click leaves focus on the body in master too) and checks that the right textarea is fully selected, that `copy` is executed, and that focus stays in the dialog; `document.execCommand` is stubbed with `Object.defineProperty`, because jsdom has none, and deleted after each test. The overlay test also checks focus return, and a reopen test presses Enter again on the still-focused button while the closing dialog is still mounted and checks that the same dialog reopens with focus on Close. The trap test counts textareas among the dialog's tabbable elements, since Share's two textareas are in its Tab order. `openByKeyboard` waits for react-toolbox's `active` class rather than for focus inside the dialog: focus reaches Close at mount, 20ms before the trap and Esc engage, and a test that tabbed or pressed Esc in that window would fail.

```tsx
import React from "react";
import { fireEvent, getConfig, render, screen, waitFor, within } from "@testing-library/react";
import { configure } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TopBar from "../../src/components/top-bar";
import { log } from "../../src/log";

// user-event uses the hoisted @testing-library/dom, which @testing-library/react never configures, so pass it React's
// act() wrappers.
const { asyncWrapper, eventWrapper } = getConfig();
configure({ asyncWrapper, eventWrapper });

jest.mock("../../src/log", () => ({ log: jest.fn() }));

// react-toolbox's Overlay closes on a body keydown whose `which` is 27, which user-event does not set.
const pressEscape = () => fireEvent.keyDown(document.activeElement as Element, { key: "Escape", which: 27 });

// About comes first in the DOM, so Tab reaches it first and Share second.
describe.each([
  { name: "About", tabs: 1, logAction: "AboutDialogOpened" },
  { name: "Share", tabs: 2, logAction: "ShareDialogOpened" }
])("TopBar $name", ({ name, tabs, logAction }) => {
  beforeEach(() => {
    jest.mocked(log).mockClear();
  });

  const openByKeyboard = async(user: ReturnType<typeof userEvent.setup>) => {
    const trigger = screen.getByRole("button", { name });
    for (let i = 0; i < tabs; i++) {
      await user.tab();
    }
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog");
    // react-toolbox sets a dialog active 20ms after mounting it; the focus trap and Esc engage only then.
    await waitFor(() => expect(dialog).toHaveClass("active"));
    return { trigger, dialog };
  };

  it("opens a named, modal dialog from a keyboard-reachable button, with focus on Close", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { dialog } = await openByKeyboard(user);
    expect(dialog).toHaveAccessibleName(`${name}: Tectonic Explorer`);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    expect(log).toHaveBeenCalledWith({ action: logAction });
  });

  it("keeps Tab and Shift+Tab inside the dialog", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { dialog } = await openByKeyboard(user);
    const tabbable = dialog.querySelectorAll("a[href], button, textarea");
    expect(tabbable.length).toBeGreaterThan(1);
    for (let i = 0; i <= tabbable.length; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i <= tabbable.length; i++) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("closes on Esc and returns focus to its button", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { trigger } = await openByKeyboard(user);
    pressEscape();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes on the Close button and returns focus to its button", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { trigger } = await openByKeyboard(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("returns focus to its button after a click that did not focus it", async() => {
    render(<TopBar />);
    const trigger = screen.getByRole("button", { name });
    // fireEvent.click does not move focus, as a click in Safari does not.
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveClass("active"));
    pressEscape();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes on an overlay click and returns focus to its button", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { trigger } = await openByKeyboard(user);
    await user.click(screen.getByTestId("top-bar-dialog-overlay"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("focuses Close when reopened during the close animation", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    const { trigger, dialog } = await openByKeyboard(user);
    pressEscape();
    await waitFor(() => expect(dialog).not.toHaveClass("active"));
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(dialog).toHaveClass("active"));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
  });
});

describe("TopBar Share copy buttons", () => {
  afterEach(() => {
    delete (document as Partial<Document>).execCommand;
  });

  it.each([
    ["Copy Link", "#page-url"],
    ["Copy HTML", "#iframe-string"]
  ])("%s copies its textarea while focus stays in the dialog", async(label, selector) => {
    const execCommand = jest.fn();
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });
    const user = userEvent.setup();
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: "Share" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveClass("active"));
    within(dialog).getByRole("button", { name: label }).focus();
    await user.keyboard("{Enter}");
    const textarea = dialog.querySelector(selector) as HTMLTextAreaElement;
    expect(textarea.value).not.toBe("");
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([0, textarea.value.length]);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
```

## CI

`.github/workflows/ci.yml` is unchanged; no CI step is planned.

- **The HURR-70 failure cannot occur here.** It was in cypress-io/github-action v6's own wait for a dev server it starts (`start` and `wait-on` inputs) under the runner's Node 24. tectonic-explorer's v4 step passes neither input: it starts `npm start &` in an earlier step and sets `install: false`, so the action skips install, its legacy cache calls, server start and wait, and goes straight to `cypress run` (read from v4's `index.js`).
- **v4 still runs on the current runtime.** v4's bundled `dist/index.js` (the `v4` tag) was run under Node 24.14 with this workflow's inputs (`install: false`, `working-directory: ./packages/tecrock-simulation`, `browser: chrome`, `record: false`), against the root build served by `http-server dist` on port 8080 as CI's `npm start` does, with the smoke spec: it skipped install, ran Chrome, passed 16/16, wrote its outputs through `GITHUB_OUTPUT` and exited 0. GitHub keeps no runs for this repo (last push May 2025), so the runner-side steps (`actions/checkout@v1` and `@v2`, `actions/setup-node@v1` and `@v2` with Node 16, `codecov/codecov-action@v1`, `concord-consortium/s3-deploy-action@v1`) are first exercised by this branch's push. If the cypress job fails there, the workflow fix is its own commit after the three above, as HURR-70's v7 move was, and goes to Doug before it is made.
- **The S3 deploy uses 2021 access-key secrets**, not OIDC; see the resolved low-confidence question in requirements.md. A failed deploy goes to Doug as DEV-193's work.

## Verification

Run with Node 16 (`~/.nvm/versions/node/v16.15.1`), as CI does, from `packages/tecrock-simulation` unless noted.

- `npx jest`: the full suite (15 suites, 54 tests on master) plus the 28 new tests (12 license-copy, 16 top-bar: seven each for About and Share and two for Share's copy buttons). Measured: master plus the copy step alone, 16 suites and 66 tests pass and the root build succeeds; with all three steps, 17 suites and 82 tests pass and the root build succeeds.
- `npm run build` from the repo root (both packages, as CI's build job).
- Cypress `cypress/e2e/basic/smoke-test.js` against the dev server: its "verifies share" and "verifies about" tests select `[data-react-toolbox=dialog]`, `[data-react-toolbox=button]` and `section`, all kept. With the planned code it passed 16/16 (Electron, Cypress 13.6.3 binary).
- Lint: `npm run lint` crashes on master before reporting anything (`@typescript-eslint/prefer-optional-chain` needs `parserOptions.project`, which `.eslintrc` does not set; CI does not run lint). Lint the changed files with that rule off: `npx eslint --rule '@typescript-eslint/prefer-optional-chain: off' <files>`. The planned code is clean that way.
- Console output of `top-bar.test.tsx`: no `act()` warnings. The `componentWillReceiveProps` and `componentWillUpdate` deprecation warnings that remain come from react-toolbox's `ActivableRenderer` and `Overlay`, which the old `Dialog` used too.
- Mutations that the new tests catch, each tried on the planned code: a hardcoded year (2 failures), the copy removed from Share (5), a wrong MIT URL (2). In `top-bar.test.tsx`: the focus on Close removed (the open and reopen tests for both, 4), `autoFocus` on Close in place of that effect (the reopen test for both, 2), Share back to a `<span>` (all 9 Share tests), `FocusTrap` removed (the trap test for both, 2), the focus by ref on close removed (the Esc, Close, click-without-focus, overlay and reopen tests for both, 10), `FocusTrap`'s own restore in place of the ref (the click-without-focus test for both, 2), `aria-labelledby` removed (the name test for both, 2), the overlay's click handler removed (the overlay test for both, 2), Share's `onClose` a no-op (Share's Esc, Close, click-without-focus, overlay and reopen tests, 5), a button's `log` call removed (that button's open test, 1), the `copy` call removed (both copy tests, 2), Copy Link selecting the embed textarea (the Copy Link test, 1). `disableEnforceFocus` is not a trap-off mutation: in jsdom, MUI's sentinel elements still wrap Tab with it set, and all its tests pass.
- Browser, Chromium at 1280 × 800 on `?geode=true&planetWizard=true`: the unfocused top bar is pixel-identical to master's (About's text box is master's 40.8 × 20px, inside a 46.8px button whose padding the margins cancel); a keyboard-focused About shows all four sides of its ring inside the top bar; the About dialog with the old content is pixel-identical to master's when opened by mouse, and a mouse-opened dialog leaves Close unshaded (background transparent, not `:focus-visible`); Tab from About and Enter or Space open the dialog with focus on Close and Close's gray focus shade showing; Tab and Shift+Tab wrap; Esc closes it and returns focus to About with its outline; Share's label sits where master's does (its text ends 25px left of About's) with master's color, font and hover color, its keyboard-focused ring shows all four sides inside the top bar, Tab twice and Enter or Space open its dialog with focus on Close and its shade showing, Tab and Shift+Tab wrap through both textareas and the three buttons, Copy Link and Copy HTML put the link and the embed HTML on the clipboard with focus kept in the dialog, and Esc returns focus to Share with its ring; for both dialogs, Esc, Close (by Enter or by mouse) and an overlay click return focus to the opener, with the opener's ring after keyboard use and none after mouse use, and Copy Link's keyboard focus shade is unchanged; after the focus return moved to the `opener` ref, all ten open-and-close paths (keyboard with Esc or Close, mouse with Close, overlay or Esc, for each dialog) put focus on Close and return it to the opener, with `:focus-visible` after keyboard use and not after mouse use; after the focus on Close moved from `autoFocus` to the effect, keyboard and mouse opens of both dialogs put focus on Close (shaded after a keyboard open, transparent after a mouse open), and Esc followed at once by a reopen (Enter, or a click on the button) puts focus on Close again, never on the dialog box; the copy's paragraphs are 15px, the copyright line 13px and all four links underlined, in both dialogs; the app in a plain iframe shows About as a button.

## Open Questions

<!-- Implementation-focused questions only. Requirements questions go in requirements.md. -->

### RESOLVED: Judgment call: how does the dialog get its role, label and focus trap?
**Context**: react-toolbox's `Dialog` forwards no props to its root and takes the title only as a string.

**Options considered**:
- A) A local `TopBarDialog` built from react-toolbox's own `Overlay`, `Button`, `ActivableRenderer` and dialog theme, with MUI's `FocusTrap`.
- B) Migrate About and Share to MUI's `Dialog`, as the Model Stopped dialog uses.
- C) Keep react-toolbox's `Dialog` and set the attributes on its DOM after it mounts, with a hand-written trap.

**Decision**: A. It keeps decision 7's "no migration" and today's look (pixel-identical in Chromium), where B would restyle both dialogs and change the Cypress selectors, and C would edit DOM that React does not own and need its own trap code. Doug confirmed A on 2026-11-18, and geo-common.md's TE-10 row now describes it.

### RESOLVED: Judgment call: where does the dev dependency go in the commit order?
**Context**: Only the dialog step's tests need user-event.

**Options considered**:
- A) Its own commit just before the dialog step.
- B) First, before the copy step.

**Decision**: A. Each commit then builds and tests on its own, and the copy step does not carry a dependency it does not use.

### RESOLVED: Judgment call: how does Close take focus when the dialog opens?
**Context**: Decision 7 puts focus on Close on open. MUI's `FocusTrap` has no initial-focus option; it focuses its child, the container, unless focus is already inside.

**Options considered**:
- A) `autoFocus` on Close, which react-toolbox's `Button` passes to its DOM `<button>`.
- B) Close focused in an effect when `active` turns true, found through a ref on `<nav>`.

**Decision**: B. A fires only when Close mounts, and a dialog reopened during its 500ms close animation is still mounted, so `FocusTrap` focused the dialog box instead (found in review and confirmed in jsdom). B runs on every open; `FocusTrap`'s brief focus on the container in the same commit is never painted (checked in Chromium).

### RESOLVED: Judgment call: how does focus return to the opener?
**Context**: `FocusTrap` restores focus to the `relatedTarget` of the first focus inside the dialog, which is null when the opener never had focus, as after a click in Safari or Firefox on macOS.

**Options considered**:
- A) `TopBar` passes each button's ref as `opener`, and the dialog focuses it on close, with `FocusTrap`'s restore off.
- B) Keep `FocusTrap`'s restore.

**Decision**: A. B leaves focus on the page body after a mouse-opened dialog closes in those browsers, against R11 and R12; A returns it in every browser, and a test that opens without focusing the button fails under B.

### RESOLVED: Judgment call: does a mouse-opened dialog show Close as focused?
**Context**: react-toolbox shades a flat button on any `:focus`, so Close would look focused after a mouse click opens the dialog; decision 7 says opening by mouse shows no indicator.

**Options considered**:
- A) A rule in `top-bar-dialog.scss` that clears Close's shade when it is focused but not `:focus-visible`.
- B) Leave react-toolbox's styling, so Close is shaded after any open.

**Decision**: A, scoped to Close, so the dialog follows decision 7 and Copy Link and Copy HTML keep today's look (R14). Keyboard focus still shows the shade.

### RESOLVED: Judgment call: does Tab order follow the visual order of About and Share?
**Context**: Both buttons float right, About first in the DOM, so About is drawn at the right edge and Share to its left; Tab reaches About, then Share.

**Options considered**:
- A) Keep the DOM order.
- B) Reorder the top bar (for example as a flex row) so Tab runs Share then About, left to right.

**Decision**: A. The two are adjacent and both open a dialog, so the reversed pair does not change meaning or reachability, and B means re-laying out the top bar, beyond a 2-point story's scope and against R10's unchanged look.

### RESOLVED: Judgment call: how is the copyright line kept at 13px?
**Context**: `.dialog .body p` in `about-dialog.scss` outranks `.licenseCopy .copyright`.

**Options considered**:
- A) Make the line a `<div>`, as the old block was.
- B) Raise the selector's specificity or use `!important`.
- C) Flatten `about-dialog.scss` to `.body p`.

**Decision**: A. No rule competes for a `div`; B is brittle against source order, and C edits the dialog theme for the copy's sake.

## Self-Review

Roles: commit reviewer, test writer, operator, senior engineer, QA engineer, lint and style reviewer, accessibility reviewer, engineer implementing from the spec alone, PR diff reviewer, keyboard and screen-reader user, reader a year from now. The plan's code was rebuilt from the blocks above and run as described in Verification.

### Commit reviewer

#### RESOLVED: the embedded diffs carried git blob hashes
The before/after diffs were pasted with their `index <hash>..<hash>` lines, which go stale on any rebase. Removed; the diffs keep only their file headers and hunks.

---

### Senior engineer

#### RESOLVED: `ITopBarDialogAction` was exported with no outside user
Only `top-bar-dialog.tsx` names it; `top-bar.tsx` passes object literals. It is now a file-local interface.

---

### Operator

#### RESOLVED: is a CI change needed before the first push?
HURR-70 had to move from cypress-io/github-action v6 to v7. Running v4's own bundle green under Node 24 with this workflow's inputs (see CI) settled the question without a decision: `ci.yml` stays unchanged, and only a failure on the first push would add a workflow commit.

---

### QA engineer

#### RESOLVED: the top-bar tests logged act() warnings
user-event resolved the root `@testing-library/dom` 8.13, which `@testing-library/react` 14 never configures, so every user-event action ran outside `act()` and a run logged 11 "not wrapped in act(...)" warnings while still passing. `top-bar.test.tsx` now hands `@testing-library/react`'s `asyncWrapper` and `eventWrapper` to that copy; the run is free of act warnings, and removing the focus trap still fails its trap tests.

---

### Lint and style reviewer

#### RESOLVED: `top-bar.test.tsx` failed the package's lint rules
Its seven `async () =>` arrows broke `space-before-function-paren: never` (7 errors), contradicting Verification's "clean" claim. They are now `async() =>`, and the changed files lint clean with only `prefer-optional-chain` turned off.

---

### Keyboard and screen-reader user

#### RESOLVED: About's focus ring showed only its two sides
With `outline-offset: 2px`, the ring around the 20px-tall About button lay outside the 20px top bar: its top edge fell above the viewport and its bottom edge was painted under the simulation canvas (a red test ring showed nothing there), so keyboard focus showed as two 2px vertical bars. R10 now requires the indicator to lie inside the top bar, and the ring is inset, with 3px side padding cancelled by negative margins; the unfocused top bar stays pixel-identical and the focused ring shows on all four sides.

---

### Reader a year from now

#### RESOLVED: statements that only held on the day they were written
The user-event step justified 14.6.1 by the age of newer releases ("less than two weeks old"), which stops being true within days; it now rests on matching hurricane-model's lock. The CI section's list of runner-side actions left out `actions/checkout@v2` and the S3 deploy action, which `ci.yml` also uses.
