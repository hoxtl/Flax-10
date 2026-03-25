import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import SearchBar from "../../../components/common/SearchBar/SearchBar";
import { registerTarget, unregisterTarget } from "../../../components/common/SearchBar/slashShortcutRegistry";

vi.mock("../../../components/common/TextInput/TextInput", () => ({
  default: React.forwardRef(function MockTextInput({ leading, inputClassName, className, ...props }, ref) {
    return (
      <div data-testid="text-input-shell" className={className}>
        <span data-testid="leading">{leading}</span>
        <input ref={ref} data-testid="search-input" className={inputClassName} {...props} />
      </div>
    );
  }),
}));

function makeVisibleInput(top = 0, left = 0) {
  const input = document.createElement("input");
  document.body.appendChild(input);
  Object.defineProperty(input, "offsetParent", { configurable: true, get: () => document.body });
  Object.defineProperty(input, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ top, left, width: 1, height: 1, bottom: top + 1, right: left + 1 }),
  });
  return input;
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders placeholder hints, merges refs, and forwards changes", () => {
    const onChange = vi.fn();
    const ref = React.createRef();

    render(
      <SearchBar
        value="abc"
        onChange={onChange}
        className="outer"
        inputClassName="inner"
        ref={ref}
      />,
    );

    const input = screen.getByTestId("search-input");
    expect(input).toHaveAttribute("placeholder", "Search... ( / )");
    expect(screen.getByTestId("text-input-shell").className).toContain("outer");
    expect(input.className).toContain("inner");
    expect(ref.current).toBe(input);

    fireEvent.change(input, { target: { value: "updated" } });
    expect(onChange).toHaveBeenCalledWith("updated");
  });

  it("supports callback refs, preserves slash placeholders, and can hide the shortcut hint", () => {
    const ref = vi.fn();

    const { rerender } = render(
      <SearchBar
        ref={ref}
        placeholder="Search / commands"
        value=""
        enableSlashShortcut={false}
      />,
    );

    expect(screen.getByTestId("search-input")).toHaveAttribute("placeholder", "Search / commands");
    expect(ref).toHaveBeenCalledWith(screen.getByTestId("search-input"));

    rerender(<SearchBar placeholder="Look up" showShortcutHint={false} value="" />);
    expect(screen.getByTestId("search-input")).toHaveAttribute("placeholder", "Look up");
  });

  it("focuses the highest visible registered target on slash and ignores non-eligible events", () => {
    const high = makeVisibleInput(10, 40);
    const low = makeVisibleInput(120, 0);
    high.focus = vi.fn();
    low.focus = vi.fn();

    registerTarget(low);
    registerTarget(high);

    const preventDefault = vi.fn();
    fireEvent.keyDown(document, { key: "/", preventDefault, target: document.body });
    expect(high.focus).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "a", target: document.body });
    fireEvent.keyDown(document, { key: "/", metaKey: true, target: document.body });
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    fireEvent.keyDown(textarea, { key: "/" });
    expect(low.focus).not.toHaveBeenCalled();

    unregisterTarget(low);
    unregisterTarget(high);
  });

  it("breaks ties by the left-most visible target when items share the same top position", () => {
    const left = makeVisibleInput(10, 20);
    const right = makeVisibleInput(10, 90);
    left.focus = vi.fn();
    right.focus = vi.fn();

    registerTarget(right);
    registerTarget(left);

    fireEvent.keyDown(document, { key: "/", target: document.body });
    expect(left.focus).toHaveBeenCalledTimes(1);
    expect(right.focus).not.toHaveBeenCalled();

    unregisterTarget(left);
    unregisterTarget(right);
  });

  it("ignores hidden, disconnected, disabled, and readOnly targets and cleans up on unmount", () => {
    const hidden = makeVisibleInput();
    Object.defineProperty(hidden, "offsetParent", { configurable: true, get: () => null });
    hidden.focus = vi.fn();

    const disabled = makeVisibleInput();
    disabled.disabled = true;
    disabled.focus = vi.fn();

    const readonly = makeVisibleInput();
    readonly.readOnly = true;
    readonly.focus = vi.fn();

    const detached = document.createElement("input");
    detached.focus = vi.fn();

    registerTarget(hidden);
    registerTarget(disabled);
    registerTarget(readonly);
    registerTarget(detached);

    fireEvent.keyDown(document, { key: "/", target: document.body });
    expect(hidden.focus).not.toHaveBeenCalled();
    expect(disabled.focus).not.toHaveBeenCalled();
    expect(readonly.focus).not.toHaveBeenCalled();
    expect(detached.focus).not.toHaveBeenCalled();

    unregisterTarget(hidden);
    unregisterTarget(disabled);
    unregisterTarget(readonly);
    unregisterTarget(detached);

    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<SearchBar value="" enableSlashShortcut />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
