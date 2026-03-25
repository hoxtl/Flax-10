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

  it("ignores keyboard shortcuts when typing in text inputs", () => {
    const setIsActive = vi.fn();
    renderHook(() => useTimerShortcuts({
      t: { isActive: false, setIsActive, togglePause: vi.fn(), resetTimer: vi.fn() },
      setShowShortcuts: vi.fn(), setFocusMode: vi.fn(), openFocusMode: vi.fn(), closeOverlays: vi.fn(),
    }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: " " });
    expect(setIsActive).not.toHaveBeenCalled();
    input.remove();
  });

  it("toggles timer state and overlays from keyboard shortcuts", () => {
    const setIsActive = vi.fn();
    const setShowShortcuts = vi.fn((updater) => updater(false));
    const setFocusMode = vi.fn();

    renderHook(() => useTimerShortcuts({
      t: { isActive: false, setIsActive, togglePause: vi.fn(), resetTimer: vi.fn() },
      setShowShortcuts, setFocusMode, openFocusMode: vi.fn(), closeOverlays: vi.fn(),
    }));

    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "f" });
    fireEvent.keyDown(window, { key: "?" });

    expect(setIsActive).toHaveBeenCalledWith(true);
    expect(setFocusMode).toHaveBeenCalledWith(false);
    expect(setShowShortcuts).toHaveBeenCalled();
  });

  it("clears transient flags after minimum skeleton duration", async () => {
    vi.useFakeTimers();
    const setShowPageSkeleton = vi.fn(), setShowFocusTransition = vi.fn();
    renderHook(() => useTransientFlags({
      showFocusTransition: true, setShowFocusTransition,
      showPageSkeleton: true, setShowPageSkeleton,
      minFocusSkeletonMs: 150,
    }));
    act(() => { vi.advanceTimersByTime(151); });
    expect(setShowPageSkeleton).toHaveBeenCalledWith(false);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(setShowFocusTransition).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  it("exits fullscreen when focus mode ends", async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitFullscreen;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
    renderHook(() => useFocusFullscreen({ focusMode: false, focusFullscreenPending: true, setFocusFullscreenPending: vi.fn() }));
    expect(exitFullscreen).toHaveBeenCalled();
  });
});
