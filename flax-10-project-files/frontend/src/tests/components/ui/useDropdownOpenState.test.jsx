import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDropdownOpenState } from "../../../components/ui/multi_select_dropdown/useDropdownOpenState";

describe("useDropdownOpenState", () => {
  it("keeps internal state when uncontrolled and supports functional updates", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useDropdownOpenState(undefined, onOpenChange));
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.updateOpen(true));
    expect(result.current.isOpen).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    act(() => result.current.updateOpen((open) => !open));
    expect(result.current.isOpen).toBe(false);
  });

  it("reflects forced open state without mutating internal state", () => {
    const { result, rerender } = renderHook(
      ({ forced }) => useDropdownOpenState(forced, undefined),
      { initialProps: { forced: true } },
    );
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.updateOpen(false));
    expect(result.current.isOpen).toBe(true);
    rerender({ forced: false });
    expect(result.current.isOpen).toBe(false);
  });

  it("allows updates when onOpenChange is omitted", () => {
    const { result } = renderHook(() => useDropdownOpenState(undefined, undefined));
    act(() => result.current.updateOpen(true));
    expect(result.current.isOpen).toBe(true);
  });
});
