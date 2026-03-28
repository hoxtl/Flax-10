import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const isTodayMock = vi.fn();
const overlapsDayMock = vi.fn();

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
  overlapsDay: (...args) => overlapsDayMock(...args),
}));

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
} from "../../../../pages/homepage/utils/timelineUtils";

describe("homepageTimelineUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates daily energy percentages based on current time", () => {
    vi.setSystemTime(new Date("2026-03-24T05:00:00.000Z"));
    expect(getDailyEnergyPercent()).toBe(0);
    vi.setSystemTime(new Date("2026-03-24T23:30:00.000Z"));
    expect(getDailyEnergyPercent()).toBe(100);
    vi.setSystemTime(new Date("2026-03-24T14:30:00.000Z"));
    expect(getDailyEnergyPercent()).toBeGreaterThan(0);
  });

  it("calculates progress percentage within the current hour block", () => {
    vi.setSystemTime(new Date("2026-03-24T14:30:00.000Z"));
    expect(getNowLinePercent()).toBeNull();
    expect(getNowLinePercent("2026-03-24T14:00:00.000Z", "2026-03-24T15:00:00.000Z")).toBe(50);
    expect(getNowLinePercent("2026-03-24T15:00:00.000Z", "2026-03-24T16:00:00.000Z")).toBeNull();
  });

  it("identifies peak productivity hours from heatmap data", () => {
    expect(getPeakHours(null)).toEqual([]);
    const heatmap = {
      data: [
        Array.from({ length: 24 }, (_, hour) => (hour === 8 ? 50 : hour === 9 ? 30 : hour === 15 ? 40 : 0)),
        Array.from({ length: 24 }, (_, hour) => (hour === 8 ? 10 : hour === 12 ? 20 : 0)),
      ],
    };
    expect(getPeakHours(heatmap).map((p) => p.hour)).toEqual([8, 15, 9]);
  });

  it("determines urgency levels from deadlines and daily progress", () => {
    vi.setSystemTime(new Date("2026-03-24T10:00:00.000Z"));
    expect(getUrgencyLevel([{ start_due_date: "2026-03-25T10:00:00.000Z" }], { daily_progress: [{ date: "2026-03-24", actual_hours: 1 }] })).toBe("urgent");
    expect(getUrgencyLevel([{ start_due_date: "2026-04-10T10:00:00.000Z" }], { daily_progress: [] })).toBe("normal");
    expect(getUrgencyLevel(null, { daily_progress: [] })).toBe("normal");
    expect(getUrgencyLevel([{ start_due_date: null }], undefined)).toBe("normal");
    expect(getUrgencyLevel([{ title: "Missing due date" }], { daily_progress: [] })).toBe("normal");
    expect(getUrgencyLevel([{ start_due_date: "2026-03-20T10:00:00.000Z" }], { daily_progress: [{ date: "2026-03-24", actual_hours: 3 }] })).toBe("normal");
  });

  it("generates descriptive daily narratives from event sets", () => {
    expect(getDailyNarrative("2026-03-24", [])).toMatchObject({ dayType: "Free", sessionCount: 0, lectureCount: 0 });
    const heavy = [{ title: "Lecture", start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" }, { title: "Tutorial", start_time: "2026-03-24T10:30:00Z", end_time: "2026-03-24T11:30:00Z" }, { title: "Seminar", start_time: "2026-03-24T14:00:00Z", end_time: "2026-03-24T15:00:00Z" }];
    expect(getDailyNarrative("2026-03-24", heavy).dayType).toBe("Lecture Heavy");
    expect(getDailyNarrative("2026-03-24", [{ title: "Lecture", start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" }]).dayType).toBe("Moderate");
    expect(getDailyNarrative("2026-03-24", null)).toMatchObject({ dayType: "Free", sessionCount: 0, lectureCount: 0 });
  });

  it("calculates session counts and busy day types in narratives", () => {
    const studySessions = [{ title: "Lecture", start_time: "2026-03-24T09:00Z" }, { title: "Study", start_time: "2026-03-24T11:30Z", end_time: "2026-03-24T12:00Z" }];
    expect(getDailyNarrative("2026-03-24", studySessions).sessionCount).toBe(2);
    expect(getDailyNarrative("2026-03-24", [{ title: "Study block", start_time: "2026-03-24T13:00Z", end_time: "2026-03-24T14:00Z" }]).dayType).toBe("Busy");
    expect(getDailyNarrative("2026-03-24", [{ title: "Lecture", start_time: "2026-03-24T08:00Z", end_time: "2026-03-24T22:00Z" }])).toMatchObject({ bestWindowStart: null, bestWindowEnd: null });
  });

  it("groups overlapping events into clusters correctly", () => {
    expect(groupOverlaps([])).toEqual([]);
    const mixed = [{ id: 1, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" }, { id: 2, start_time: "2026-03-24T09:30Z", end_time: "2026-03-24T10:30Z" }, { id: 3, start_time: "2026-03-24T12:00Z", end_time: "2026-03-24T13:00Z" }];
    expect(groupOverlaps(mixed).map((g) => g.type)).toEqual(["cluster", "single"]);
    const singles = [{ id: 4, start_time: "2026-03-24T09:00Z" }, { id: 5, start_time: "2026-03-24T10:00Z", end_time: "2026-03-24T11:00Z" }];
    expect(groupOverlaps(singles).map((g) => g.type)).toEqual(["single", "single"]);
  });

  it("handles complex multi-event overlap clusters", () => {
    const complex = [
      { id: 6, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T11:00Z" },
      { id: 7, start_time: "2026-03-24T09:30Z", end_time: "2026-03-24T10:00Z" },
      { id: 8, start_time: "2026-03-24T10:15Z", end_time: "2026-03-24T10:45Z" }
    ];
    expect(groupOverlaps(complex)[0].type).toBe("cluster");
  });

  it("computes the timeline appending tasks into gaps", () => {
    expect(computeTimelineWithGaps([], [])).toEqual([]);
    const items = [{ id: 1, title: "Lecture", start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" }, { id: 2, title: "Study", start_time: "2026-03-24T11:30Z", end_time: "2026-03-24T12:00Z" }];
    const timeline = computeTimelineWithGaps(items, [{ id: 99, title: "Essay", estimated_blocks: 1 }]);
    expect(timeline.some((r) => r.type === "gap")).toBe(true);
    expect(timeline.some((r) => r.type === "item")).toBe(true);
  });

  it("injects suggested tasks into computed timeline gaps reliably", () => {
    const events = [{ id: 10, title: "Lec", start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" }, { id: 11, title: "Sem", start_time: "2026-03-24T09:30Z", end_time: "2026-03-24T10:30Z" }, { id: 12, start_time: "2026-03-24T11:30Z", end_time: "2026-03-24T12:00Z" }];
    const tasks = [{ id: 101, title: "Big task", estimated_blocks: 5 }];
    const timeline = computeTimelineWithGaps(events, tasks);
    expect(timeline[0].type).toBe("cluster");
    expect(timeline[1]).toMatchObject({ type: "gap", minutes: 60, suggestedTask: { id: 101 } });
    expect(timeline[2].type).toBe("item");
  });

  it("computes timeline gaps leaving missing task slots empty", () => {
    const gapsFirst = computeTimelineWithGaps([{ id: 15, start_time: "2026-03-24T09:00Z" }, { id: 16, start_time: "2026-03-24T10:30Z", end_time: "2026-03-24T11:30Z" }], [{ id: 102, title: "Default task" }]);
    expect(gapsFirst[1]).toMatchObject({ type: "gap", suggestedTask: { id: 102 } });
    const emptyGaps = computeTimelineWithGaps([{ id: 18, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" }, { id: 19, start_time: "2026-03-24T11:30Z", end_time: "2026-03-24T12:00Z" }], []);
    expect(emptyGaps[1]).toMatchObject({ type: "gap", suggestedTask: null });
    const adjacent = computeTimelineWithGaps([{ start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" }, { start_time: "2026-03-24T10:20Z", end_time: "2026-03-24T11:00Z" }], []);
    expect(adjacent.map((r) => r.type)).toEqual(["item", "item"]);
  });

  it("treats touching events as separate singles and marks long gaps as non-quick wins", () => {
    const touching = groupOverlaps([
      { id: 21, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" },
      { id: 22, start_time: "2026-03-24T10:00Z", end_time: "2026-03-24T11:00Z" },
    ]);
    expect(touching.map((g) => g.type)).toEqual(["single", "single"]);

    const timeline = computeTimelineWithGaps(
      [
        { id: 23, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" },
        { id: 24, start_time: "2026-03-24T11:30Z", end_time: "2026-03-24T12:00Z" },
      ],
      [{ id: 103, title: "Long gap task", estimated_blocks: 2 }],
    );
    expect(timeline[1]).toMatchObject({ type: "gap", minutes: 90, isQuickWin: false, suggestedTask: { id: 103 } });
  });

  it("builds gaps correctly when the next group is a cluster", () => {
    const timeline = computeTimelineWithGaps(
      [
        { id: 30, start_time: "2026-03-24T09:00Z", end_time: "2026-03-24T10:00Z" },
        { id: 31, start_time: "2026-03-24T10:45Z", end_time: "2026-03-24T11:30Z" },
        { id: 32, start_time: "2026-03-24T11:00Z", end_time: "2026-03-24T11:45Z" },
      ],
      [{ id: 104, title: "Cluster gap task", estimated_blocks: 1 }],
    );

    expect(timeline[0]).toMatchObject({ type: "item" });
    expect(timeline[1]).toMatchObject({ type: "gap", minutes: 45, isQuickWin: true, suggestedTask: { id: 104 } });
    expect(timeline[2]).toMatchObject({ type: "cluster" });
  });

  it("determines smart window labels by time of day appropriately", () => {
    expect(getSmartWindowLabel(new Date("2026-03-24T06:30:00.000Z")).variant).toBe("default");
    expect(getSmartWindowLabel(new Date("2026-03-24T09:00:00.000Z")).variant).toBe("morning");
    expect(getSmartWindowLabel(new Date("2026-03-24T12:00:00.000Z")).variant).toBe("midday");
    expect(getSmartWindowLabel(new Date("2026-03-24T19:00:00.000Z")).variant).toBe("evening");
    expect(getSmartWindowLabel(new Date("2026-03-24T03:00:00.000Z")).variant).toBe("default");
    expect(getSmartWindowLabel("2026-03-24T06:30:00.000Z").variant).toBe("default");
    expect(getSmartWindowLabel(new Date("2026-03-24T07:59:00.000Z")).label).toContain("Early Window");
    expect(getSmartWindowLabel(new Date("2026-03-24T16:00:00.000Z")).label).toContain("Focus Window");
  });

  it("calculates absolute timeline duration metrics", () => {
    expect(minsFromDayStart("2026-03-24T08:30:00.000Z")).toBe(150);
    expect(minsFromDayStart(new Date("2026-03-24T06:15:00.000Z"))).toBe(15);
    expect(getGapStartDate("2026-03-24T00:00:00.000Z", 90).toISOString()).toContain("2026-03-24T07:30:00.000Z");
  });
});
