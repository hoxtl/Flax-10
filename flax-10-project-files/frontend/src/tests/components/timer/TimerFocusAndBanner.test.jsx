/**
 * Covers Timer focus animation and TodayBanner support hooks.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import * as todayBannerDataModule from "../../../components/timer/today_banner/useTodayBannerData";
import * as focusCanvasModule from "../../../components/timer/focus_animation/useFocusCanvasAnimation";

const getSummary = vi.fn();
const getNearestMilestone = vi.fn();
const listenToTimerHistoryEvents = vi.fn();

vi.mock("../../../api/analyticsApi", () => ({
  default: { getSummary: (...args) => getSummary(...args) },
}));

vi.mock("../../../components/Timer/utils/milestoneUtils", () => ({
  getNearestMilestone: (...args) => getNearestMilestone(...args),
}));

vi.mock("../../../components/timer/utils/historyEvents", () => ({
  listenToTimerHistoryEvents: (...args) => listenToTimerHistoryEvents(...args),
}));

vi.mock("../../../components/timer/focus_animation/treePixels", () => ({
  BRANCH_TIPS: [
    { x: 10, y: 20 },
    { x: 20, y: 30 },
    { x: 30, y: 40 },
    { x: 40, y: 50 },
    { x: 50, y: 60 },
    { x: 60, y: 70 },
  ],
}));

vi.mock("../../../components/timer/focus_animation/focusCanvasColors.json", () => ({
  default: { glowBreakBase: "1,2,3", glowWorkBase: "4,5,6" },
}));

vi.mock("../../../components/timer/focus_animation/TreeScene", () => ({
  TreeScene: ({ progress }) => <div>tree-scene-{progress}</div>,
}));

vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: () => null,
}));

import { useFocusCanvasAnimation as useFocusCanvasAnimationImpl } from "../../../components/timer/focus_animation/useFocusCanvasAnimation";
import { useTodayBannerData } from "../../../components/timer/today_banner/useTodayBannerData";
import TodayBanner from "../../../components/timer/TodayBanner";
import FocusAnimation from "../../../components/timer/FocusAnimation";

const canvasMethodNames = ["clearRect", "fillRect", "beginPath", "arc", "fill", "save", "restore", "translate", "rotate", "moveTo", "lineTo", "stroke"];

const createCanvasContext = () => ({
  ...Object.fromEntries(canvasMethodNames.map((name) => [name, vi.fn()])),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  globalCompositeOperation: "",
  globalAlpha: 1,
  lineWidth: 1,
  fillStyle: "",
  strokeStyle: "",
});

const stubCanvasContext = () => {
  const context = createCanvasContext();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => context);
  return context;
};

const mountFocusAnimationHook = () => {
  vi.stubGlobal("requestAnimationFrame", (cb) => {
    cb();
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  stubCanvasContext();
  const hook = renderHook(() => useFocusCanvasAnimationImpl("work", true, 0.5));
  hook.result.current.canvasRef.current = document.createElement("canvas");
  return hook;
};

const queueSummaryResponses = (...summaries) => {
  summaries.forEach((summary) => {
    getSummary.mockResolvedValueOnce({ summary });
  });
};

const renderBannerHook = async (onStreakData = vi.fn()) => {
  const hook = renderHook(() => useTodayBannerData(onStreakData));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return { hook, onStreakData };
};

describe("Timer focus and banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getNearestMilestone.mockReturnValue({ label: "100 sessions", remaining: 3 });
    listenToTimerHistoryEvents.mockImplementation(() => () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists the selected focus animation type", () => {
    const { result } = mountFocusAnimationHook();
    act(() => result.current.setAnimationType("orb"));
    expect(localStorage.getItem("focusAnimationType")).toBe("orb");
    expect(result.current.animationType).toBe("orb");
  });

  it("loads today banner metrics from analytics summaries", async () => {
    queueSummaryResponses(
      { total_sessions: 4, total_study_hours: 2.5, current_streak_days: 8 },
      { active_days: 5 },
      { total_sessions: 97, current_streak_days: 8, total_study_hours: 60 },
    );
    const { hook, onStreakData } = await renderBannerHook();
    expect(getSummary).toHaveBeenCalledWith(1);
    expect(getSummary).toHaveBeenCalledWith(7);
    expect(getSummary).toHaveBeenCalledWith(30);
    expect(hook.result.current).toMatchObject({ streak: 8, sessions: 97, weeklyGoalDays: 5, focusHours: 60 });
    expect(onStreakData).toHaveBeenCalledWith({ current_streak_days: 8, total_sessions: 4 });
  });

  it("refreshes banner metrics when timer history events fire", async () => {
    let refreshHistory;
    listenToTimerHistoryEvents.mockImplementation((refresh) => {
      refreshHistory = refresh;
      return () => {};
    });
    queueSummaryResponses(
      { total_sessions: 4, total_study_hours: 2.5, current_streak_days: 8 },
      { active_days: 5 },
      { total_sessions: 97, current_streak_days: 8, total_study_hours: 60 },
    );
    const { hook } = await renderBannerHook();

    queueSummaryResponses(
      { total_sessions: 5, total_study_hours: 3, current_streak_days: 9 },
      { active_days: 6 },
      { total_sessions: 98, current_streak_days: 9, total_study_hours: 61 },
    );
    await act(async () => {
      refreshHistory();
    });
    await waitFor(() => expect(hook.result.current.sessions).toBe(98));
    expect(hook.result.current.streak).toBe(9);
    expect(hook.result.current.weeklyGoalDays).toBe(6);
  });

  it("renders the TodayBanner stat tiles", () => {
    vi.spyOn(todayBannerDataModule, "useTodayBannerData").mockReturnValue({
      loading: false,
      streak: 7,
      sessions: 3,
      weeklyGoalDays: 5,
      focusHours: 1.75,
      streakData: { current_streak_days: 7, total_sessions: 3 },
    });
    const { container } = render(<TodayBanner onStreakData={vi.fn()} isStudying />);
    expect(screen.getByText("Current streak")).toBeInTheDocument();
    expect(screen.getByText("Sessions logged")).toBeInTheDocument();
    expect(screen.getByText("Weekly goal")).toBeInTheDocument();
    expect(screen.getByText("Focus time")).toBeInTheDocument();
    expect(container.textContent).toContain("7d");
    expect(container.textContent).toContain("5 / 7");
    expect(container.textContent).toContain("1.75h");
  });

  it("shows focus animation picker buttons and scene output", () => {
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
