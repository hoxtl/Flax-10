import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../components/ui/multi_select_dropdown/useDropdownInteractions", () => ({
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

vi.mock("../../../components/ui/multi_select_dropdown/useDropdownOpenState", () => ({
  useDropdownOpenState: vi.fn((isOpen, onOpenChange) => ({
    isOpen: Boolean(isOpen),
    updateOpen: (next) => {
      const resolved = typeof next === "function" ? next(Boolean(isOpen)) : next;
      onOpenChange?.(resolved);
      return resolved;
    },
  })),
}));

import { useMultiSelectDropdown } from "../../../components/ui/multi_select_dropdown/useMultiSelectDropdown";

describe("useMultiSelectDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds normalized options, selected values, and a single trigger label", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMultiSelectDropdown({
        align: "left",
        countLabel: "items",
        hideCheckboxForValues: [],
        isOpen: false,
        itemClassName: "",
        menuClassName: "",
        onChange,
        onOpenChange: vi.fn(),
        openOnHover: false,
        options: ["Alpha", { value: "beta", label: "Beta" }],
        placeholder: "Pick",
        showCheckboxes: true,
        value: ["Alpha"],
        variant: "default",
      }),
    );

    expect(result.current.optionsList).toEqual([
      { value: "Alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
    ]);
    expect(result.current.selected).toEqual(["Alpha"]);
    expect(result.current.selectedSet.has("Alpha")).toBe(true);
    expect(result.current.triggerLabel).toBe("Alpha");
    expect(result.current.isModuleVariant).toBe(false);
  });

  it("toggles values and removes pills through onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMultiSelectDropdown({
        align: "left",
        countLabel: "items",
        hideCheckboxForValues: [],
        isOpen: true,
        itemClassName: "",
        menuClassName: "",
        onChange,
        onOpenChange: vi.fn(),
        openOnHover: true,
        options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }],
        placeholder: "Pick",
        showCheckboxes: false,
        value: ["a"],
        variant: "modules",
      }),
    );

    result.current.onToggle("b");
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);

    result.current.onRemovePill("a");
    expect(onChange).toHaveBeenCalledWith([]);

    result.current.hoverHandlers.onMouseEnter();
    expect(result.current.hoverTimeoutRef.current).toBe("hovered");
    expect(result.current.isModuleVariant).toBe(true);
  });
});
