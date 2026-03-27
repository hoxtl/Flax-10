import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getOverallStats,
  getByTypeStats,
  getTotalMarked,
  computeAttendancePct,
  buildAttendanceSummary,
} from "../../../pages/attendance/utils/attendanceSummary";
import {
  buildSegmentEvents,
  buildSegmentLabel,
} from "../../../pages/attendance/utils/attendanceSegments";
import {
  buildOverallChartData,
  getEventTypeLabel,
  buildByTypeChartData,
  withByTypeColors,
} from "../../../pages/attendance/utils/attendanceChartData";
import {
  buildDonutSeries,
  buildValueFormatter,
  buildPieClickHandler,
} from "../../../pages/attendance/utils/attendanceChartUtils";
import {
  formatAttendanceEventDate,
  formatAttendanceDetailDate,
  formatDateGroupHeader,
  formatEventTime,
  isEventInPast,
} from "../../../pages/attendance/utils/attendanceEventDate";
import {
  isTimetableEvent,
  buildTimetableDateRange,
} from "../../../pages/attendance/utils/attendanceTimetable";
import {
  buildRecordsByEventId,
  buildUnmarkedEvents,
  buildMarkedEvents,
  buildMarkedEventsFromRecords,
} from "../../../pages/attendance/utils/attendanceRecords";
import { buildAttendancePageModel } from "../../../pages/attendance/utils/attendancePageModel";

const baseStatsState = {
  stats: { overall: { attended: 3, missed: 1 }, by_type: { lecture: { attended: 2, missed: 1 } } },
  loading: false,
  error: null,
  refetch: vi.fn(),
};

const buildStatsState = (overrides = {}) => ({ ...baseStatsState, ...overrides });
const buildRecordsState = (overrides = {}) => ({ recordsByEventId: new Map([[1, true], [2, false]]), refetch: vi.fn(), ...overrides });
const buildEventsState = (overrides = {}) => ({
  events: [
    { id: 1, title: "Lecture 1", start_time: "2026-03-03T10:00:00Z" },
    { id: 2, title: "Lecture 2", start_time: "2026-03-04T10:00:00Z" },
    { id: 3, title: "Lab", start_time: "2026-03-05T10:00:00Z", tag_name: "lab" },
  ],
  loading: false,
  ...overrides,
});
const buildSelectionState = (overrides = {}) => ({
  selectedSegment: { chart: "overall", label: "Attended" },
  setSelectedSegment: vi.fn(),
  listTab: "record",
  setListTab: vi.fn(),
  ...overrides,
});

const renderAttendanceModel = ({ statsState, recordsState, eventsState, selection } = {}) => {
  const stats = buildStatsState(statsState);
  const records = buildRecordsState(recordsState);
  const events = buildEventsState(eventsState);
  const selectionState = buildSelectionState(selection);
  const model = buildAttendancePageModel(selectionState, stats, records, events);
  return { model, stats, records, events, selection: selectionState };
};

const recordAttendanceMock = vi.fn();

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

