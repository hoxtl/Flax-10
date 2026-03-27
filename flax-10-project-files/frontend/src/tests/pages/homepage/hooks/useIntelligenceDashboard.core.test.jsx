/*
 * Core behaviour tests for the intelligence dashboard hook.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildFullProfile,
  buildFullSlot5,
  createDashboardProfile,
  getMyCourseChangeRequestMock,
  loadTermConfigMock,
  resetIntelligenceDashboardMocks,
  tflServiceMock,
  updateUserSettingsMock,
  useAnalyticsOverviewMock,
  useAttendanceStatsMock,
} from "./useIntelligenceDashboard.testSetup";
import {
  getSemesterProgress,
  useIntelligenceDashboard,
} from "../../../../pages/homepage/hooks/useIntelligenceDashboard";

function renderDashboardHook(props) {
  return renderHook(() => useIntelligenceDashboard(props));
}

async function advanceDashboardSync() {
  await act(async () => {
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
  });
}

async function withDashboardTimers(run) {
  vi.useFakeTimers();
  try {
    await run();
  } finally {
    vi.useRealTimers();
  }
}

function renderLoadedDashboard(overrides = {}) {
  return renderDashboardHook({
    profile: buildFullProfile(),
    profileLoading: false,
    slot5Data: buildFullSlot5(),
    ...overrides,
  });
}

describe("useIntelligenceDashboard core behaviour", () => {
  beforeEach(() => {
    resetIntelligenceDashboardMocks();
  });

  it("prefers server settings and loads dashboard data", async () => {
    await withDashboardTimers(async () => {
      localStorage.setItem("homepage_widget_source_9", JSON.stringify({ layout: ["hero"], sizes: { hero: { row: 1 } } }));
      const { result } = renderLoadedDashboard();
      await advanceDashboardSync();
      expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(30);
      expect(result.current.layout).toEqual(["todayTasks", "hero", "analyticsHeatmap"]);
      expect(result.current.widgetSizes).toEqual({ hero: { row: 2 } });
    });
  });

  it("schedules cloud sync and populates results", async () => {
    await withDashboardTimers(async () => {
      const { result } = renderLoadedDashboard();
      await advanceDashboardSync();
      act(() => vi.runOnlyPendingTimers());
      expect(result.current.attendance).toEqual({ loading: false, pct: 80 });
      expect(result.current.courseChangeRequest).toEqual({ status: "pending", requested_course: "CS" });
      expect(result.current.analytics).toEqual({ summary: "ok" });
      expect(result.current.live.liveContext).toEqual({ label: "Right now" });
      expect(result.current.tflDelays).toEqual([{ id: 1 }]);
      expect(updateUserSettingsMock).toHaveBeenCalledWith({
        homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
        homepage_widget_sizes: { hero: { row: 2 } },
      });
    });
  });

  it("normalises invalid stored data", async () => {
    localStorage.setItem("homepage_widget_layout", "not-json");
    localStorage.setItem("homepage_widget_sizes", "not-json");
    const { result } = renderDashboardHook({ profile: null, profileLoading: false, slot5Data: {} });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.layout).toEqual(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(result.current.widgetSizes).toEqual({});
  });

  it("skips analytics when no analytics widgets exist", async () => {
    useAttendanceStatsMock.mockReturnValue({ loading: true, stats: null });
    useAnalyticsOverviewMock.mockReturnValue(null);
    const { result } = renderDashboardHook({ profile: null, profileLoading: false, slot5Data: {} });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.attendance.pct).toBe(0);
    expect(result.current.analytics).toBeNull();
    expect(useAnalyticsOverviewMock).toHaveBeenCalledWith(null);
  });

  it("uses the academic-session rules when building the live summary", () => {
    const slot5Data = {
      sortedEvents: [{ source: "society", title: "S" }, { source: "timetable", title: "L" }, { source: "module_cs", title: "M" }, { source: "other", tag: { name: "Seminar" }, title: "T" }, { source: "other", description: "small group" }, { source: "other", title: "C" }],
      taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }],
      now: new Date("2026-03-26T09:00:00Z"),
      navigatorContext: { overlaps: [] },
    };
    const { result } = renderDashboardHook({ profile: createDashboardProfile(1), profileLoading: true, slot5Data });
    expect(result.current.live.eventsCount).toBe(6);
    expect(result.current.live.classesCount).toBe(3);
    expect(result.current.live.tasksCount).toBe(1);
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeTruthy();
  });

  it("returns null progress when the term config is invalid", () => {
    loadTermConfigMock.mockReturnValueOnce({ startDate: "bad-date", totalWeeks: 10 });
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeNull();
  });

  it("randomises the layout while keeping hero pinned when present", () => {
    const { result } = renderDashboardHook({ profile: null, profileLoading: false, slot5Data: {} });
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
    await withDashboardTimers(async () => {
      tflServiceMock.getTfLDelays.mockResolvedValueOnce(null);
      getMyCourseChangeRequestMock.mockRejectedValueOnce(new Error("nope"));
      const { result } = renderDashboardHook({ profile: createDashboardProfile(7), profileLoading: false, slot5Data: {} });
      await advanceDashboardSync();
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
    });
  });

  it("treats requested courses as pending and handles minimum term length", async () => {
    await withDashboardTimers(async () => {
      getMyCourseChangeRequestMock.mockResolvedValueOnce({ requested_course: "Maths", status: "" });
      loadTermConfigMock.mockReturnValueOnce({ startDate: "2026-03-24", totalWeeks: 0, hasReadingWeek: true });
      localStorage.setItem("homepage_widget_layout_15", JSON.stringify(["unknown", "deadlines"]));
      localStorage.setItem("homepage_widget_sizes_15", JSON.stringify({ deadlines: { row: 1 } }));
      const { result } = renderDashboardHook({ profile: { id: 15, settings: { homepage_widgets: [], homepage_widget_sizes: "invalid" } }, profileLoading: false, slot5Data: { sortedEvents: [{ source: "", tag: { name: "Seminar" }, title: "", description: "" }], taskWidgetItemsOnly: [] } });
      await advanceDashboardSync();
      expect(result.current.layout).toEqual(["hero", "deadlines"]);
      expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
      expect(result.current.live.classesCount).toBe(1);
      expect(result.current.courseChangeRequest).toEqual({ requested_course: "Maths", status: "" });
      expect(getSemesterProgress(new Date("2026-03-26"))).toEqual({ hasStarted: true, isFinished: false, pct: 43 });
    });
  });

  it("handles rejected TfL loads, approved course requests, and cloud sync failures", async () => {
    await withDashboardTimers(async () => {
      tflServiceMock.getTfLDelays.mockRejectedValueOnce(new Error("tfl down"));
      getMyCourseChangeRequestMock.mockResolvedValueOnce({ status: "approved", requested_course: "CS" });
      updateUserSettingsMock.mockRejectedValueOnce(new Error("save failed"));
      localStorage.setItem("homepage_widget_layout_30", JSON.stringify("not-an-array"));
      const { result } = renderDashboardHook({ profile: { id: 30, settings: { homepage_widgets: [], homepage_widget_sizes: {} } }, profileLoading: false, slot5Data: {} });
      await advanceDashboardSync();
      expect(result.current.layout).toEqual(["hero", "deadlines", "todayTasks", "bigTimeline"]);
      expect(result.current.tflDelays).toEqual([]);
      expect(result.current.courseChangeRequest).toBeNull();
      expect(updateUserSettingsMock).toHaveBeenCalledTimes(1);
      expect(getSemesterProgress()).toEqual({ hasStarted: true, isFinished: true, pct: 100 });
    });
  });
});
