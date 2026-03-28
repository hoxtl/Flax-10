import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMultiSelectDropdown } from "../../../components/ui/multi_select_dropdown/useMultiSelectDropdown";

describe("useMultiSelectDropdown (integration)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseArgs = (overrides = {}) => ({
    align: "left",
    countLabel: "items",
    hideCheckboxForValues: [],
    isOpen: undefined,
    itemClassName: "",
    menuClassName: "",
    onChange: vi.fn(),
    onOpenChange: vi.fn(),
    openOnHover: false,
    options: [{ value: "a", label: "Alpha" }],
    placeholder: "Pick",
    showCheckboxes: true,
    value: [],
    variant: "default",
    ...overrides,
  });

  it("manages menu open state with the real open-state hook", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useMultiSelectDropdown(baseArgs({ onOpenChange })));
    expect(result.current.menuOpen).toBe(false);
    act(() => result.current.updateOpen(true));
    expect(result.current.menuOpen).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("keeps menu state aligned with a controlled isOpen prop", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useMultiSelectDropdown(baseArgs({ isOpen: open })),
      { initialProps: { open: false } },
    );
    expect(result.current.menuOpen).toBe(false);
    rerender({ open: true });
    expect(result.current.menuOpen).toBe(true);
  });

  it("emits changes from toggle and pill removal using shared toggle logic", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) =>
        useMultiSelectDropdown(
          baseArgs({
            onChange,
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ],
            value,
          }),
        ),
      { initialProps: { value: ["a"] } },
    );
    act(() => result.current.onToggle("b"));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    rerender({ value: ["a", "b"] });
    act(() => result.current.onRemovePill("a"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
    rerender({ value: ["b"] });
    act(() => result.current.onToggle(""));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("exposes module variant metadata and multi-select labels", () => {
    const { result } = renderHook(() =>
      useMultiSelectDropdown(
        baseArgs({
          value: ["a", "b"],
          variant: "modules",
        }),
      ),
    );
    expect(result.current.isModuleVariant).toBe(true);
    expect(result.current.triggerLabel).toBe("2 items");
  });
});
