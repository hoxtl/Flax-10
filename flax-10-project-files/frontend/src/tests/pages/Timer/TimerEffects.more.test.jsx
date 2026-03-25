import { describe, expect, it, vi, beforeEach } from "vitest";
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
    vi.useRealTimers();
  });
});
