import React, { useState } from "react";
import { act, fireEvent, getConfig, render, screen, waitFor, within } from "@testing-library/react";
import { configure } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TopBar from "../../src/components/top-bar";
import { RelativeMotionStoppedDialog } from "../../src/components/relative-motion-stopped-dialog";
import { log } from "../../src/log";
import { removeURLParamsAndReload } from "../../src/utils";

// user-event uses the hoisted @testing-library/dom, which @testing-library/react never configures, so pass it React's
// act() wrappers.
const { asyncWrapper, eventWrapper } = getConfig();
configure({ asyncWrapper, eventWrapper });

jest.mock("../../src/log", () => ({ log: jest.fn() }));
jest.mock("../../src/utils", () => ({ ...jest.requireActual("../../src/utils"), removeURLParamsAndReload: jest.fn() }));

// react-toolbox's Overlay closes on a body keydown whose `which` is 27, which user-event does not set.
const pressEscape = () => fireEvent.keyDown(document.activeElement as Element, { key: "Escape", which: 27 });

describe("TopBar Reload", () => {
  it("is the first Tab stop, named Reload with a matching tooltip, and reloads on Enter", async() => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.tab();
    const reload = screen.getByRole("button", { name: "Reload" });
    expect(reload).toHaveFocus();
    expect(reload).toHaveAttribute("title", "Reload");
    await user.keyboard("{Enter}");
    expect(log).toHaveBeenCalledWith({ action: "ReloadIconClicked" });
    await waitFor(() => expect(removeURLParamsAndReload).toHaveBeenCalledWith(["geode", "rocks"]));
  });
});

// Reload comes first in the DOM, then About, then Share.
describe.each([
  { name: "About", tabs: 2, logAction: "AboutDialogOpened" },
  { name: "Share", tabs: 3, logAction: "ShareDialogOpened" }
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

  it.each([
    ["Esc", pressEscape],
    ["Close", () => fireEvent.click(screen.getByRole("button", { name: "Close" }))]
  ])("returns focus to its button on %s after a click that did not focus it", async(_how, close) => {
    render(<TopBar />);
    const trigger = screen.getByRole("button", { name });
    // fireEvent.click does not move focus, as a click in Safari does not.
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveClass("active"));
    close();
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

describe("TopBar About with Model Stopped opened over it", () => {
  let setStopped: (shown: boolean) => void = () => undefined;
  const App = () => {
    const [stopped, setStoppedState] = useState(false);
    setStopped = setStoppedState;
    return <><TopBar />{ stopped && <RelativeMotionStoppedDialog onClose={() => setStoppedState(false)} /> }</>;
  };

  it("lets focus go to Model Stopped, and Esc closes only Model Stopped", async() => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "About" }));
    const about = await screen.findByRole("dialog");
    await waitFor(() => expect(about).toHaveClass("active"));
    act(() => setStopped(true));
    const stopped = await screen.findByRole("dialog", { name: "Model Stopped" });
    await waitFor(() => expect(about.parentElement).toHaveAttribute("aria-hidden", "true"));
    expect(about).not.toContainElement(document.activeElement as HTMLElement);
    expect(stopped.closest(".MuiDialog-root")).toContainElement(document.activeElement as HTMLElement);
    pressEscape();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Model Stopped" })).not.toBeInTheDocument());
    expect(about).toBeInTheDocument();
    expect(about).toHaveClass("active");
    await waitFor(() => expect(within(about).getByRole("button", { name: "Close" })).toHaveFocus());
  });
});
