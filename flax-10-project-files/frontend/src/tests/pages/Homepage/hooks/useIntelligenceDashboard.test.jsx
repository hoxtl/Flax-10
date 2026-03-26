import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  tflServiceMock,
  getMyCourseChangeRequestMock,
  updateUserSettingsMock,
  useAttendanceStatsMock,
  getAttendancePercentageMock,
  loadTermConfigMock,
  getCurrentEventMock,
  getUpcomingEventMock,
  getLiveContextMock,
  getRelevantDelaysMock,
  isSevereDisruptionMock,
  useAnalyticsOverviewMock,
} = vi.hoisted(() => ({
  tflServiceMock: { getTfLDelays: vi.fn() },
  getMyCourseChangeRequestMock: vi.fn(),
  updateUserSettingsMock: vi.fn(),
  useAttendanceStatsMock: vi.fn(),
  getAttendancePercentageMock: vi.fn(),
  loadTermConfigMock: vi.fn(),
  getCurrentEventMock: vi.fn(),
  getUpcomingEventMock: vi.fn(),
  getLiveContextMock: vi.fn(),
  getRelevantDelaysMock: vi.fn(),
  isSevereDisruptionMock: vi.fn(),
  useAnalyticsOverviewMock: vi.fn(),
}));

vi.mock("../../../../api/tflApi", () => ({
  tflService: tflServiceMock,
}));

vi.mock("../../../../api/adminApi", () => ({
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequestMock(...args),
}));

vi.mock("../../../../api/userApi", () => ({
  updateUserSettings: (...args) => updateUserSettingsMock(...args),
}));

vi.mock("../../../../components/Analytics/useAttendanceStats", () => ({
  default: () => useAttendanceStatsMock(),
}));

vi.mock("../../../../components/Analytics/attendanceChartConfig", () => ({
  getAttendancePercentage: (...args) => getAttendancePercentageMock(...args),
}));

vi.mock("../../../../lib/termConfig", () => ({
  loadTermConfig: (...args) => loadTermConfigMock(...args),
}));

vi.mock("../../../../pages/Homepage/components/IntelligenceUtils", () => ({
  getCurrentEvent: (...args) => getCurrentEventMock(...args),
  getLiveContext: (...args) => getLiveContextMock(...args),
  getUpcomingEvent: (...args) => getUpcomingEventMock(...args),
}));

vi.mock("../../../../pages/Homepage/utils/kclTflMapping", () => ({
  getRelevantDelays: (...args) => getRelevantDelaysMock(...args),
  isSevereDisruption: (...args) => isSevereDisruptionMock(...args),
}));

vi.mock("../../../../pages/Analytics/hooks/useAnalyticsOverview", () => ({
  default: (...args) => useAnalyticsOverviewMock(...args),
}));

import {
  getSemesterProgress,
  useIntelligenceDashboard,
} from "../../../../pages/Homepage/hooks/useIntelligenceDashboard";

