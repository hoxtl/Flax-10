/**
 * Covers Timer page controller state and content branches.
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createFnMap } from "../../utils/testBuilderUtils";

const useBreakpoint = vi.fn();
const useNotificationPermission = vi.fn();
const useTimerPageFlags = vi.fn();
const useFocusAccent = vi.fn();
const useTimerDocumentTitle = vi.fn();
const useTimerShortcuts = vi.fn();
const useTransientFlags = vi.fn();
const useFocusFullscreen = vi.fn();
const useNavigate = vi.fn();

vi.mock("../../../hooks/useBreakpoint", () => ({
  default: (...args) => useBreakpoint(...args),
}));

vi.mock("../../../components/Timer/utils/timerUtils", () => ({
  useNotificationPermission: (...args) => useNotificationPermission(...args),
}));

vi.mock("../../../pages/Timer/hooks/useTimerPageFlags", () => ({
  useTimerPageFlags: (...args) => useTimerPageFlags(...args),
}));

vi.mock("../../../pages/Timer/hooks/useTimerPageEffects", () => ({
  useFocusAccent: (...args) => useFocusAccent(...args),
  useTimerDocumentTitle: (...args) => useTimerDocumentTitle(...args),
  useTimerShortcuts: (...args) => useTimerShortcuts(...args),
  useTransientFlags: (...args) => useTransientFlags(...args),
  useFocusFullscreen: (...args) => useFocusFullscreen(...args),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => useNavigate,
}));

vi.mock("../../../components/common/AppPage/AppPage", () => ({
  default: ({ title, children, className }) => <div data-class={className}><h1>{title}</h1>{children}</div>,
}));

vi.mock("../../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ onClick, label, className }) => <button type="button" className={className} onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/common/PageTransition/PageTransition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/ScrollToTop/ScrollToTop", () => ({
  default: () => <div>scroll-top</div>,
}));

vi.mock("../../../components/Timer/TodayBanner", () => ({
  default: ({ onStreakData, isStudying }) => <button type="button" onClick={() => onStreakData?.({ current_streak_days: 3 })}>today-banner-{String(isStudying)}</button>,
}));

vi.mock("../../../components/Timer/WrapperComponents", () => ({
  MainSection: ({ onOpenHistory, onOpenFocus }) => (
    <div>
      <button type="button" onClick={onOpenHistory}>open-history</button>
      <button type="button" onClick={onOpenFocus}>open-focus</button>
    </div>
  ),
  PopupSection: ({ showHistory, onCloseHistory }) => (
    <div>
      <span>popup:{String(showHistory)}</span>
      <button type="button" onClick={onCloseHistory}>close-history</button>
    </div>
  ),
  RightPanel: () => <div>right-panel</div>,
  FocusOverlayContent: ({ onExitFocus }) => <button type="button" onClick={onExitFocus}>exit-focus</button>,
}));

vi.mock("../../../components/ui/word-loader", () => ({
  default: ({ words }) => <div>{words.join(",")}</div>,
}));

vi.mock("../../../pages/Timer/components/FocusPageSkeleton", () => ({
  FocusPageSkeleton: () => <div>focus-skeleton</div>,
}));

vi.mock("../../../pages/Timer/components/NotificationPrompt", () => ({
  NotificationPrompt: ({ permission }) => <div>notify:{permission}</div>,
}));

vi.mock("../../../pages/Timer/components/ShortcutsModal", () => ({
  ShortcutsModal: ({ onClose }) => <button type="button" onClick={onClose}>shortcuts</button>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import { useTimerPageController } from "../../../pages/Timer/hooks/useTimerPageController";
import { TimerPageContent } from "../../../pages/Timer/components/TimerPageContent";

const buildTimerFlags = () => ({
  setFocusMode: vi.fn(),
  setFocusFullscreenPending: vi.fn(),
  setShowShortcuts: vi.fn(),
  focusMode: false,
  showShortcuts: false,
  showFocusTransition: false,
  showPageSkeleton: false,
  setShowPageSkeleton: vi.fn(),
  setShowFocusTransition: vi.fn(),
  focusFullscreenPending: false,
  setShowHistory: vi.fn(),
  showHistory: false,
  setStreakData: vi.fn(),
  streakData: null,
  dismissedWarning: false,
  setDismissedWarning: vi.fn(),
});

const timerStateActionNames = [
  "request",
  "setFocusMode",
  "setShowShortcuts",
  "setDismissedWarning",
  "setStreakData",
  "openFocusMode",
  "setShowHistory",
];

const baseTimerState = {
  permission: "default",
  fromTaskPlay: true,
  showFocusTransition: true,
  showPageSkeleton: true,
  focusAccent: "#09f",
  focusMode: true,
  showShortcuts: true,
  streakData: { current_streak_days: 4, total_sessions: 0 },
  dismissedWarning: false,
  t: { isActive: true, isPaused: false },
  isMobile: false,
  showHistory: true,
};

const buildTimerState = (overrides = {}) => ({
  ...baseTimerState,
  ...createFnMap(timerStateActionNames),
  ...overrides,
});

const loadTimerEffects = () => vi.importActual("../../../pages/Timer/hooks/useTimerPageEffects");
const loadShortcutsModal = () => vi.importActual("../../../pages/Timer/components/ShortcutsModal");

describe("Timer page extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBreakpoint.mockReturnValue(false);
    useNotificationPermission.mockReturnValue({ permission: "granted", request: vi.fn() });
    useTimerPageFlags.mockReturnValue(buildTimerFlags());
    useNavigate.mockReset();
  });

  describe("useTimerPageController", () => {
    const renderController = () => {
      const timer = { isActive: false, isPaused: false, timeLeft: 1200, mode: "work" };
      const location = { state: { fromTaskPlay: true } };
      return renderHook(() => useTimerPageController(timer, location));
    };

    it("exposes page state and triggers supporting hooks", () => {
      const { result } = renderController();
      expect(result.current.isMobile).toBe(false);
      expect(result.current.permission).toBe("granted");
      expect(result.current.focusAccent).toBe("var(--timer-focus-accent)");
      expect(result.current.minFocusSkeletonMs).toBe(500);
      expect(useFocusAccent).toHaveBeenCalled();
      expect(useTimerDocumentTitle).toHaveBeenCalledWith(expect.objectContaining({ mode: "work" }));
      expect(useTimerShortcuts).toHaveBeenCalled();
      expect(useTransientFlags).toHaveBeenCalled();
      expect(useFocusFullscreen).toHaveBeenCalled();
    });

    it("opens focus mode and closes overlays", () => {
      const { result } = renderController();
      act(() => result.current.openFocusMode());
      expect(result.current.setFocusMode).toHaveBeenCalledWith(true);
      expect(result.current.setFocusFullscreenPending).toHaveBeenCalledWith(true);
      act(() => result.current.closeOverlays());
      expect(result.current.setFocusMode).toHaveBeenCalledWith(false);
      expect(result.current.setShowShortcuts).toHaveBeenCalledWith(false);
    });
  });

  describe("timer page effects", () => {
    it("sets the focus accent color and clears it on unmount", async () => {
      const effects = await loadTimerEffects();
      const setSpy = vi.spyOn(document.documentElement.style, "setProperty");
      const removeSpy = vi.spyOn(document.documentElement.style, "removeProperty");
      const { unmount } = renderHook(() => effects.useFocusAccent("#abc"));
      expect(setSpy).toHaveBeenCalledWith("--timer-focus-accent", "#abc");
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("--timer-focus-accent");
    });

    it("restores the document title after reporting remaining time", async () => {
      const effects = await loadTimerEffects();
      const { unmount } = renderHook(() => effects.useTimerDocumentTitle({ isActive: true, isPaused: false, timeLeft: 65, mode: "break" }));
      expect(document.title).toContain("01:05");
      unmount();
      expect(document.title).toBe("StudyFlax");
    });

    it("handles keyboard shortcuts for timer control", async () => {
      const effects = await loadTimerEffects();
      const t = { isActive: true, togglePause: vi.fn(), setIsActive: vi.fn(), resetTimer: vi.fn() };
      renderHook(() => effects.useTimerShortcuts({ t, setShowShortcuts: vi.fn(), setFocusMode: vi.fn(), openFocusMode: vi.fn(), closeOverlays: vi.fn(), focusMode: false }));
      ["?", " ", "r", "f", "Escape"].forEach((key) => fireEvent.keyDown(window, { key }));
      expect(t.togglePause).toHaveBeenCalled();
      expect(t.resetTimer).toHaveBeenCalled();
    });

    it("handles transient focus transition and skeleton flags", async () => {
      const effects = await loadTimerEffects();
      const setShowFocusTransition = vi.fn();
      const setShowPageSkeleton = vi.fn();
      renderHook(() => effects.useTransientFlags({ showFocusTransition: true, setShowFocusTransition, showPageSkeleton: true, setShowPageSkeleton, minFocusSkeletonMs: 100 }));
      expect(setShowFocusTransition).not.toHaveBeenCalled();
    });

    it("requests fullscreen when focus mode is pending", async () => {
      const effects = await loadTimerEffects();
      const requestFullscreen = vi.fn().mockResolvedValue(undefined);
      document.documentElement.requestFullscreen = requestFullscreen;
      renderHook(() => effects.useFocusFullscreen({ focusMode: true, focusFullscreenPending: true, setFocusFullscreenPending: vi.fn() }));
      await waitFor(() => expect(requestFullscreen).toHaveBeenCalled());
    });
  });

  describe("Timer page UI", () => {
    it("closes the shortcuts modal through its close button", async () => {
      const { ShortcutsModal } = await loadShortcutsModal();
      const onClose = vi.fn();
      render(<ShortcutsModal onClose={onClose} />);
      fireEvent.click(screen.getByText("Close"));
      expect(onClose).toHaveBeenCalled();
    });

    it("renders focus mode overlay and controls", () => {
      const state = buildTimerState({ focusMode: true });
      render(<TimerPageContent state={state} />);
      expect(screen.getByText("Focus Timer")).toBeInTheDocument();
      expect(screen.getByText("focus,lock in,you've got this")).toBeInTheDocument();
      fireEvent.click(screen.getByText("exit-focus"));
      expect(state.setFocusMode).toHaveBeenCalledWith(false);
      expect(useNavigate).toHaveBeenCalledWith("/timer");
    });

    it("handles overlay interactions (history, shortcuts, streak)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));
      const state = buildTimerState({ focusMode: false, showPageSkeleton: false });
      render(<TimerPageContent state={state} />);
      fireEvent.click(screen.getByText("open-history"));
      expect(state.setShowHistory).toHaveBeenCalledWith(true);
      fireEvent.click(screen.getByText("open-focus"));
      expect(state.openFocusMode).toHaveBeenCalled();
      fireEvent.click(screen.getByText("✕"));
      expect(state.setDismissedWarning).toHaveBeenCalledWith(true);
      fireEvent.click(screen.getByText("shortcuts"));
      expect(state.setShowShortcuts).toHaveBeenCalledWith(false);
      fireEvent.click(screen.getByText("close-history"));
      expect(state.setShowHistory).toHaveBeenCalledWith(false);
      vi.useRealTimers();
    });

    it("renders back button and skeleton in non-focus mode", () => {
      const state = buildTimerState({ focusMode: false, showPageSkeleton: true });
      render(<TimerPageContent state={state} />);
      expect(screen.getByText("focus-skeleton")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Back"));
      expect(useNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("hides the streak warning when the user already studied today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));
    render(<TimerPageContent state={buildTimerState({ focusMode: false, streakData: { current_streak_days: 4, total_sessions: 2 } })} />);
    expect(screen.queryByText(/Study today to keep your 4-day streak/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("hides the streak warning before evening", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
    render(<TimerPageContent state={buildTimerState({ focusMode: false, streakData: { current_streak_days: 4, total_sessions: 0 } })} />);
    expect(screen.queryByText(/Study today to keep your 4-day streak/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("hides the streak warning when the streak is zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));
    render(<TimerPageContent state={buildTimerState({ focusMode: false, streakData: { current_streak_days: 0, total_sessions: 0 } })} />);
    expect(screen.queryByText(/Study today to keep your/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("handles missing or incomplete streak data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));
    const { rerender } = render(<TimerPageContent state={buildTimerState({ focusMode: false, streakData: {} })} />);
    expect(screen.queryByText(/Study today to keep your/i)).not.toBeInTheDocument();
    rerender(<TimerPageContent state={buildTimerState({ focusMode: false, streakData: { current_streak_days: 4 } })} />);
    expect(screen.getByText(/Study today to keep your 4-day streak/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
