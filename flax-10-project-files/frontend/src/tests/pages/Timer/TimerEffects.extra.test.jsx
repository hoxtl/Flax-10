import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, renderHook } from "@testing-library/react";

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
    const openFocusMode = vi.fn();

    renderHook(() => useTimerShortcuts({
      t: { isActive: false, setIsActive, togglePause: vi.fn(), resetTimer: vi.fn() },
      setShowShortcuts, setFocusMode, openFocusMode, closeOverlays: vi.fn(),
    }));

    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "f" });
    fireEvent.keyDown(window, { key: "?" });

    expect(setIsActive).toHaveBeenCalledWith(true);
    expect(setFocusMode).not.toHaveBeenCalled();
    expect(openFocusMode).toHaveBeenCalled();
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

  it("swallows fullscreen request failures", async () => {
    vi.useFakeTimers();
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));
    document.documentElement.requestFullscreen = requestFullscreen;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    renderHook(() => useFocusFullscreen({ focusMode: true, focusFullscreenPending: true, setFocusFullscreenPending: vi.fn() }));
    await act(async () => {
      vi.advanceTimersByTime(221);
      await Promise.resolve();
    });
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it("swallows fullscreen exit failures", async () => {
    const exitFullscreen = vi.fn().mockRejectedValue(new Error("exit denied"));
    document.exitFullscreen = exitFullscreen;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
    renderHook(() => useFocusFullscreen({ focusMode: false, focusFullscreenPending: false, setFocusFullscreenPending: vi.fn() }));
    await act(async () => { await Promise.resolve(); });
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it("does not trigger transient flags when inactive", () => {
    vi.useFakeTimers();
    const setShowFocusTransition = vi.fn(), setShowPageSkeleton = vi.fn();
    renderHook(() => useTransientFlags({
      showFocusTransition: false, setShowFocusTransition,
      showPageSkeleton: false, setShowPageSkeleton,
      minFocusSkeletonMs: 150,
    }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(setShowFocusTransition).not.toHaveBeenCalled();
    expect(setShowPageSkeleton).not.toHaveBeenCalled();
  });

  it("avoids redundant fullscreen requests when already in fullscreen", () => {
    const requestFullscreen = vi.fn();
    document.documentElement.requestFullscreen = requestFullscreen;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
    renderHook(() => useFocusFullscreen({ focusMode: true, focusFullscreenPending: true, setFocusFullscreenPending: vi.fn() }));
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("avoids redundant exitFullscreen calls when not in fullscreen", () => {
    document.exitFullscreen = vi.fn();
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    renderHook(() => useFocusFullscreen({ focusMode: true, focusFullscreenPending: false, setFocusFullscreenPending: vi.fn() }));
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });

  it("returns early when requestFullscreen is unavailable", () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    document.documentElement.requestFullscreen = undefined;
    renderHook(() => useFocusFullscreen({ focusMode: true, focusFullscreenPending: true, setFocusFullscreenPending: vi.fn() }));
    act(() => { vi.advanceTimersByTime(221); });
  });

  it("returns early when exitFullscreen is unavailable", () => {
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
    document.exitFullscreen = undefined;
    renderHook(() => useFocusFullscreen({ focusMode: false, focusFullscreenPending: false, setFocusFullscreenPending: vi.fn() }));
  });
});
