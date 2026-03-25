import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isTodayMock = vi.fn();
const overlapsDayMock = vi.fn();
const getTaskDurationMinutesMock = vi.fn();
const getTasksThatFitWindowMock = vi.fn();

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
  overlapsDay: (...args) => overlapsDayMock(...args),
}));

vi.mock("../../../lib/focusPlanner", () => ({
  getTaskDurationMinutes: (...args) => getTaskDurationMinutesMock(...args),
  getTasksThatFitWindow: (...args) => getTasksThatFitWindowMock(...args),
}));

import {
  formatHour12h,
  formatTime,
  formatTime12h,
  formatTimeHHMM,
  fmtDurationShort,
} from "../../../pages/Homepage/utils/dateFormatUtils";
import {
  extractModuleCode,
  isLecture,
  isNow,
  isRoutineEvent,
  stripEmojiFromTitle,
} from "../../../pages/Homepage/utils/eventUtils";
import {
  getRelevantDelays,
  getTflLineColor,
  getTflLinePillStyle,
  getTflLinesForLocation,
  isSevereDisruption,
} from "../../../pages/Homepage/utils/kclTflMapping";
import {
  getAllFreeWindowsToday,
  getNextFreeSlotToday,
  isNightSlot,
} from "../../../pages/Homepage/utils/slotUtils";
import {
  calculateSeedsByCategory,
  getTasksThatFitGap,
  isAutoPassedTask,
  isRoutineOrEventTask,
  taskDurationMins,
} from "../../../pages/Homepage/utils/taskUtils";
import {
  computeTimelineWithGaps,
  getDailyEnergyPercent,
  getDailyNarrative,
  getGapStartDate,
  getNowLinePercent,
  getPeakHours,
  getSmartWindowLabel,
  getUrgencyLevel,
  groupOverlaps,
  minsFromDayStart,
} from "../../../pages/Homepage/utils/timelineUtils";

