/*
 * Shared mocks and builders for intelligence dashboard hook tests.
 */

import { vi } from "vitest";

const hoistedMocks = vi.hoisted(() => ({
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

export const {
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
} = hoistedMocks;

vi.mock("../../../../api/tflApi", () => ({
  tflService: tflServiceMock,
}));

vi.mock("../../../../api/adminApi", () => ({
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequestMock(...args),
}));

vi.mock("../../../../api/userApi", () => ({
  updateUserSettings: (...args) => updateUserSettingsMock(...args),
}));

vi.mock("../../../../components/analytics/hooks/useAttendanceStats", () => ({
  default: () => useAttendanceStatsMock(),
}));

vi.mock("../../../../components/analytics/utils/attendanceChartConfig", () => ({
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

/** Resets intelligence dashboard mocks to their default behaviour. */
export function resetIntelligenceDashboardMocks() {
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
}

/** Builds the populated profile used by the dashboard hook tests. */
export function buildFullProfile() {
  return {
    id: 9,
    settings: {
      homepage_widgets: ["todayTasks", "hero", "analyticsHeatmap"],
      homepage_widget_sizes: { hero: { row: 2 } },
      sleep_time: "22:00",
      wake_time: "06:00",
    },
  };
}

/** Builds a standard slot-five payload for the dashboard hook tests. */
export function buildFullSlot5() {
  return {
    sortedEvents: [{ id: 1, source: "timetable", title: "Lecture", start_time: "2026-03-26T09:00:00Z", end_time: "2026-03-26T10:00:00Z" }],
    taskWidgetItemsOnly: [{ id: 2, completed: false }],
    now: new Date("2026-03-26T09:00:00Z"),
    navigatorContext: { overlaps: [] },
  };
}

/** Builds a dashboard profile with sensible default homepage settings. */
export function createDashboardProfile(id, settings = {}) {
  return {
    id,
    settings: {
      homepage_widgets: ["hero"],
      homepage_widget_sizes: {},
      ...settings,
    },
  };
}
