/*
 * Tests for homepage intelligence dashboard state, storage, and synchronisation behaviour.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  tflServiceMock,
  getMyCourseChangeRequestMock,
  updateUserSettingsMock,
  attendanceStatsSpy,
  getAttendancePercentageMock,
  loadTermConfigMock,
  getCurrentEventMock,
  getUpcomingEventMock,
  getLiveContextMock,
  getRelevantDelaysMock,
  isSevereDisruptionMock,
  analyticsOverviewSpy,
} = vi.hoisted(() => ({
  tflServiceMock: { getTfLDelays: vi.fn() },
  getMyCourseChangeRequestMock: vi.fn(),
  updateUserSettingsMock: vi.fn(),
  attendanceStatsSpy: vi.fn(),
  getAttendancePercentageMock: vi.fn(),
  loadTermConfigMock: vi.fn(),
  getCurrentEventMock: vi.fn(),
  getUpcomingEventMock: vi.fn(),
  getLiveContextMock: vi.fn(),
  getRelevantDelaysMock: vi.fn(),
  isSevereDisruptionMock: vi.fn(),
  analyticsOverviewSpy: vi.fn(),
}));

vi.mock("../../../../api/tflApi", () => ({ tflService: tflServiceMock }));
vi.mock("../../../../api/adminApi", () => ({ getMyCourseChangeRequest: (...args) => getMyCourseChangeRequestMock(...args) }));
vi.mock("../../../../api/userApi", () => ({ updateUserSettings: (...args) => updateUserSettingsMock(...args) }));
vi.mock("../../../../components/analytics/useAttendanceStats", () => ({ default: attendanceStatsSpy }));
vi.mock("../../../../components/analytics/attendanceChartConfig", () => ({ getAttendancePercentage: (...args) => getAttendancePercentageMock(...args) }));
vi.mock("../../../../lib/termConfig", () => ({ loadTermConfig: (...args) => loadTermConfigMock(...args) }));
vi.mock("../../../../pages/homepage/components/IntelligenceUtils", () => ({
  getCurrentEvent: (...args) => getCurrentEventMock(...args),
  getLiveContext: (...args) => getLiveContextMock(...args),
  getUpcomingEvent: (...args) => getUpcomingEventMock(...args),
}));
vi.mock("../../../../pages/homepage/utils/kclTflMapping", () => ({
  getRelevantDelays: (...args) => getRelevantDelaysMock(...args),
  isSevereDisruption: (...args) => isSevereDisruptionMock(...args),
}));
vi.mock("../../../../pages/analytics/hooks/useAnalyticsOverview", () => ({ default: analyticsOverviewSpy }));

import { getSemesterProgress, useIntelligenceDashboard } from "../../../../pages/homepage/hooks/useIntelligenceDashboard";

const DEFAULT_LAYOUT = ["hero", "deadlines", "todayTasks", "bigTimeline"];

const buildFullProfile = () => ({
  id: 9,
  settings: {
    homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
    homepage_widget_sizes: { hero: { row: 2 } },
    sleep_time: "22:00",
    wake_time: "06:00",
  },
});

const buildFullSlot5 = () => ({
  sortedEvents: [{ id: 1, source: "timetable", title: "Lecture", start_time: "2026-03-26T09:00:00Z", end_time: "2026-03-26T10:00:00Z" }],
  taskWidgetItemsOnly: [{ id: 2, completed: false }],
  now: new Date("2026-03-26T09:00:00Z"),
  navigatorContext: { overlaps: [] },
});

function buildProfile(id, settings = {}) {
  return { id, settings: { homepage_widgets: ["hero"], homepage_widget_sizes: {}, ...settings } };
}

function buildStorageKey(base, userId) {
  return userId ? `${base}_${userId}` : base;
}

function storeWidgetState(userId, values) {
  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(buildStorageKey(`homepage_widget_${key}`, userId), JSON.stringify(value));
  });
}

function renderDashboard(options = {}) {
  return renderHook(() =>
    useIntelligenceDashboard({ profile: null, profileLoading: false, slot5Data: {}, ...options }),
  );
}

async function flushEffects() {
  await act(async () => { await Promise.resolve(); });
}

async function flushCloudSync() {
  await act(async () => {
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
  });
}

async function runWithFakeTimers(callback) {
  vi.useFakeTimers();
  try {
    await callback();
  } finally {
    vi.useRealTimers();
  }
}

describe("useIntelligenceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tflServiceMock.getTfLDelays.mockResolvedValue([{ id: 1 }]);
    getMyCourseChangeRequestMock.mockResolvedValue({ status: "pending", requested_course: "CS" });
    updateUserSettingsMock.mockResolvedValue({});
    attendanceStatsSpy.mockReturnValue({ loading: false, stats: { overall: 80 } });
    getAttendancePercentageMock.mockReturnValue(80);
    loadTermConfigMock.mockReturnValue({ startDate: "2026-01-12", totalWeeks: 10, hasReadingWeek: false });
    getCurrentEventMock.mockReturnValue(null);
    getUpcomingEventMock.mockReturnValue(null);
    getLiveContextMock.mockReturnValue({ label: "Right now" });
    getRelevantDelaysMock.mockReturnValue([]);
    isSevereDisruptionMock.mockReturnValue(false);
    analyticsOverviewSpy.mockReturnValue({ summary: "ok" });
  });

  it("prefers server settings when loading dashboard data", async () => {
    await runWithFakeTimers(async () => {
      storeWidgetState(9, { source: { layout: ["hero"], sizes: { hero: { row: 1 } } } });
      const { result } = renderDashboard({ profile: buildFullProfile(), slot5Data: buildFullSlot5() });
      await flushCloudSync();
      expect(analyticsOverviewSpy).toHaveBeenCalledWith(30);
      expect(result.current.layout).toEqual(["todayTasks", "hero", "analyticsHeatmap"]);
      expect(result.current.widgetSizes).toEqual({ hero: { row: 2 } });
    });
  });

  it("schedules cloud synchronisation and populates results", async () => {
    await runWithFakeTimers(async () => {
      const { result } = renderDashboard({ profile: buildFullProfile(), slot5Data: buildFullSlot5() });
      await flushCloudSync();
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
    });
  });

  it("normalises invalid stored data", async () => {
    localStorage.setItem("homepage_widget_layout", "not-json");
    localStorage.setItem("homepage_widget_sizes", "not-json");
    const { result } = renderDashboard();
    await flushEffects();
    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
    expect(result.current.widgetSizes).toEqual({});
  });

  it("skips analytics when no analytics widgets exist", async () => {
    attendanceStatsSpy.mockReturnValue({ loading: true, stats: null });
    analyticsOverviewSpy.mockReturnValue(null);
    const { result } = renderDashboard();
    await flushEffects();
    expect(result.current.attendance.pct).toBe(0);
    expect(result.current.analytics).toBeNull();
    expect(analyticsOverviewSpy).toHaveBeenCalledWith(null);
  });

  it("uses academic-session rules when building the live summary", async () => {
    const slot5Data = {
      sortedEvents: [{ source: "society", title: "S" }, { source: "timetable", title: "L" }, { source: "module_cs", title: "M" }, { source: "other", tag_name: "tutorial", title: "T" }, { source: "other", description: "small" }, { source: "other", title: "C" }],
      taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }],
      now: new Date("2026-03-26T09:00:00Z"),
      navigatorContext: { overlaps: [] },
    };
    const { result } = renderDashboard({ profile: buildProfile(1), profileLoading: true, slot5Data });
    await flushEffects();
    expect(result.current.live.eventsCount).toBe(6);
    expect(result.current.live.classesCount).toBe(3);
    expect(result.current.live.tasksCount).toBe(1);
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeTruthy();
  });

  it("falls back to stored widgets when server settings are already synchronised", async () => {
    await runWithFakeTimers(async () => {
      storeWidgetState(11, {
        layout: ["deadlines", "deadlines", "unknown"],
        sizes: { deadlines: { row: 1 } },
        source: { layout: ["hero"], sizes: { hero: { row: 2 } } },
      });
      const { result } = renderDashboard({ profile: buildProfile(11, { homepage_widgets: ["hero"], homepage_widget_sizes: { hero: { row: 2 } } }) });
      await flushCloudSync();
      expect(result.current.layout).toEqual(["hero", "deadlines"]);
      expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
      expect(updateUserSettingsMock).toHaveBeenCalledWith({
        homepage_widgets: ["hero", "deadlines"],
        homepage_widget_sizes: { deadlines: { row: 1 } },
      });
    });
  });

  it("returns null progress when the term config is invalid", () => {
    loadTermConfigMock.mockReturnValueOnce({ startDate: "bad-date", totalWeeks: 10 });
    expect(getSemesterProgress(new Date("2026-03-26"))).toBeNull();
  });

  it("does not cloud sync when the profile is missing or still loading", async () => {
    renderDashboard();
    renderDashboard({ profile: buildProfile(1), profileLoading: true });
    await flushEffects();
    expect(updateUserSettingsMock).not.toHaveBeenCalled();
  });

  it("randomises layout while keeping hero pinned when present", async () => {
    const { result } = renderDashboard();
    await flushEffects();
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

  it("handles empty delay payloads and dashboard action setters", async () => {
    await runWithFakeTimers(async () => {
      tflServiceMock.getTfLDelays.mockResolvedValueOnce(null);
      getMyCourseChangeRequestMock.mockRejectedValueOnce(new Error("nope"));
      const { result } = renderDashboard({ profile: buildProfile(7) });
      await flushCloudSync();
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

  it("treats requested courses as pending and honours stored defaults", async () => {
    await runWithFakeTimers(async () => {
      getMyCourseChangeRequestMock.mockResolvedValueOnce({ requested_course: "Maths", status: "" });
      loadTermConfigMock.mockReturnValueOnce({ startDate: "2026-03-24", totalWeeks: 0, hasReadingWeek: true });
      storeWidgetState(15, { layout: ["unknown", "deadlines"], sizes: { deadlines: { row: 1 } } });
      const profile = buildProfile(15, { homepage_widgets: [], homepage_widget_sizes: "invalid" });
      const slot5Data = { sortedEvents: [{ source: "", tag: { name: "Seminar" }, title: "", description: "" }], taskWidgetItemsOnly: [] };
      const { result } = renderDashboard({ profile, slot5Data });
      await flushCloudSync();
      expect(result.current.layout).toEqual(["hero", "deadlines"]);
      expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
      expect(result.current.live.classesCount).toBe(1);
      expect(result.current.courseChangeRequest).toEqual({ requested_course: "Maths", status: "" });
      expect(getSemesterProgress(new Date("2026-03-26"))).toEqual({ hasStarted: true, isFinished: false, pct: 43 });
    });
  });

  it("falls back to stored widget sizes when the server has sizes but no layout", async () => {
    const profile = buildProfile(21, { homepage_widgets: [], homepage_widget_sizes: { deadlines: { row: 1 } } });
    const { result } = renderDashboard({ profile });
    await flushEffects();
    expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
  });

  it("handles rejected TfL loads and cloud sync failures", async () => {
    await runWithFakeTimers(async () => {
      tflServiceMock.getTfLDelays.mockRejectedValueOnce(new Error("tfl down"));
      getMyCourseChangeRequestMock.mockResolvedValueOnce({ status: "approved", requested_course: "CS" });
      updateUserSettingsMock.mockRejectedValueOnce(new Error("save failed"));
      storeWidgetState(30, { layout: "not-an-array" });
      const { result } = renderDashboard({ profile: buildProfile(30, { homepage_widgets: [], homepage_widget_sizes: {} }) });
      await flushCloudSync();
      expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
      expect(result.current.tflDelays).toEqual([]);
      expect(result.current.courseChangeRequest).toBeNull();
      expect(updateUserSettingsMock).toHaveBeenCalledTimes(1);
      expect(getSemesterProgress(new Date("2026-04-01"))).toEqual({ hasStarted: true, isFinished: true, pct: 100 });
    });
  });

  it("synchronises server layouts with empty widget sizes", async () => {
    const profile = buildProfile(31, { homepage_widgets: ["todayTasks", "hero"], homepage_widget_sizes: null });
    const { result } = renderDashboard({ profile });
    await flushEffects();
    expect(result.current.layout).toEqual(["todayTasks", "hero"]);
    expect(result.current.widgetSizes).toEqual({});
  });

  it("stores sorted widget-size snapshots when synchronising from profile settings", async () => {
    renderDashboard({
      profile: buildProfile(32, { homepage_widgets: ["todayTasks", "hero"], homepage_widget_sizes: { todayTasks: { row: 1 }, hero: { row: 2 } } }),
    });
    await flushEffects();
    const storedSource = JSON.parse(localStorage.getItem("homepage_widget_source_32"));
    expect(storedSource.layout).toEqual(["todayTasks", "hero"]);
    expect(Object.keys(storedSource.sizes)).toEqual(["hero", "todayTasks"]);
  });
});
