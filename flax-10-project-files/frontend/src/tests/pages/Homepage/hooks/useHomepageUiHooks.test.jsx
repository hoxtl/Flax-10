import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHomepageModals } from "../../../../pages/homepage/hooks/useHomepageModals";
import { useHomepageDisplayName } from "../../../../pages/homepage/hooks/useHomepageDisplayName";
import { useHomepageToast } from "../../../../pages/homepage/hooks/useHomepageToast";

describe("Homepage UI hooks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes homepage modal state with defaults", () => {
    const { result } = renderHook(() => useHomepageModals(true, { id: 1 }));
    expect(result.current.showCreateTaskModal).toBe(true);
    expect(result.current.planTimelineReadItem).toEqual({ id: 1 });
    expect(result.current.showCreateListFromTask).toBe(false);
  });

  it("updates individual homepage modal states", () => {
    const { result } = renderHook(() => useHomepageModals(false, null));
    act(() => {
      result.current.setShowCreateTaskModal(true);
      result.current.setLastCreatedListId(10);
      result.current.setSelectedModulePill("CS");
    });
    expect(result.current.showCreateTaskModal).toBe(true);
    expect(result.current.lastCreatedListId).toBe(10);
    expect(result.current.selectedModulePill).toBe("CS");
  });

  it("prefers first name for the homepage display name, then username, then null", () => {
    localStorage.setItem("user", JSON.stringify({ first_name: " Alice ", username: "aliceb" }));
    const first = renderHook(() => useHomepageDisplayName());
    expect(first.result.current).toBe("Alice");

    localStorage.setItem("user", JSON.stringify({ first_name: "   ", username: "aliceb" }));
    const second = renderHook(() => useHomepageDisplayName());
    expect(second.result.current).toBe("aliceb");

    localStorage.setItem("user", "not-json");
    const third = renderHook(() => useHomepageDisplayName());
    expect(third.result.current).toBeNull();
  });

  it("uses the provided toast function directly when available", () => {
    const toastFn = vi.fn();
    const { result } = renderHook(() => useHomepageToast(toastFn));

    act(() => {
      result.current.showToast("Saved");
    });

    expect(toastFn).toHaveBeenCalledWith("Saved");
    expect(result.current.fallbackToast).toBeNull();
  });

  it("uses toastApi.showToast when provided as an object", () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useHomepageToast({ showToast }));

    act(() => {
      result.current.showToast("Updated", { actionLabel: "Undo" });
    });

    expect(showToast).toHaveBeenCalledWith("Updated", { actionLabel: "Undo" });
  });

  it("falls back to local toast state and auto-clears after the duration", () => {
    vi.useFakeTimers();
    const onAction = vi.fn();
    const { result } = renderHook(() => useHomepageToast(null));

    act(() => {
      result.current.showToast("Saved", { actionLabel: "Undo", onAction, durationMs: 25 });
    });

    expect(result.current.fallbackToast).toEqual({
      message: "Saved",
      actionLabel: "Undo",
      onAction,
    });

    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(result.current.fallbackToast).toBeNull();
    vi.useRealTimers();
  });
});
