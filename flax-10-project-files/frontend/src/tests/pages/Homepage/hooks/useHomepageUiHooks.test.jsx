import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHomepageModals } from "../../../../pages/Homepage/hooks/useHomepageModals";
import { useHomepageDisplayName } from "../../../../pages/Homepage/hooks/useHomepageDisplayName";
import { useHomepageToast } from "../../../../pages/Homepage/hooks/useHomepageToast";

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

  it("normalizes a fallback toast without an action handler and clears on unmount", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { result, unmount } = renderHook(() => useHomepageToast(null));

    act(() => {
      result.current.showToast("Draft saved", { actionLabel: "Undo", onAction: "not-a-function" });
    });

    expect(result.current.fallbackToast).toEqual({
      message: "Draft saved",
      actionLabel: "Undo",
      onAction: null,
    });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("uses the default fallback duration when durationMs is not finite", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHomepageToast(null));

    act(() => {
      result.current.showToast("Queued", { durationMs: Number.NaN });
    });

    expect(result.current.fallbackToast?.message).toBe("Queued");
    act(() => {
      vi.advanceTimersByTime(3199);
    });
    expect(result.current.fallbackToast?.message).toBe("Queued");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.fallbackToast).toBeNull();
    vi.useRealTimers();
  });
});
