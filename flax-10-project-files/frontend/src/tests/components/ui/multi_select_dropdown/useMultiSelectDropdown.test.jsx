/*
 * Tests for the multi-select dropdown state hook.
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../components/ui/multi_select_dropdown/useDropdownInteractions", () => ({
  createHoverHandlers: vi.fn((openOnHover, hoverTimeoutRef, updateOpen) => ({
    onMouseEnter: () => {
      if (openOnHover) updateOpen(true);
      hoverTimeoutRef.current = "hovered";
    },
    onMouseLeave: vi.fn(),
  })),
  useCloseOnOutsideClick: vi.fn(),
  useDropdownHoverTimeout: vi.fn(() => ({ current: null })),
  useDropdownRootRef: vi.fn(() => ({ current: null })),
}));

vi.mock("../../../../components/ui/multi_select_dropdown/useDropdownOpenState", () => ({
  useDropdownOpenState: vi.fn((isOpen, onOpenChange) => ({
    isOpen: Boolean(isOpen),
    updateOpen: (next) => {
      const resolved = typeof next === "function" ? next(Boolean(isOpen)) : next;
      onOpenChange?.(resolved);
      return resolved;
    },
  })),
}));

import { useMultiSelectDropdown } from "../../../../components/ui/multi_select_dropdown/useMultiSelectDropdown";

const baseDropdownHookProps = {
  align: "left",
  countLabel: "items",
  hideCheckboxForValues: [],
  isOpen: false,
  itemClassName: "",
  menuClassName: "",
  onChange: vi.fn(),
  onOpenChange: vi.fn(),
  openOnHover: false,
  options: ["Alpha", { value: "beta", label: "Beta" }],
  placeholder: "Pick",
  showCheckboxes: true,
  value: ["Alpha"],
  variant: "default",
};

function renderDropdownHook(overrides = {}) {
  return renderHook(() => useMultiSelectDropdown({ ...baseDropdownHookProps, ...overrides }));
}

describe("useMultiSelectDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds normalised options and selected values", () => {
    const { result } = renderDropdownHook();
    expect(result.current.optionsList).toEqual([
      { value: "Alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
    ]);
    expect(result.current.selected).toEqual(["Alpha"]);
    expect(result.current.selectedSet.has("Alpha")).toBe(true);
    expect(result.current.isModuleVariant).toBe(false);
  });

  it("builds a single trigger label from the selected value", () => {
    const { result } = renderDropdownHook();
    expect(result.current.triggerLabel).toBe("Alpha");
  });

  it("toggles values and removes pills through onChange", () => {
    const onChange = vi.fn();
    const { result } = renderDropdownHook({
      isOpen: true,
      onChange,
      onOpenChange: vi.fn(),
      openOnHover: true,
      options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }],
      showCheckboxes: false,
      value: ["a"],
      variant: "modules",
    });
    result.current.onToggle("b");
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    result.current.onRemovePill("a");
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("updates hover state for the module variant", () => {
    const { result } = renderDropdownHook({ isOpen: true, openOnHover: true, variant: "modules" });
    result.current.hoverHandlers.onMouseEnter();
    expect(result.current.hoverTimeoutRef.current).toBe("hovered");
    expect(result.current.isModuleVariant).toBe(true);
  });
});
