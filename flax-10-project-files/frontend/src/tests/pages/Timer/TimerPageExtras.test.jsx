import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

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

describe("Timer page extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBreakpoint.mockReturnValue(false);
    useNotificationPermission.mockReturnValue({ permission: "granted", request: vi.fn() });
    useTimerPageFlags.mockReturnValue({
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
    useNavigate.mockReset();
  });

  it("builds controller state and exposes open/close overlay helpers", () => {
    const t = { isActive: false, isPaused: false, timeLeft: 1200, mode: "work" };
    const location = { state: { fromTaskPlay: true } };
    const { result } = renderHook(() => useTimerPageController(t, location));

    expect(result.current.isMobile).toBe(false);
    expect(result.current.permission).toBe("granted");
    expect(result.current.fromTaskPlay).toBe(true);
    expect(result.current.focusAccent).toBe("var(--timer-focus-accent)");
    expect(result.current.minFocusSkeletonMs).toBe(500);
    act(() => result.current.openFocusMode());
    expect(result.current.setFocusMode).toHaveBeenCalledWith(true);
    expect(result.current.setFocusFullscreenPending).toHaveBeenCalledWith(true);
    act(() => result.current.closeOverlays());
    expect(result.current.setFocusMode).toHaveBeenCalledWith(false);
    expect(result.current.setShowShortcuts).toHaveBeenCalledWith(false);
    expect(useFocusAccent).toHaveBeenCalled();
    expect(useTimerDocumentTitle).toHaveBeenCalledWith(t);
    expect(useTimerShortcuts).toHaveBeenCalled();
    expect(useTransientFlags).toHaveBeenCalled();
    expect(useFocusFullscreen).toHaveBeenCalled();
  });

  it("covers timer page effect hooks and keyboard shortcuts", async () => {
    const effects = await vi.importActual("../../../pages/Timer/hooks/useTimerPageEffects");
    const rootStyleSet = vi.spyOn(document.documentElement.style, "setProperty");
    const rootStyleRemove = vi.spyOn(document.documentElement.style, "removeProperty");

    const { unmount: unmountAccent } = renderHook(() => effects.useFocusAccent("#abc"));
    expect(rootStyleSet).toHaveBeenCalledWith("--timer-focus-accent", "#abc");
    unmountAccent();
    expect(rootStyleRemove).toHaveBeenCalledWith("--timer-focus-accent");

    const { unmount: unmountTitle } = renderHook(() => effects.useTimerDocumentTitle({ isActive: true, isPaused: false, timeLeft: 65, mode: "break" }));
    expect(document.title).toContain("01:05");
    unmountTitle();
    expect(document.title).toBe("StudyFlax");

    const togglePause = vi.fn();
    const setIsActive = vi.fn();
    const resetTimer = vi.fn();
    const setShowShortcuts = vi.fn((fn) => fn(false));
    const setFocusMode = vi.fn();
    const openFocusMode = vi.fn();
    const closeOverlays = vi.fn();
    renderHook(() => effects.useTimerShortcuts({
      t: { isActive: true, togglePause, setIsActive, resetTimer },
      setShowShortcuts,
      setFocusMode,
      openFocusMode,
      closeOverlays,
      focusMode: false,
    }));
    fireEvent.keyDown(window, { key: "?" });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "f" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(togglePause).toHaveBeenCalled();
    expect(resetTimer).toHaveBeenCalled();
    expect(openFocusMode).toHaveBeenCalled();
    expect(closeOverlays).toHaveBeenCalled();

    renderHook(() => effects.useTransientFlags({
      showFocusTransition: true,
      setShowFocusTransition: vi.fn(),
      showPageSkeleton: true,
      setShowPageSkeleton: vi.fn(),
      minFocusSkeletonMs: 100,
    }));

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = requestFullscreen;
    document.fullscreenElement = null;
    renderHook(() => effects.useFocusFullscreen({
      focusMode: true,
      focusFullscreenPending: true,
      setFocusFullscreenPending: vi.fn(),
    }));
    await waitFor(() => expect(requestFullscreen).toHaveBeenCalled());
  });

  it("renders shortcuts modal interactions and timer page layout branches", async () => {
    const { ShortcutsModal } = await vi.importActual("../../../pages/Timer/components/ShortcutsModal");
    const onClose = vi.fn();
    render(<ShortcutsModal onClose={onClose} />);
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();

    const state = {
      permission: "default",
      request: vi.fn(),
      fromTaskPlay: true,
      showFocusTransition: true,
      showPageSkeleton: true,
      focusAccent: "#09f",
      focusMode: true,
      setFocusMode: vi.fn(),
      showShortcuts: true,
      setShowShortcuts: vi.fn(),
      streakData: { current_streak_days: 4, total_sessions: 0 },
      dismissedWarning: false,
      setDismissedWarning: vi.fn(),
      setStreakData: vi.fn(),
      t: { isActive: true, isPaused: false },
      isMobile: false,
      openFocusMode: vi.fn(),
      showHistory: true,
      setShowHistory: vi.fn(),
    };

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T18:30:00.000Z"));
    const { rerender } = render(<TimerPageContent state={state} />);
    expect(screen.getByText("Focus Timer")).toBeInTheDocument();
    expect(screen.getByText("focus,lock in,you've got this")).toBeInTheDocument();
    expect(screen.getByText("focus-skeleton")).toBeInTheDocument();
    expect(screen.getByText(/Study today to keep your 4-day streak/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByText("exit-focus"));
    expect(state.setFocusMode).toHaveBeenCalledWith(false);
    expect(useNavigate).toHaveBeenCalledWith("/timer");

    const nonFocusState = {
      ...state,
      focusMode: false,
      showShortcuts: false,
      showPageSkeleton: false,
      showFocusTransition: false,
    };
    rerender(<TimerPageContent state={nonFocusState} />);
    fireEvent.click(screen.getByText("Back"));
    expect(useNavigate).toHaveBeenCalledWith(-1);
    vi.useRealTimers();
  });

  it("hides the streak warning when the user already studied today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));

    render(
      <TimerPageContent
        state={{
          permission: "default",
          request: vi.fn(),
          fromTaskPlay: false,
          showFocusTransition: false,
          showPageSkeleton: false,
          focusAccent: "#09f",
          focusMode: false,
          setFocusMode: vi.fn(),
          showShortcuts: false,
          setShowShortcuts: vi.fn(),
          streakData: { current_streak_days: 4, total_sessions: 2 },
          dismissedWarning: false,
          setDismissedWarning: vi.fn(),
          setStreakData: vi.fn(),
          t: { isActive: true, isPaused: false },
          isMobile: false,
          openFocusMode: vi.fn(),
          showHistory: false,
          setShowHistory: vi.fn(),
        }}
      />
    );

    expect(screen.queryByText(/Study today to keep your 4-day streak/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("hides the streak warning before evening and when the streak is zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const baseState = {
      permission: "default",
      request: vi.fn(),
      fromTaskPlay: false,
      showFocusTransition: false,
      showPageSkeleton: false,
      focusAccent: "#09f",
      focusMode: false,
      setFocusMode: vi.fn(),
      showShortcuts: false,
      setShowShortcuts: vi.fn(),
      dismissedWarning: false,
      setDismissedWarning: vi.fn(),
      setStreakData: vi.fn(),
      t: { isActive: true, isPaused: false },
      isMobile: false,
      openFocusMode: vi.fn(),
      showHistory: false,
      setShowHistory: vi.fn(),
    };

    const { rerender } = render(
      <TimerPageContent state={{ ...baseState, streakData: { current_streak_days: 4, total_sessions: 0 } }} />
    );
    expect(screen.queryByText(/Study today to keep your 4-day streak/i)).not.toBeInTheDocument();

    vi.setSystemTime(new Date("2026-03-24T20:00:00.000Z"));
    rerender(
      <TimerPageContent state={{ ...baseState, streakData: { current_streak_days: 0, total_sessions: 0 } }} />
    );
    expect(screen.queryByText(/Study today to keep your/i)).not.toBeInTheDocument();

    rerender(
      <TimerPageContent state={{ ...baseState, streakData: {} }} />
    );
    expect(screen.queryByText(/Study today to keep your/i)).not.toBeInTheDocument();

    rerender(
      <TimerPageContent state={{ ...baseState, streakData: { current_streak_days: 4 } }} />
    );
    expect(screen.getByText(/Study today to keep your 4-day streak/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