describe("useIntelligenceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tflServiceMock.getTfLDelays.mockResolvedValue([{ id: 1 }]);
    getMyCourseChangeRequestMock.mockResolvedValue({ status: "pending", requested_course: "CS" });
    updateUserSettingsMock.mockResolvedValue({});
    useAttendanceStatsMock.mockReturnValue({ loading: false, stats: { overall: 80 } });
    getAttendancePercentageMock.mockReturnValue(80);
    loadTermConfigMock.mockReturnValue({ startDate: "2026-01-12", totalWeeks: 10, hasReadingWeek: false });
    getCurrentEventMock.mockReturnValue(null);
    getUpcomingEventMock.mockReturnValue(null);
    getLiveContextMock.mockReturnValue({ label: "Right now" });
    getRelevantDelaysMock.mockReturnValue([]);
    isSevereDisruptionMock.mockReturnValue(false);
    useAnalyticsOverviewMock.mockReturnValue({ summary: "ok" });
  });

  it("prefers server settings, loads dashboard data, and schedules cloud sync", async () => {
    vi.useFakeTimers();
    const profile = {
      id: 9,
      settings: {
        homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
        homepage_widget_sizes: { hero: { row: 2 } },
        sleep_time: "22:00",
        wake_time: "06:00",
      },
    };
    localStorage.setItem("homepage_widget_source_9", JSON.stringify({
      layout: ["hero"],
      sizes: { hero: { row: 1 } },
    }));

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {
          sortedEvents: [
            { id: 1, source: "timetable", title: "Lecture", start_time: "2026-03-26T09:00:00Z", end_time: "2026-03-26T10:00:00Z" },
          ],
          taskWidgetItemsOnly: [{ id: 2, completed: false }],
          now: new Date("2026-03-26T09:00:00Z"),
          navigatorContext: { overlaps: [] },
        },
      })
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(30);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(result.current.layout).toEqual(["todayTasks", "hero", "analyticsHeatmap"]);
    expect(result.current.widgetSizes).toEqual({ hero: { row: 2 } });
    expect(result.current.attendance).toEqual({ loading: false, pct: 80 });
    expect(result.current.courseChangeRequest).toEqual({ status: "pending", requested_course: "CS" });
    expect(result.current.analytics).toEqual({ summary: "ok" });
    expect(result.current.live.liveContext).toEqual({ label: "Right now" });
    expect(result.current.tflDelays).toEqual([{ id: 1 }]);
    expect(updateUserSettingsMock).toHaveBeenCalledWith({
      homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
      homepage_widget_sizes: { hero: { row: 2 } },
    });
    vi.useRealTimers();
  });

  it("normalizes invalid stored data and skips analytics when no analytics widgets exist", async () => {
    localStorage.setItem("homepage_widget_layout", "not-json");
    localStorage.setItem("homepage_widget_sizes", "not-json");
    getMyCourseChangeRequestMock.mockRejectedValueOnce(new Error("down"));
    tflServiceMock.getTfLDelays.mockResolvedValueOnce("bad");
    useAttendanceStatsMock.mockReturnValue({ loading: true, stats: null });
    useAnalyticsOverviewMock.mockReturnValue(null);

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile: null,
        profileLoading: false,
        slot5Data: {},
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.attendance.pct).toBe(0);
    expect(result.current.layout).toEqual(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(result.current.widgetSizes).toEqual({});
    expect(result.current.analytics).toBeNull();
    expect(result.current.courseChangeRequest).toBeNull();
    expect(result.current.tflDelays).toEqual([]);
    expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(null);
  });

  it("uses the academic-session rules when building live summary", () => {
    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile: { id: 1, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: {} } },
        profileLoading: true,
        slot5Data: {
          sortedEvents: [
            { source: "society", title: "Society event" },
            { source: "timetable", title: "Lecture" },
            { source: "module_cs", title: "Module session" },
            { source: "other", tag_name: "tutorial", title: "Tutorial copy" },
            { source: "other", description: "small group discussion" },
            { source: "other", title: "Chore" },
          ],
          taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }],
          now: new Date("2026-03-26T09:00:00Z"),
          navigatorContext: { overlaps: [] },
        },
      })
    );

    expect(result.current.live.eventsCount).toBe(6);
    expect(result.current.live.classesCount).toBe(4);
    expect(result.current.live.tasksCount).toBe(1);
    expect(result.current.live.liveContext).toEqual({ label: "Right now" });
    expect(getLiveContextMock).toHaveBeenCalled();
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeTruthy();
  });

  it("falls back to stored widgets when server settings are already synced", async () => {
    vi.useFakeTimers();
    const profile = {
      id: 11,
      settings: {
        homepage_widgets: ["hero"],
        homepage_widget_sizes: { hero: { row: 2 } },
      },
    };

    localStorage.setItem("homepage_widget_layout_11", JSON.stringify(["deadlines", "deadlines", "unknown"]));
    localStorage.setItem("homepage_widget_sizes_11", JSON.stringify({ deadlines: { row: 1 } }));
    localStorage.setItem("homepage_widget_source_11", JSON.stringify({
      layout: ["hero"],
      sizes: { hero: { row: 2 } },
    }));

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {},
      })
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.layout).toEqual(["hero", "deadlines"]);
    expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
    expect(updateUserSettingsMock).toHaveBeenCalledWith({
      homepage_widgets: ["hero", "deadlines"],
      homepage_widget_sizes: { deadlines: { row: 1 } },
    });
    vi.useRealTimers();
  });

  it("returns null progress when the term config is invalid", () => {
    loadTermConfigMock.mockReturnValueOnce({ startDate: "bad-date", totalWeeks: 10 });
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeNull();
  });

  it("does not cloud sync when the profile is missing or still loading", () => {
    renderHook(() =>
      useIntelligenceDashboard({
        profile: null,
        profileLoading: false,
        slot5Data: {},
      })
    );

    renderHook(() =>
      useIntelligenceDashboard({
        profile: { id: 1, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: {} } },
        profileLoading: true,
        slot5Data: {},
      })
    );

    expect(updateUserSettingsMock).not.toHaveBeenCalled();
  });

  it("randomizes layout while keeping hero pinned when present", () => {
    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile: null,
        profileLoading: false,
        slot5Data: {},
      })
    );

    act(() => {
      result.current.setLayout(["deadlines", "hero", "todayTasks"]);
      result.current.handleRandomize();
    });
    expect(result.current.layout[0]).toBe("hero");
    expect(new Set(result.current.layout)).toEqual(new Set(["hero", "deadlines", "todayTasks"]));

    act(() => {
      result.current.setLayout(["deadlines", "todayTasks"]);
      result.current.handleRandomize();
    });
    expect(result.current.layout).not.toContain(undefined);
    expect(new Set(result.current.layout)).toEqual(new Set(["deadlines", "todayTasks"]));
  });
});
