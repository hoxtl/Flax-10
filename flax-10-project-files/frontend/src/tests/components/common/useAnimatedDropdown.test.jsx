import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMenuStyle, getFilteredDropdownOptions, useAnimatedDropdownState } from "../../../components/common/AnimatedDropdown/useAnimatedDropdown";

const baseOptions = ["Alpha", { value: "beta", label: "Beta" }];

const groupedOptions = [
  { label: "Letters", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] },
  { label: "Numbers", options: [{ value: "1", label: "One" }] },
];

const renderUncontrolledDropdown = (overrides = {}) => {
  const props = {
    options: baseOptions,
    grouped: false,
    placeholder: "Pick one",
    value: "beta",
    onChange: vi.fn(),
    openOnHover: false,
    onOpenChange: vi.fn(),
    menuMaxHeight: 180,
    allowFlipUpward: false,
    ...overrides,
  };

  const hook = renderHook(() => useAnimatedDropdownState(props));
  return { ...hook, props };
};

const renderGroupedDropdown = (overrides = {}) => {
  const props = {
    options: groupedOptions,
    grouped: true,
    placeholder: "Choose",
    value: "missing",
    onChange: vi.fn(),
    openOnHover: true,
    isOpen: false,
    onOpenChange: vi.fn(),
    menuMaxHeight: 260,
    allowFlipUpward: true,
    ...overrides,
  };

  const hook = renderHook((hookProps) => useAnimatedDropdownState(hookProps), { initialProps: props });
  return { ...hook, props };
};

describe("useAnimatedDropdownState", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("uncontrolled dropdown", () => {
    it("exposes the selected label and toggles open state", () => {
      const { result, props } = renderUncontrolledDropdown();
      expect(result.current.selectedLabel).toBe("Beta");
      expect(result.current.query).toBe("");
      act(() => {
        result.current.setQuery("be");
        result.current.handleToggle();
      });
      expect(result.current.isOpen).toBe(true);
      expect(props.onOpenChange).toHaveBeenCalledWith(true);
      act(() => {
        result.current.setIsOpen((previous) => !previous);
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("ignores inside clicks but closes on outside targets", () => {
      const { result } = renderUncontrolledDropdown();
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
    });

    it("selects options, clears query, and supports filtering helpers", () => {
      const { result, props } = renderUncontrolledDropdown();
      act(() => {
        result.current.setQuery("alpha");
        result.current.handleSelect("Alpha");
      });
      expect(props.onChange).toHaveBeenCalledWith("Alpha");
      expect(result.current.query).toBe("");
      expect(result.current.isOpen).toBe(false);
      expect(getFilteredDropdownOptions(baseOptions, false, false, "ignored")).toBe(baseOptions);
      expect(getFilteredDropdownOptions(baseOptions, false, true, "be")).toEqual([{ value: "beta", label: "Beta" }]);
      expect(buildMenuStyle(false, false, { top: 10, left: 20, width: 30 }, 120)).toEqual({ maxHeight: 120 });
    });

    it("keeps hover handlers inert when hover-open is disabled", () => {
      const { result } = renderUncontrolledDropdown({ options: [{ value: "plain", label: "Plain" }], value: "plain" });
      act(() => {
        result.current.setIsOpen(true);
        result.current.handleMouseEnter();
        result.current.handleMouseLeave();
      });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.openUpward).toBe(false);
      expect(result.current.coords).toEqual({ top: 0, left: 0, width: 0 });
    });
  });

  describe("grouped dropdown", () => {
      it("does nothing while open but no container is mounted yet", () => {
        const add = vi.spyOn(window, "addEventListener");
        renderHook(() => useAnimatedDropdownState({
          options: groupedOptions,
          grouped: true,
          placeholder: "Choose",
          value: "missing",
          onChange: vi.fn(),
          openOnHover: true,
          isOpen: true,
          onOpenChange: vi.fn(),
          menuMaxHeight: 260,
          allowFlipUpward: true,
        }));
        expect(add).not.toHaveBeenCalledWith("scroll", expect.any(Function), true);
      });

      it("opens on hover when enabled", () => {
        vi.useFakeTimers();
        const onOpen = vi.fn();
        const { result } = renderGroupedDropdown({ onOpenChange: onOpen });
        act(() => { result.current.handleMouseEnter(); });
        expect(onOpen).toHaveBeenCalledWith(true);
      });

      it("flips the menu upward when space is tight at the bottom", () => {
        const { result, rerender, props } = renderGroupedDropdown();
        const box = { top: 500, bottom: 550, left: 40, width: 150 };
        const el = { getBoundingClientRect: () => box };
        act(() => { result.current.containerRef.current = el; result.current.handleMouseEnter(); });
        rerender({ ...props, isOpen: true });
        expect(result.current.openUpward).toBe(true);
        expect(result.current.coords).toEqual({ top: 500, left: 40, width: 150 });
      });

      it("manages scroll listeners while the menu is open", () => {
        const add = vi.spyOn(window, "addEventListener");
        const remove = vi.spyOn(window, "removeEventListener");
        const { result, rerender, props } = renderGroupedDropdown();
        const box = { top: 120, bottom: 160, left: 40, width: 150 };
        act(() => {
          result.current.containerRef.current = { getBoundingClientRect: () => box };
        });
        rerender({ ...props, isOpen: true });
        expect(add).toHaveBeenCalledWith("scroll", expect.any(Function), true);
        rerender({ ...props, isOpen: false });
        expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function), true);
      });

    it("filters grouped options and builds upward menu styles", () => {
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
      });
    });
  });
});

function fireMouseDown(target) {
  act(() => {
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  });
}
