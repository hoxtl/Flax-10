import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMenuStyle, getFilteredDropdownOptions, useAnimatedDropdownState } from "../../../components/common/AnimatedDropdown/useAnimatedDropdown";

describe("useAnimatedDropdownState", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("handles uncontrolled dropdown state, selection, filtering helpers, and outside clicks", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const options = ["Alpha", { value: "beta", label: "Beta" }];

    const { result } = renderHook(() =>
      useAnimatedDropdownState({
        options,
        grouped: false,
        placeholder: "Pick one",
        value: "beta",
        onChange,
        openOnHover: false,
        onOpenChange,
        menuMaxHeight: 180,
        allowFlipUpward: false,
      }),
    );

    expect(result.current.selectedLabel).toBe("Beta");
    expect(result.current.query).toBe("");

    act(() => {
      result.current.setQuery("be");
      result.current.handleToggle();
    });

    expect(result.current.isOpen).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    act(() => {
      result.current.setIsOpen((previous) => !previous);
    });

    expect(result.current.isOpen).toBe(false);

    const container = document.createElement("div");
    const inside = document.createElement("button");
    const menu = document.createElement("div");
    const menuChild = document.createElement("button");
    container.appendChild(inside);
    menu.appendChild(menuChild);
    document.body.append(container, menu);

    act(() => {
      result.current.containerRef.current = container;
      result.current.menuRef.current = menu;
      result.current.setIsOpen(true);
    });

    fireMouseDown(inside);
    expect(result.current.isOpen).toBe(true);

    fireMouseDown(menuChild);
    expect(result.current.isOpen).toBe(true);

    fireMouseDown(document.body);
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.setQuery("alpha");
      result.current.handleSelect("Alpha");
    });

    expect(onChange).toHaveBeenCalledWith("Alpha");
    expect(result.current.query).toBe("");
    expect(result.current.isOpen).toBe(false);

    expect(getFilteredDropdownOptions(options, false, false, "ignored")).toBe(options);
    expect(getFilteredDropdownOptions(options, false, true, "be")).toEqual([{ value: "beta", label: "Beta" }]);
    expect(buildMenuStyle(false, false, { top: 10, left: 20, width: 30 }, 120)).toEqual({ maxHeight: 120 });
  });

  it("keeps hover handlers inert when hover-open is disabled and supports missing optional props", () => {
    const { result } = renderHook(() =>
      useAnimatedDropdownState({
        options: [{ value: "plain", label: "Plain" }],
        grouped: false,
        placeholder: "Fallback",
        value: "plain",
        onChange: vi.fn(),
        openOnHover: false,
      }),
    );

    act(() => {
      result.current.setIsOpen(true);
      result.current.handleMouseEnter();
      result.current.handleMouseLeave();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.openUpward).toBe(false);
    expect(result.current.coords).toEqual({ top: 0, left: 0, width: 0 });
  });

  it("handles grouped options, hover interactions, controlled open state, and upward positioning", () => {
    vi.useFakeTimers();

    const onOpenChange = vi.fn();
    const groupedOptions = [
      { label: "Letters", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] },
      { label: "Numbers", options: [{ value: "1", label: "One" }] },
    ];

    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useAnimatedDropdownState({
          options: groupedOptions,
          grouped: true,
          placeholder: "Choose",
          value: "missing",
          onChange: vi.fn(),
          openOnHover: true,
          isOpen,
          onOpenChange,
          menuMaxHeight: 260,
          allowFlipUpward: true,
        }),
      { initialProps: { isOpen: false } },
    );

    expect(result.current.selectedLabel).toBe("Choose");

    act(() => {
      result.current.handleToggle();
    });
    expect(result.current.isOpen).toBe(false);

    const container = document.createElement("div");
    container.getBoundingClientRect = () => ({ top: 500, bottom: 550, left: 40, width: 150 });

    act(() => {
      result.current.containerRef.current = container;
      result.current.handleMouseEnter();
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender({ isOpen: true });

    expect(result.current.openUpward).toBe(true);
    expect(result.current.coords).toEqual({ top: 500, left: 40, width: 150 });
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), true);
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    act(() => {
      result.current.handleMouseLeave();
      vi.runAllTimers();
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender({ isOpen: false });
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    expect(getFilteredDropdownOptions(groupedOptions, true, true, "be")).toEqual([
      { label: "Letters", options: [{ value: "b", label: "Beta" }] },
    ]);

    const upwardStyle = buildMenuStyle(true, true, { top: 500, left: 40, width: 150 }, 200);
    expect(upwardStyle).toMatchObject({
      position: "fixed",
      top: "auto",
      bottom: window.innerHeight - 500 + 4,
      left: 40,
      minWidth: 150,
      marginBottom: 4,
      maxHeight: 200,
    });
  });
});

function fireMouseDown(target) {
  act(() => {
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  });
}