describe("attendance utils", () => {
  beforeEach(() => {
    recordAttendanceMock.mockReset();
    recordAttendanceMock.mockResolvedValue({});
  });

  it("builds summary stats and safe defaults", () => {
    expect(getOverallStats()).toEqual({ attended: 0, missed: 0 });
    expect(getByTypeStats()).toEqual({});
    expect(getTotalMarked({ attended: 4, missed: 1 })).toBe(5);
    expect(computeAttendancePct({ attended: 4, missed: 1 })).toBe(80);
    expect(computeAttendancePct({ attended: 0, missed: 0 })).toBe(100);
    expect(buildAttendanceSummary({ attended: 4, missed: 1 }, 3)).toEqual({
      attended: 4,
      missed: 1,
      pct: 80,
      totalMarked: 5,
      unmarkedCount: 3,
    });
    expect(buildAttendanceSummary({ attended: 0, missed: 0 }, 2).pct).toBeNull();
  });

  it("builds segment labels and filters events by chart type", () => {
    const events = [
      { id: 1, attended: true, title: "Lecture 1" },
      { id: 2, attended: false, event_type: "Small group", title: "SG" },
      { id: 3, attended: true, tag: { name: "lab" }, title: "Practical" },
    ];

    expect(buildSegmentEvents(null, events)).toEqual([]);
    expect(buildSegmentLabel(null)).toBeNull();
    expect(buildSegmentLabel({ chart: "overall", label: "Attended" })).toBe("Overall: Attended");
    expect(buildSegmentLabel({ chart: "byType", label: "Lecture" })).toBe("By type: Lecture");
    expect(buildSegmentEvents({ chart: "overall", label: "Attended" }, events)).toEqual([events[0], events[2]]);
    expect(buildSegmentEvents({ chart: "byType", label: "Small group" }, events)).toEqual([events[1]]);
    expect(buildSegmentEvents({ chart: "other", label: "Anything" }, events)).toEqual([]);
  });

  it("builds chart data, labels, and fallback colors", () => {
    expect(buildOverallChartData()).toEqual([]);
    expect(buildOverallChartData({ attended: 3, missed: 0 })).toHaveLength(1);
    expect(buildOverallChartData({ attended: 3, missed: 2 })).toHaveLength(2);
    expect(buildOverallChartData({ attended: 0, missed: 2 })[0].label).toBe("Missed");
    expect(getEventTypeLabel({ title: "Large group lecture" })).toBe("Lecture");
    expect(getEventTypeLabel({ title: "SMG tutorial" })).toBe("Small group");
    expect(getEventTypeLabel({ description: "small group work" })).toBe("Small group");
    expect(getEventTypeLabel({ tag_name: "lab" })).toBe("Practical/lab");
    expect(getEventTypeLabel({ title: "briefing session" })).toBe("Other");
    expect(getEventTypeLabel({ tag: "unknown" })).toBe("Other");
    expect(getEventTypeLabel()).toBe("Other");
    expect(buildByTypeChartData()).toEqual([]);

    const byType = buildByTypeChartData({
      lecture: { attended: 2, missed: 1 },
      lgt: { attended: 1, missed: 0 },
      smg: { attended: 1, missed: 0 },
      lab: { attended: 0, missed: 2 },
      misc: { attended: 0, missed: 0 },
    });
    expect(byType.find((entry) => entry.label === "Lecture").value).toBe(4);
    expect(byType.find((entry) => entry.label === "Practical/lab").value).toBe(2);
    expect(withByTypeColors([{ label: "A" }, { label: "B", color: "#fff" }])[0].id).toBe(0);
  });

  describe("donut chart helpers", () => {
    it("formats values and builds consistent donut radii", () => {
      const formatter = buildValueFormatter([{ value: 3 }], 6);
      const donut = buildDonutSeries([{ value: 1 }], formatter)[0];
      expect(donut.innerRadius).toBe(40);
      expect(donut.outerRadius).toBe(90);
      expect(formatter({ value: 3 }, {})).toBe("50%");
      expect(formatter(99, { dataIndex: 0 })).toBe("50%");
    });

    it("falls back to blanks for invalid totals or payloads", () => {
      const zeroTotalFormatter = buildValueFormatter([{ value: 1 }], 0);
      expect(zeroTotalFormatter(1, {})).toBe("");
      const invalidFormatter = buildValueFormatter([{ value: 2 }], 8);
      expect(invalidFormatter("oops", {})).toBe("");
      const objectFormatter = buildValueFormatter([{ value: 4 }], 8);
      expect(objectFormatter({ value: 4 }, { dataIndex: "bad" })).toBe("50%");
    });

    it("invokes click handlers with chart and label context", () => {
      const onSegmentClick = vi.fn();
      const handler = buildPieClickHandler(onSegmentClick, "overall", [{ label: "Attended" }]);
      handler({}, { dataIndex: 0 }, {});
      expect(onSegmentClick).toHaveBeenCalledWith("overall", "Attended");
      const fallbackHandler = buildPieClickHandler(onSegmentClick, "byType", [{ label: "Lecture" }]);
      fallbackHandler({}, {}, { label: "Custom label" });
      expect(onSegmentClick).toHaveBeenCalledWith("byType", "Custom label");
      buildPieClickHandler(onSegmentClick, "byType", [])({}, {}, {});
      expect(onSegmentClick).toHaveBeenCalledTimes(2);
      expect(buildPieClickHandler(null, "overall", [])).toBeUndefined();
    });
  });

  it("formats attendance dates and timetable helpers", () => {
    expect(formatAttendanceEventDate("")).toBe("");
    expect(formatAttendanceDetailDate("")).toBe("");
    expect(formatDateGroupHeader("")).toBe("Unknown date");
    expect(formatEventTime("")).toBe("");
    expect(isEventInPast("")).toBe(false);
    expect(formatAttendanceEventDate("2026-03-01T09:30:00Z")).toBeTruthy();
    expect(formatAttendanceDetailDate("2026-03-01T09:30:00Z")).toBeTruthy();
    expect(formatDateGroupHeader("2026-03-01T09:30:00Z")).toMatch(/Sunday,?\s+1 March/);
    expect(formatEventTime("2026-03-01T09:30:00Z")).toBe("09:30");
    expect(isEventInPast("2000-03-01T09:30:00Z")).toBe(true);
    expect(isTimetableEvent({ source: "kcl", external_id: "abc" })).toBe(true);
    expect(isTimetableEvent({ source: "kcl" })).toBe(false);

    const range = buildTimetableDateRange();
    expect(new Date(range.start).toString()).not.toBe("Invalid Date");
    expect(new Date(range.end).toString()).not.toBe("Invalid Date");
  });

  it("builds record maps and marked/unmarked event collections", () => {
    const records = [
      { event_id: 1, attended: true, title: "Lecture", start_time: "2026-03-03T10:00:00Z", event_type: "Lecture" },
      { event_id: 2, attended: false, title: "", start_time: "2026-03-04T10:00:00Z", event_type: "Lab" },
    ];
    const map = buildRecordsByEventId(records);
    const events = [
      { id: 1, start_time: "2026-03-03T10:00:00Z", title: "Lecture" },
      { id: 2, start_time: "2026-03-04T10:00:00Z", title: "Lab" },
      { id: 3, start_time: "2026-03-05T10:00:00Z", title: "Free" },
      { id: 4, start_time: "2026-03-02T10:00:00Z", title: "Sooner free" },
    ];

    expect(map.get(1)).toBe(true);
    expect(buildUnmarkedEvents(events, map)).toEqual([events[3], events[2]]);
    expect(buildMarkedEvents(events, map)[0].id).toBe(2);
    expect(buildMarkedEventsFromRecords(records)[1].title).toBe("Lecture");
    expect(buildMarkedEventsFromRecords(records)[0].title).toBe("Untitled Event");
  });

  describe("attendance page model", () => {
    it("builds summary data and segment selections", () => {
      const { model } = renderAttendanceModel({ eventsState: { loading: true } });
      expect(model.summary.pct).toBe(75);
      expect(model.unmarkedEvents).toHaveLength(1);
      expect(model.segmentEvents).toHaveLength(1);
      expect(model.segmentLabel).toBe("Overall: Attended");
      expect(model.eventsLoading).toBe(true);
    });

    it("records attendance and refetches stats", async () => {
      const { model, stats, records } = renderAttendanceModel();
      await model.handleToggleStatus(11, true);
      expect(recordAttendanceMock).toHaveBeenCalledWith(11, true);
      expect(stats.refetch).toHaveBeenCalled();
      expect(records.refetch).toHaveBeenCalled();
    });

    it("updates selection state and list tabs", () => {
      const { model, selection } = renderAttendanceModel();
      model.selectSegment("byType", "Lecture");
      expect(selection.setSelectedSegment).toHaveBeenCalledWith({ chart: "byType", label: "Lecture" });
      model.selectSegment("overall", "");
      expect(selection.setSelectedSegment).toHaveBeenCalledWith(null);
      model.clearSegment();
      expect(selection.setSelectedSegment).toHaveBeenCalledWith(null);
      model.showRecordTab();
      model.showMarkedTab();
      expect(selection.setListTab).toHaveBeenCalledWith("record");
      expect(selection.setListTab).toHaveBeenCalledWith("marked");
    });
  });
});
