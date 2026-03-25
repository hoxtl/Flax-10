import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";

import {
  useFocusFullscreen,
  useTimerDocumentTitle,
  useTimerShortcuts,
  useTransientFlags,
} from "../../../pages/Timer/hooks/useTimerPageEffects";

describe("timer effect extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = "StudyFlax";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores default title when timer is inactive or paused", () => {
    const inactive = renderHook(() => useTimerDocumentTitle({ isActive: false, isPaused: false, timeLeft: 20, mode: "work" }));
    expect(document.title).toBe("StudyFlax");
    inactive.unmount();

    document.title = "custom";
    const paused = renderHook(() => useTimerDocumentTitle({ isActive: true, isPaused: true, timeLeft: 20, mode: "work" }));
    expect(document.title).toBe("custom");
    paused.unmount();
    expect(document.title).toBe("StudyFlax");
  });

  it("shows the work-mode timer title", () => {
    renderHook(() => useTimerDocumentTitle({ isActive: true, isPaused: false, timeLeft: 125, mode: "work" }));
    expect(document.title).toContain("02:05");
    expect(document.title).toContain("🔥");
  });

  it("ignores text inputs and toggles timer state from keyboard shortcuts", () => {
    const togglePause = vi.fn();
    const setIsActive = vi.fn();
    const resetTimer = vi.fn();
    const setShowShortcuts = vi.fn((updater) => updater(false));
    const setFocusMode = vi.fn();
    const openFocusMode = vi.fn();
    const closeOverlays = vi.fn();

    renderHook(() => useTimerShortcuts({
      t: { isActive: false, togglePause, setIsActive, resetTimer },
      setShowShortcuts,
      setFocusMode,
      openFocusMode,
      closeOverlays,
      focusMode: true,
    }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: " " });
    expect(setIsActive).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "f" });
    fireEvent.keyDown(window, { key: "?" });
    fireEvent.keyDown(window, { key: "x" });

    expect(setIsActive).toHaveBeenCalledWith(true);
    expect(setFocusMode).toHaveBeenCalledWith(false);
    expect(setShowShortcuts).toHaveBeenCalled();
    expect(openFocusMode).not.toHaveBeenCalled();
    expect(closeOverlays).not.toHaveBeenCalled();
  });

  it("clears transient flags and exits fullscreen when focus mode ends", async () => {
    vi.useFakeTimers();
    const setShowFocusTransition = vi.fn();
    const setShowPageSkeleton = vi.fn();

    renderHook(() => useTransientFlags({
      showFocusTransition: true,
      setShowFocusTransition,
      showPageSkeleton: true,
      setShowPageSkeleton,
      minFocusSkeletonMs: 150,
    }));

    act(() => {
      vi.advanceTimersByTime(151);
    });
    expect(setShowPageSkeleton).toHaveBeenCalledWith(false);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(setShowFocusTransition).toHaveBeenCalledWith(false);

    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitFullscreen;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });

    renderHook(() => useFocusFullscreen({
      focusMode: false,
      focusFullscreenPending: true,
      setFocusFullscreenPending: setShowPageSkeleton,
    }));
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it("swallows fullscreen request and exit failures", async () => {
    vi.useFakeTimers();

    const requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));
    const exitFullscreen = vi.fn().mockRejectedValue(new Error("exit denied"));
    document.documentElement.requestFullscreen = requestFullscreen;
    document.exitFullscreen = exitFullscreen;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });

    renderHook(() => useFocusFullscreen({
      focusMode: true,
      focusFullscreenPending: true,
      setFocusFullscreenPending: vi.fn(),
    }));

    await act(async () => {
      vi.advanceTimersByTime(221);
      await Promise.resolve();
    });
    expect(requestFullscreen).toHaveBeenCalled();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });

    renderHook(() => useFocusFullscreen({
      focusMode: false,
      focusFullscreenPending: false,
      setFocusFullscreenPending: vi.fn(),
    }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it("does not start timers or fullscreen work when the flags are inactive", () => {
    vi.useFakeTimers();
    const setShowFocusTransition = vi.fn();
    const setShowPageSkeleton = vi.fn();
    renderHook(() => useTransientFlags({
      showFocusTransition: false,
      setShowFocusTransition,
      showPageSkeleton: false,
      setShowPageSkeleton,
      minFocusSkeletonMs: 150,
    }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(setShowFocusTransition).not.toHaveBeenCalled();
    expect(setShowPageSkeleton).not.toHaveBeenCalled();

    const requestFullscreen = vi.fn();
    document.documentElement.requestFullscreen = requestFullscreen;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });

    renderHook(() => useFocusFullscreen({
      focusMode: true,
      focusFullscreenPending: true,
      setFocusFullscreenPending: vi.fn(),
    }));
    expect(requestFullscreen).not.toHaveBeenCalled();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    document.exitFullscreen = vi.fn();

    renderHook(() => useFocusFullscreen({
      focusMode: true,
      focusFullscreenPending: false,
      setFocusFullscreenPending: vi.fn(),
    }));
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });

  it("returns early when fullscreen APIs are unavailable", () => {
    vi.useFakeTimers();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    document.documentElement.requestFullscreen = undefined;

    renderHook(() => useFocusFullscreen({
      focusMode: true,
      focusFullscreenPending: true,
      setFocusFullscreenPending: vi.fn(),
    }));

    act(() => {
      vi.advanceTimersByTime(221);
    });

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.body,
    });
    document.exitFullscreen = undefined;

    renderHook(() => useFocusFullscreen({
      focusMode: false,
      focusFullscreenPending: false,
      setFocusFullscreenPending: vi.fn(),
    }));
  });
});
