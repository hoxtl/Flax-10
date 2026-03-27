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

vi.mock("../../../../components/analytics/useAttendanceStats", () => ({
  default: () => useAttendanceStatsMock(),
}));

vi.mock("../../../../components/analytics/attendanceChartConfig", () => ({
  getAttendancePercentage: (...args) => getAttendancePercentageMock(...args),
}));

vi.mock("../../../../lib/termConfig", () => ({
  loadTermConfig: (...args) => loadTermConfigMock(...args),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceUtils", () => ({
  getCurrentEvent: (...args) => getCurrentEventMock(...args),
  getLiveContext: (...args) => getLiveContextMock(...args),
  getUpcomingEvent: (...args) => getUpcomingEventMock(...args),
}));

vi.mock("../../../../pages/homepage/utils/kclTflMapping", () => ({
  getRelevantDelays: (...args) => getRelevantDelaysMock(...args),
  isSevereDisruption: (...args) => isSevereDisruptionMock(...args),
}));

vi.mock("../../../../pages/analytics/hooks/useAnalyticsOverview", () => ({
  default: (...args) => useAnalyticsOverviewMock(...args),
}));

import {
  getSemesterProgress,
  useIntelligenceDashboard,
} from "../../../../pages/homepage/hooks/useIntelligenceDashboard";

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

  const buildFullProfile = () => ({
    id: 9,
    settings: {
      homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
      homepage_widget_sizes: { hero: { row: 2 } },
      sleep_time: "22:00", wake_time: "06:00",
    },
  });
  const buildFullSlot5 = () => ({
    sortedEvents: [{ id: 1, source: "timetable", title: "Lecture", start_time: "2026-03-26T09:00:00Z", end_time: "2026-03-26T10:00:00Z" }],
    taskWidgetItemsOnly: [{ id: 2, completed: false }],
    now: new Date("2026-03-26T09:00:00Z"),
    navigatorContext: { overlaps: [] },
  });
  it("prefers server settings and loads dashboard data", async () => {
    vi.useFakeTimers();
    localStorage.setItem("homepage_widget_source_9", JSON.stringify({ layout: ["hero"], sizes: { hero: { row: 1 } } }));
    const { result } = renderHook(() => useIntelligenceDashboard({ profile: buildFullProfile(), profileLoading: false, slot5Data: buildFullSlot5() }));
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(2000); await Promise.resolve(); });
    expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(30);
    expect(result.current.layout).toEqual(["todayTasks", "hero", "analyticsHeatmap"]);
    expect(result.current.widgetSizes).toEqual({ hero: { row: 2 } });
    vi.useRealTimers();
  });
  it("schedules cloud sync and populates results", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIntelligenceDashboard({ profile: buildFullProfile(), profileLoading: false, slot5Data: buildFullSlot5() }));
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(2000); await Promise.resolve(); });
    act(() => { vi.runOnlyPendingTimers(); });
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

  it("normalizes invalid stored data", async () => {
    localStorage.setItem("homepage_widget_layout", "not-json");
    localStorage.setItem("homepage_widget_sizes", "not-json");
    const { result } = renderHook(() => useIntelligenceDashboard({ profile: null, profileLoading: false, slot5Data: {} }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.layout).toEqual(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(result.current.widgetSizes).toEqual({});
  });
  it("skips analytics when no analytics widgets exist", async () => {
    useAttendanceStatsMock.mockReturnValue({ loading: true, stats: null });
    useAnalyticsOverviewMock.mockReturnValue(null);
    const { result } = renderHook(() => useIntelligenceDashboard({ profile: null, profileLoading: false, slot5Data: {} }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.attendance.pct).toBe(0);
    expect(result.current.analytics).toBeNull();
    expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(null);
  });

  it("uses the academic-session rules when building live summary", () => {
    const slot5Data = {
      sortedEvents: [{ source: "society", title: "S" }, { source: "timetable", title: "L" }, { source: "module_cs", title: "M" }, { source: "other", tag_name: "tutorial", title: "T" }, { source: "other", description: "small" }, { source: "other", title: "C" }],
      taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }],
      now: new Date("2026-03-26T09:00:00Z"), navigatorContext: { overlaps: [] },
    };
    const { result } = renderHook(() => useIntelligenceDashboard({ profile: { id: 1, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: {} } }, profileLoading: true, slot5Data }));
    expect(result.current.live.eventsCount).toBe(6);
    expect(result.current.live.classesCount).toBe(3);
    expect(result.current.live.tasksCount).toBe(1);
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeTruthy();
  });

  it("falls back to stored widgets when server settings are already synced", async () => {
    vi.useFakeTimers();
    const profile = { id: 11, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: { hero: { row: 2 } } } };
    localStorage.setItem("homepage_widget_layout_11", JSON.stringify(["deadlines", "deadlines", "unknown"]));
    localStorage.setItem("homepage_widget_sizes_11", JSON.stringify({ deadlines: { row: 1 } }));
    localStorage.setItem("homepage_widget_source_11", JSON.stringify({ layout: ["hero"], sizes: { hero: { row: 2 } } }));
    const { result } = renderHook(() => useIntelligenceDashboard({ profile, profileLoading: false, slot5Data: {} }));
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(2000); await Promise.resolve(); });
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

  it("handles non-array delay payloads, rejected course requests, and dashboard action setters", async () => {
    vi.useFakeTimers();
    tflServiceMock.getTfLDelays.mockResolvedValueOnce(null);
    getMyCourseChangeRequestMock.mockRejectedValueOnce(new Error("nope"));

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile: { id: 7, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: {} } },
        profileLoading: false,
        slot5Data: {},
      }),
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    act(() => {
      result.current.setEdit(true);
      result.current.setShowAdd(true);
      result.current.setShowCourseChange(false);
      result.current.handleReset();
      result.current.setWidgetSize("hero", { row: 3 });
    });

    expect(result.current.tflDelays).toEqual([]);
    expect(result.current.courseChangeRequest).toBeNull();
    expect(result.current.edit).toBe(true);
    expect(result.current.showAdd).toBe(true);
    expect(result.current.showResetConfirm).toBe(true);
    expect(result.current.widgetSizes).toEqual({ hero: { row: 3 } });
    vi.useRealTimers();
  });

  it("treats requested courses as pending, falls back to stored defaults, and handles minimum term length", async () => {
    vi.useFakeTimers();
    getMyCourseChangeRequestMock.mockResolvedValueOnce({ requested_course: "Maths", status: "" });
    loadTermConfigMock.mockReturnValueOnce({ startDate: "2026-03-24", totalWeeks: 0, hasReadingWeek: true });

    const profile = {
      id: 15,
      settings: {
        homepage_widgets: [],
        homepage_widget_sizes: "invalid",
      },
    };
    localStorage.setItem("homepage_widget_layout_15", JSON.stringify(["unknown", "deadlines"]));
    localStorage.setItem("homepage_widget_sizes_15", JSON.stringify({ deadlines: { row: 1 } }));

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {
          sortedEvents: [{ source: "", tag: { name: "Seminar" }, title: "", description: "" }],
          taskWidgetItemsOnly: [],
        },
      }),
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.layout).toEqual(["hero", "deadlines"]);
    expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
    expect(result.current.live.classesCount).toBe(1);
    expect(result.current.courseChangeRequest).toEqual({ requested_course: "Maths", status: "" });
    expect(getSemesterProgress(new Date("2026-03-26"))).toEqual({ hasStarted: true, isFinished: false, pct: 43 });
    vi.useRealTimers();
  });

  it("falls back to stored widget sizes when the server has sizes but no layout", async () => {
    const profile = {
      id: 21,
      settings: {
        homepage_widgets: [],
        homepage_widget_sizes: { deadlines: { row: 1 } },
      },
    };

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {},
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
  });

  it("handles rejected TfL loads, approved course requests, non-array stored layouts, and cloud sync failures", async () => {
    vi.useFakeTimers();
    tflServiceMock.getTfLDelays.mockRejectedValueOnce(new Error("tfl down"));
    getMyCourseChangeRequestMock.mockResolvedValueOnce({ status: "approved", requested_course: "CS" });
    updateUserSettingsMock.mockRejectedValueOnce(new Error("save failed"));
    localStorage.setItem("homepage_widget_layout_30", JSON.stringify("not-an-array"));

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile: { id: 30, settings: { homepage_widgets: [], homepage_widget_sizes: {} } },
        profileLoading: false,
        slot5Data: {},
      }),
    );

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.layout).toEqual(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(result.current.tflDelays).toEqual([]);
    expect(result.current.courseChangeRequest).toBeNull();
    expect(updateUserSettingsMock).toHaveBeenCalledTimes(1);
    expect(getSemesterProgress()).toEqual({ hasStarted: true, isFinished: true, pct: 100 });
    vi.useRealTimers();
  });

  it("syncs server layouts with empty widget sizes", async () => {
    const profile = {
      id: 31,
      settings: {
        homepage_widgets: ["todayTasks", "hero"],
        homepage_widget_sizes: null,
      },
    };

    const { result } = renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {},
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.layout).toEqual(["todayTasks", "hero"]);
    expect(result.current.widgetSizes).toEqual({});
  });

  it("stores sorted server widget-size snapshots when syncing from profile settings", async () => {
    const profile = {
      id: 32,
      settings: {
        homepage_widgets: ["todayTasks", "hero"],
        homepage_widget_sizes: {
          todayTasks: { row: 1 },
          hero: { row: 2 },
        },
      },
    };

    renderHook(() =>
      useIntelligenceDashboard({
        profile,
        profileLoading: false,
        slot5Data: {},
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    const storedSource = JSON.parse(localStorage.getItem("homepage_widget_source_32"));
    expect(storedSource.layout).toEqual(["todayTasks", "hero"]);
    expect(Object.keys(storedSource.sizes)).toEqual(["hero", "todayTasks"]);
  });
});
