import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import * as todayBannerDataModule from "../../../components/Timer/todayBanner/useTodayBannerData";
import * as focusCanvasModule from "../../../components/Timer/focusAnimation/useFocusCanvasAnimation";

const getSummary = vi.fn();
const getNearestMilestone = vi.fn();
const listenToTimerHistoryEvents = vi.fn();
const useFocusCanvasAnimation = vi.fn();

vi.mock("../../../api/analyticsApi", () => ({
  default: { getSummary: (...args) => getSummary(...args) },
}));

vi.mock("../../../components/Timer/utils/milestoneUtils", () => ({
  getNearestMilestone: (...args) => getNearestMilestone(...args),
}));

vi.mock("../../../components/Timer/utils/historyEvents", () => ({
  listenToTimerHistoryEvents: (...args) => listenToTimerHistoryEvents(...args),
}));

vi.mock("../../../components/Timer/focusAnimation/treePixels", () => ({
  BRANCH_TIPS: [
    { x: 10, y: 20 },
    { x: 20, y: 30 },
    { x: 30, y: 40 },
    { x: 40, y: 50 },
    { x: 50, y: 60 },
    { x: 60, y: 70 },
  ],
}));

vi.mock("../../../components/Timer/focusAnimation/focusCanvasColors.json", () => ({
  default: { glowBreakBase: "1,2,3", glowWorkBase: "4,5,6" },
}));

vi.mock("../../../components/Timer/focusAnimation/TreeScene", () => ({
  TreeScene: ({ progress }) => <div>tree-scene-{progress}</div>,
}));

import { useFocusCanvasAnimation as useFocusCanvasAnimationImpl } from "../../../components/Timer/focusAnimation/useFocusCanvasAnimation";
import { useTodayBannerData } from "../../../components/Timer/todayBanner/useTodayBannerData";
import TodayBanner from "../../../components/Timer/TodayBanner";
import FocusAnimation from "../../../components/Timer/FocusAnimation";

describe("Timer focus and banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getNearestMilestone.mockReturnValue({ label: "100 sessions", remaining: 3 });
    listenToTimerHistoryEvents.mockImplementation(() => () => {});
  });

  it("runs focus canvas animation and persists animation type", () => {
    vi.stubGlobal("requestAnimationFrame", (cb) => {
      cb();
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const clearRect = vi.fn();
    const fillRect = vi.fn();
    const fill = vi.fn();
    const stroke = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect,
      fillRect,
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill,
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke,
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      globalCompositeOperation: "",
      globalAlpha: 1,
      lineWidth: 1,
      fillStyle: "",
      strokeStyle: "",
    }));

    const { result } = renderHook(() => useFocusCanvasAnimationImpl("work", true, 0.5));
    const canvas = document.createElement("canvas");
    result.current.canvasRef.current = canvas;

    act(() => {
      result.current.setAnimationType("orb");
    });
    expect(localStorage.getItem("focusAnimationType")).toBe("orb");
    expect(result.current.animationType).toBe("orb");
  });

  it("loads today banner data, computes metrics, and reacts to history refreshes", async () => {
    localStorage.setItem("timerDailyGoalHours", "5");
    let refreshHistory;
    listenToTimerHistoryEvents.mockImplementation((refresh) => {
      refreshHistory = refresh;
      return () => {};
    });
    getSummary
      .mockResolvedValueOnce({ summary: { total_sessions: 4, total_study_hours: 2.5, current_streak_days: 8 } })
      .mockResolvedValueOnce({ summary: { total_sessions: 97, current_streak_days: 8, total_study_hours: 60 } });

    const onStreakData = vi.fn();
    const { result } = renderHook(() => useTodayBannerData(onStreakData));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goalHours).toBe(5);
    expect(result.current.sessions).toBe(4);
    expect(result.current.goalSessions).toBe(12);
    expect(result.current.formattedHours).toBe("2h 30m");
    expect(result.current.weeklyGoalText).toContain("1/7");
    expect(result.current.tickCount).toBeGreaterThanOrEqual(2);
    expect(onStreakData).toHaveBeenCalled();

    getSummary
      .mockResolvedValueOnce({ summary: { total_sessions: 5, total_study_hours: 3, current_streak_days: 9 } })
      .mockResolvedValueOnce({ summary: { total_sessions: 98, current_streak_days: 9, total_study_hours: 61 } });

    await act(async () => {
      refreshHistory();
    });

    await waitFor(() => expect(result.current.sessions).toBe(5));
    expect(result.current.streak).toBe(9);
  });

  it("renders today banner metrics and focus animation picker behavior", () => {
    vi.spyOn(todayBannerDataModule, "useTodayBannerData").mockReturnValue({
      loading: false,
      streak: 7,
      sessions: 3,
      goalSessions: 8,
      fillAnimating: false,
      activePulseLeft: 20,
      tickCount: 8,
      sessionPct: 37,
      goalHours: 4,
      formattedHours: "1h 45m",
      timePct: 44,
    });

    render(<TodayBanner onStreakData={vi.fn()} isStudying />);
    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByText("3 / 8")).toBeInTheDocument();
    expect(screen.getByText("1h 45m")).toBeInTheDocument();

    vi.spyOn(focusCanvasModule, "useFocusCanvasAnimation").mockReturnValue({
      canvasRef: { current: null },
      animationType: "tree",
      setAnimationType: vi.fn(),
    });

    render(<FocusAnimation progress={0.6} mode="work" isActive showPicker />);
    expect(screen.getByText("tree-scene-0.6")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Orb"));
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(5);
  });
});
