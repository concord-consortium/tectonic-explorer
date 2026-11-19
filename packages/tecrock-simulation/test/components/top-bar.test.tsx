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