describe("homepage utility coverage extras", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T08:00:00.000Z"));
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
    getTaskDurationMinutesMock.mockImplementation((task) => task.mockDuration ?? 25);
    getTasksThatFitWindowMock.mockImplementation((tasks, gapMinutes) => (tasks || []).filter((task) => (task.fitMinutes ?? 0) <= gapMinutes));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers date formatting helpers across empty, short, and 12-hour cases", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("2026-03-24T08:05:00.000Z")).toMatch(/08:05/);

    expect(formatTimeHHMM(new Date("2026-03-24T08:05:00.000Z"))).toBe("08:05");
    expect(formatTimeHHMM("2026-03-24T14:30:00.000Z")).toBe("14:30");

    expect(fmtDurationShort(null)).toBe("");
    expect(fmtDurationShort(-5)).toBe("");
    expect(fmtDurationShort(45)).toBe("45m");
    expect(fmtDurationShort(60)).toBe("1h");
    expect(fmtDurationShort(95)).toBe("1h 35m");

    expect(formatTime12h("")).toBe("");
    expect(formatTime12h("2026-03-24T00:00:00.000Z")).toBe("12am");
    expect(formatTime12h("2026-03-24T12:00:00.000Z")).toBe("12pm");
    expect(formatTime12h("2026-03-24T14:30:00.000Z")).toBe("2:30pm");

    expect(formatHour12h(0)).toBe("12am");
    expect(formatHour12h(12)).toBe("12pm");
    expect(formatHour12h(14, 30)).toBe("2:30pm");
  });

  it("covers homepage event helpers for emoji stripping, lecture detection, routines, now checks, and module codes", () => {
    expect(stripEmojiFromTitle(undefined)).toBe("");
    expect(stripEmojiFromTitle(42)).toBe(42);
    expect(stripEmojiFromTitle("📚  Lunch  ✨")).toBe("Lunch");

    expect(isLecture({ title: "Algorithms lecture" })).toBe(true);
    expect(isLecture({ title: "Study block", source: "timetable" })).toBe(true);
    expect(isLecture({ source: "timetable" })).toBe(true);
    expect(isLecture({ title: "Groceries" })).toBe(false);

    expect(isRoutineEvent({ tag_name: "routine" })).toBe(true);
    expect(isRoutineEvent({ tag: { name: "wellness" } })).toBe(true);
    expect(isRoutineEvent({ title: "Lunch with friends" })).toBe(true);
    expect(isRoutineEvent({ title: "Deep work" })).toBe(false);

    expect(isNow()).toBe(false);
    expect(isNow("2026-03-24T07:30:00.000Z", "2026-03-24T08:30:00.000Z")).toBe(true);
    expect(isNow("2026-03-24T09:00:00.000Z", "2026-03-24T10:00:00.000Z")).toBe(false);

    expect(extractModuleCode("Meet CS1234 team")).toBe("CS1234");
    expect(extractModuleCode("No code here")).toBeNull();
    expect(extractModuleCode()).toBeNull();
  });

  it("covers TfL mapping helpers, fallbacks, and disruption severity detection", () => {
    expect(getTflLinesForLocation("Guy’s Campus")).toContain("Northern");
    expect(getTflLinesForLocation("Strand Campus")).toContain("Central");
    expect(getTflLinesForLocation("")).toEqual([]);

    const delays = [
      { lineName: "Northern", severityDescription: "Minor delays" },
      { lineName: "District", severityDescription: "Good service" },
    ];

    expect(getRelevantDelays(null, delays)).toEqual([]);
    expect(getRelevantDelays({ location: "Unknown" }, delays)).toEqual([]);
    expect(getRelevantDelays({ location: "Guy's Campus" }, delays)).toEqual([{ lineName: "Northern", severityDescription: "Minor delays" }]);
    expect(getRelevantDelays({ title: "Lecture at Strand Campus" }, delays)).toEqual([
      { lineName: "Northern", severityDescription: "Minor delays" },
      { lineName: "District", severityDescription: "Good service" },
    ]);

    expect(getTflLineColor("Waterloo & City")).toBeTruthy();
    expect(getTflLineColor("Made Up Line")).toBeTruthy();
    expect(getTflLineColor(null)).toBeTruthy();
    expect(getTflLinePillStyle("London Overground")).toEqual(expect.objectContaining({ bg: expect.any(String) }));
    expect(getTflLinePillStyle("Unknown Line")).toEqual(expect.objectContaining({ bg: expect.any(String) }));
    expect(getTflLinePillStyle(null)).toEqual(expect.objectContaining({ bg: expect.any(String) }));

    expect(isSevereDisruption("Part closure")).toBe(true);
    expect(isSevereDisruption("Good Service")).toBe(false);
    expect(isSevereDisruption("")).toBe(false);
  });

  it("covers slot helpers for today checks, night slots, free windows, and remaining-slot logic", () => {
    expect(isNightSlot()).toBe(false);
    expect(isNightSlot("2026-03-24T23:30:00.000Z")).toBe(true);
    expect(isNightSlot("2026-03-24T05:30:00.000Z")).toBe(true);
    expect(isNightSlot("2026-03-24T12:00:00.000Z")).toBe(false);

    isTodayMock.mockReturnValue(false);
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);

    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
    expect(getNextFreeSlotToday([], "2026-03-24", 0)).toBeNull();
    expect(getNextFreeSlotToday(null, "2026-03-24", 30)).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
      end: new Date("2026-03-24T08:30:00.000Z"),
    });

    const slot = getNextFreeSlotToday(
      [
        { start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
      ],
      "2026-03-24",
      30,
    );
    expect(slot).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
      end: new Date("2026-03-24T08:30:00.000Z"),
    });

    expect(
      getNextFreeSlotToday(
        [{ start_time: "2026-03-24T08:10:00.000Z", end_time: "2026-03-24T08:20:00.000Z" }],
        "2026-03-24",
        30,
      ),
    ).toMatchObject({
      start: new Date("2026-03-24T08:20:00.000Z"),
      end: new Date("2026-03-24T08:50:00.000Z"),
    });
    expect(
      getNextFreeSlotToday(
        [{ start_time: "2026-03-24T07:30:00.000Z" }],
        "2026-03-24",
        30,
      ),
    ).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
      end: new Date("2026-03-24T08:30:00.000Z"),
    });

    const windows = getAllFreeWindowsToday(
      [
        { start_time: "2026-03-24T08:10:00.000Z", end_time: "2026-03-24T08:20:00.000Z" },
        { start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
      ],
      "2026-03-24",
    );
    expect(windows[0]).toMatchObject({ minutes: 40 });
    expect(windows.some((window) => window.minutes >= 15)).toBe(true);

    expect(
      getAllFreeWindowsToday(
        [{ start_time: "2026-03-24T07:30:00.000Z" }],
        "2026-03-24",
      )[0],
    ).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
    });

    expect(
      getAllFreeWindowsToday(
        [{ start_time: "2026-03-24T08:05:00.000Z", end_time: "2026-03-24T08:10:00.000Z" }],
        "2026-03-24",
      )[0],
    ).toMatchObject({
      start: new Date("2026-03-24T08:10:00.000Z"),
    });

    vi.setSystemTime(new Date("2026-03-24T23:59:59.999Z"));
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);
    vi.setSystemTime(new Date("2026-03-24T23:50:00.000Z"));
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);
  });

  it("covers task helpers for proxy calls, routine/event detection, seeds, and auto-passed tasks", () => {
    expect(taskDurationMins({ mockDuration: 50 })).toBe(50);
    expect(getTaskDurationMinutesMock).toHaveBeenCalled();

    expect(getTasksThatFitGap([{ id: 1, fitMinutes: 20 }, { id: 2, fitMinutes: 40 }], 25)).toEqual([{ id: 1, fitMinutes: 20 }]);
    expect(getTasksThatFitWindowMock).toHaveBeenCalledWith([{ id: 1, fitMinutes: 20 }, { id: 2, fitMinutes: 40 }], 25);

    const getTag = (tagId) => ({
      1: { label: "routine" },
      2: { label: "wellness" },
      3: { label: "event" },
      4: { label: "academic" },
      5: { label: "personal" },
    }[tagId] || null);

    expect(isRoutineOrEventTask(null, getTag)).toBe(false);
    expect(isRoutineOrEventTask({ title: "Essay", tag: 1 }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ tag_name: "event" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Lecture" })).toBe(true);
    expect(isRoutineOrEventTask({ title: "Coffee run" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Tutorial prep" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Deep Work" }, getTag)).toBe(false);

    expect(calculateSeedsByCategory(null, getTag)).toEqual({ academic: 0, personal: 0 });
    expect(
      calculateSeedsByCategory(
        [{ completed: true, title: "Revision", tag_name: "study" }],
      ),
    ).toEqual({ academic: 1, personal: 0 });
    expect(calculateSeedsByCategory([{ completed: true, title: "Admin task" }])).toEqual({ academic: 0, personal: 1 });

    expect(
      calculateSeedsByCategory(
        [
          { completed: true, title: "Essay", tag: 4 },
          { completed: true, title: "Meditation", tag: 5 },
          { completed: true, title: "Lunch", tag: 1 },
          { completed: false, title: "Ignore me", tag: 4 },
        ],
        getTag,
      ),
    ).toEqual({ academic: 1, personal: 1 });

    expect(isAutoPassedTask({ title: "Essay" }, new Date("2026-03-24T10:00:00.000Z"), getTag)).toBe(false);
    expect(isAutoPassedTask({ title: "Lunch" }, new Date("2026-03-24T10:00:00.000Z"), getTag)).toBe(false);
    expect(isAutoPassedTask({ title: "Lunch", due_date: "2026-03-24T07:00:00.000Z" }, undefined, getTag)).toBe(true);
    expect(
      isAutoPassedTask(
        { title: "Lunch", due_date: "2026-03-24T11:00:00.000Z" },
        new Date("2026-03-24T10:00:00.000Z"),
        getTag,
      ),
    ).toBe(false);
    expect(
      isAutoPassedTask(
        { title: "Lunch", due_date: "2026-03-24T09:00:00.000Z" },
        new Date("2026-03-24T10:00:00.000Z"),
        getTag,
      ),
    ).toBe(true);
  });

  it("covers timeline helpers across energy, peaks, narratives, gaps, labels, and day-start math", () => {
    vi.setSystemTime(new Date("2026-03-24T05:00:00.000Z"));
    expect(getDailyEnergyPercent()).toBe(0);

    vi.setSystemTime(new Date("2026-03-24T23:30:00.000Z"));
    expect(getDailyEnergyPercent()).toBe(100);

    vi.setSystemTime(new Date("2026-03-24T14:30:00.000Z"));
    expect(getDailyEnergyPercent()).toBeGreaterThan(0);

    expect(getNowLinePercent()).toBeNull();
    expect(getNowLinePercent("2026-03-24T14:00:00.000Z", "2026-03-24T15:00:00.000Z")).toBe(50);
    expect(getNowLinePercent("2026-03-24T15:00:00.000Z", "2026-03-24T16:00:00.000Z")).toBeNull();

    expect(getPeakHours(null)).toEqual([]);
    expect(
      getPeakHours({
        data: [
          Array.from({ length: 24 }, (_, hour) => (hour === 8 ? 50 : hour === 9 ? 30 : hour === 15 ? 40 : 0)),
          Array.from({ length: 24 }, (_, hour) => (hour === 8 ? 10 : hour === 12 ? 20 : 0)),
        ],
      }).map(({ hour }) => hour),
    ).toEqual([8, 15, 9]);

    vi.setSystemTime(new Date("2026-03-24T10:00:00.000Z"));
    expect(
      getUrgencyLevel(
        [{ start_due_date: "2026-03-25T10:00:00.000Z" }],
        { daily_progress: [{ date: "2026-03-24", actual_hours: 1 }] },
      ),
    ).toBe("urgent");
    expect(getUrgencyLevel([{ start_due_date: "2026-04-10T10:00:00.000Z" }], { daily_progress: [] })).toBe("normal");
    expect(getUrgencyLevel(null, { daily_progress: [] })).toBe("normal");
    expect(getUrgencyLevel([{ start_due_date: null }], undefined)).toBe("normal");
    expect(getUrgencyLevel([{ title: "Missing due date" }], { daily_progress: [] })).toBe("normal");
    expect(
      getUrgencyLevel(
        [{ start_due_date: "2026-03-20T10:00:00.000Z" }],
        { daily_progress: [{ date: "2026-03-24", actual_hours: 3 }] },
      ),
    ).toBe("normal");

    expect(getDailyNarrative("2026-03-24", [])).toMatchObject({
      dayType: "Free",
      sessionCount: 0,
      lectureCount: 0,
      bestWindowStart: "08:00",
      bestWindowEnd: "22:00",
    });

    expect(
      getDailyNarrative("2026-03-24", [
        { title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { title: "Tutorial", start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:30:00.000Z" },
        { title: "Seminar", start_time: "2026-03-24T14:00:00.000Z", end_time: "2026-03-24T15:00:00.000Z" },
      ]).dayType,
    ).toBe("Lecture Heavy");
    expect(
      getDailyNarrative("2026-03-24", [
        { title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
      ]).dayType,
    ).toBe("Moderate");
    expect(
      getDailyNarrative("2026-03-24", null),
    ).toMatchObject({
      dayType: "Free",
      sessionCount: 0,
      lectureCount: 0,
    });
    expect(
      getDailyNarrative("2026-03-24", [
        { title: "Lecture", start_time: "2026-03-24T09:00:00.000Z" },
        { title: "Study", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
      ]).sessionCount,
    ).toBe(2);
    expect(
      getDailyNarrative("2026-03-24", [
        { title: "Study block", start_time: "2026-03-24T13:00:00.000Z", end_time: "2026-03-24T14:00:00.000Z" },
      ]).dayType,
    ).toBe("Busy");
    expect(
      getDailyNarrative("2026-03-24", [
        { title: "Lecture", start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T22:00:00.000Z" },
      ]),
    ).toMatchObject({
      bestWindowStart: null,
      bestWindowEnd: null,
    });

    expect(groupOverlaps([])).toEqual([]);
    expect(
      groupOverlaps([
        { id: 1, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { id: 2, start_time: "2026-03-24T09:30:00.000Z", end_time: "2026-03-24T10:30:00.000Z" },
        { id: 3, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
      ]).map((group) => group.type),
    ).toEqual(["cluster", "single"]);
    expect(
      groupOverlaps([
        { id: 4, start_time: "2026-03-24T09:00:00.000Z" },
        { id: 5, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      ]).map((group) => group.type),
    ).toEqual(["single", "single"]);
    expect(
      groupOverlaps([
        { id: 6, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
        { id: 7, start_time: "2026-03-24T09:30:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { id: 8, start_time: "2026-03-24T10:15:00.000Z", end_time: "2026-03-24T10:45:00.000Z" },
      ])[0].type,
    ).toBe("cluster");

    expect(computeTimelineWithGaps([], [])).toEqual([]);
    const timeline = computeTimelineWithGaps(
      [
        { id: 1, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { id: 2, title: "Study", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
      ],
      [{ id: 99, title: "Essay", estimated_blocks: 1 }],
    );
    expect(timeline.some((row) => row.type === "gap")).toBe(true);
    expect(timeline.some((row) => row.type === "item")).toBe(true);
    expect(
      computeTimelineWithGaps(
        [
          { id: 10, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: 11, title: "Seminar", start_time: "2026-03-24T09:30:00.000Z", end_time: "2026-03-24T10:30:00.000Z" },
          { id: 12, title: "Study", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
        ],
        [{ id: 101, title: "Big task", estimated_blocks: 5 }],
      ),
    ).toEqual([
      {
        type: "cluster",
        items: [
          { id: 10, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: 11, title: "Seminar", start_time: "2026-03-24T09:30:00.000Z", end_time: "2026-03-24T10:30:00.000Z" },
        ],
      },
      {
        type: "gap",
        minutes: 60,
        gapStart: new Date("2026-03-24T10:30:00.000Z"),
        suggestedTask: { id: 101, title: "Big task", estimated_blocks: 5 },
        isQuickWin: false,
      },
      {
        type: "item",
        data: { id: 12, title: "Study", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
      },
    ]);
    expect(
      computeTimelineWithGaps(
        [
          { id: 15, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z" },
          { id: 16, title: "Study", start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:30:00.000Z" },
          { id: 17, title: "Seminar", start_time: "2026-03-24T10:45:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
        ],
        [{ id: 102, title: "Default task" }],
      )[1],
    ).toMatchObject({
      type: "gap",
      suggestedTask: { id: 102, title: "Default task" },
    });
    expect(
      computeTimelineWithGaps(
        [
          { id: 18, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: 19, title: "Study", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
        ],
        [],
      )[1],
    ).toMatchObject({
      type: "gap",
      suggestedTask: null,
    });
    expect(
      computeTimelineWithGaps(
        [
          { id: 13, title: "Lecture", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: 14, title: "Study", start_time: "2026-03-24T10:20:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
        ],
        [],
      ).map((row) => row.type),
    ).toEqual(["item", "item"]);

    expect(getSmartWindowLabel(new Date("2026-03-24T06:30:00.000Z")).variant).toBe("default");
    expect(getSmartWindowLabel(new Date("2026-03-24T09:00:00.000Z")).variant).toBe("morning");
    expect(getSmartWindowLabel(new Date("2026-03-24T12:00:00.000Z")).variant).toBe("midday");
    expect(getSmartWindowLabel(new Date("2026-03-24T19:00:00.000Z")).variant).toBe("evening");
    expect(getSmartWindowLabel(new Date("2026-03-24T03:00:00.000Z")).variant).toBe("default");
    expect(getSmartWindowLabel("2026-03-24T06:30:00.000Z").variant).toBe("default");

    expect(minsFromDayStart("2026-03-24T08:30:00.000Z")).toBe(150);
    expect(minsFromDayStart(new Date("2026-03-24T06:15:00.000Z"))).toBe(15);

    expect(getGapStartDate("2026-03-24T00:00:00.000Z", 90).toISOString()).toContain("2026-03-24T07:30:00.000Z");
  });
});
