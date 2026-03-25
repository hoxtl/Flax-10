import { describe, expect, it, vi } from "vitest";

vi.mock("../../../pages/Homepage/utils/eventUtils", () => ({
  extractModuleCode: vi.fn((text) => (String(text || "").includes("CS") ? "CS100" : null)),
  isNow: vi.fn((start, end) => start === "now-start" && end === "now-end"),
  isRoutineEvent: vi.fn((item) => item.title === "Routine thing"),
}));

import { getCampusKey, getTransitMins } from "../../../pages/Homepage/utils/planTimeline/campus";
import {
  addSpacing,
  buildEventEntry,
  buildGapOrTinyGap,
  filterEventsInWindow,
  groupOverlappingEvents,
} from "../../../pages/Homepage/utils/planTimeline/eventRows";
import { computeGapContext } from "../../../pages/Homepage/utils/planTimeline/gapContext";
import { injectHourMarks, insertNowMarker } from "../../../pages/Homepage/utils/planTimeline/hourMarks";
import { computePlanTimelineRows } from "../../../pages/Homepage/utils/planTimeline";

const buildDayBounds = () => ({ start: new Date("2026-03-24T06:00:00Z"), end: new Date("2026-03-24T22:00:00Z") });
const buildEventRow = (overrides) => ({ type: "event", id: overrides.id ?? 1, startMins: overrides.startMins ?? 60, endMins: overrides.endMins ?? 120, spacingBeforePx: overrides.spacingBeforePx });
const buildTimerEntry = (overrides = {}) => ({ id: "event-1", title: "Routine thing", description: "CS reading", start_time: "now-start", end_time: "now-end", module_code: "", ...overrides });

describe("planTimelineHelpersEdges", () => {
  it("covers campus key and transit helpers", () => {
    expect(getCampusKey("Strand campus library")).toBeTruthy();
    expect(getCampusKey("")).toBeNull();
    expect(getTransitMins("Strand Campus", "Guy's Campus")).toBeGreaterThan(0);
    expect(getTransitMins("Strand Campus", "Strand Campus")).toBe(0);
    expect(getTransitMins("Unknown", "Guy's Campus")).toBe(0);
    expect(getTransitMins("King's Sport Honor Oak", "Guy's Campus")).toBe(0);
  });

  describe("gap contexts", () => {
    it("identifies transit and partial transit statuses", () => {
      const e1 = { location: "Strand Campus", title: "Lecture" };
      const e2 = { location: "Guy's Campus", title: "Seminar" };
      expect(computeGapContext(e1, e2, 120, 15).type).toBe("transit");
      expect(computeGapContext(e1, e2, 120, 90).type).toBe("transit-partial");
    });

    it("distinguishes personal contexts based on tags or evening bounds", () => {
      expect(computeGapContext({ title: "Dinner" }, { title: "Coffee" }, 11 * 60, 40).type).toBe("personal");
      expect(computeGapContext({ title: "Lecture" }, { title: "Study" }, 12 * 60 + 1, 40).type).toBe("evening");
      expect(computeGapContext({ title: "", tag_name: "wellness" }, { title: "", tag_name: "social" }, 11 * 60, 40).type).toBe("personal");
      expect(computeGapContext({ title: "", tag_name: "admin" }, { title: "", tag_name: "routine" }, 11 * 60, 40).type).toBe("personal");
    });

    it("falls back to study gap contexts for academic tags and default states", () => {
      expect(computeGapContext({ title: "Lecture" }, { title: "Study session" }, 11 * 60, 40).type).toBe("study");
      expect(computeGapContext({ title: "Essay plan", tag_name: "academic" }, { title: "Library session" }, 11 * 60, 40).type).toBe("study");
      expect(computeGapContext({ title: "Mystery" }, { title: "Unknown" }, 11 * 60, 40).type).toBe("study");
    });
  });

  describe("event rows and marks", () => {
    it("filters events and bounds tiny or large gaps", () => {
      const { start, end } = buildDayBounds();
      expect(filterEventsInWindow(null, start, end)).toEqual([]);
      const evs = [{ id: 1, start_time: "2026-03-24T09:00:00", end_time: "2026-03-24T10:00:00" }, { id: 2, start_time: "2026-03-24T23:00:00", end_time: "2026-03-24T23:30:00" }];
      expect(filterEventsInWindow(evs, start, end)).toHaveLength(1);
      expect(buildGapOrTinyGap(60, 60, 0, null, null)).toBeNull();
      expect(buildGapOrTinyGap(60, 75, 0, null, null).type).toBe("tinyGap");
      expect(buildGapOrTinyGap(60, 120, 1, { title: "Lec" }, { title: "Study" }).type).toBe("free");
    });

    it("builds core event entries mapping tasks accurately", () => {
      const event = buildEventEntry(buildTimerEntry(), [{ id: "other", start_time: "now-start", end_time: "now-end" }], new Date("2026-03-24T11:00Z"), [], [{ title: "Routine thing" }]);
      expect(event.active).toBe(true);
      expect(event.isRoutine).toBe(true);
      expect(event.moduleCode).toBe("CS100");
    });

    it("layers vertical spacing metadata accurately onto event rows", () => {
      const spaced = addSpacing([buildEventRow({ id: 1 }), buildEventRow({ id: 2, startMins: 120, endMins: 180 }), { type: "free", id: 3, startMins: 240, gapStartMins: 240, minutes: 60 }]);
      expect(spaced[0].spacingBeforePx).toBe(0);
      expect(spaced[2].spacingBeforePx).toBeGreaterThanOrEqual(0);
    });

    it("groups overlaps gracefully into nested array clusters", () => {
      const grouped = groupOverlappingEvents([buildEventRow({ id: 1, spacingBeforePx: 4 }), buildEventRow({ id: 2, startMins: 90, endMins: 150, spacingBeforePx: 4 }), { type: "tinyGap", id: 3, startMins: 150, endMins: 165, minutes: 15 }]);
      expect(grouped[0].type).toBe("eventGroup");
    });

    it("inserts now-markers smoothly relative to bounding events", () => {
      const withNow = insertNowMarker([{ type: "event", id: 1, startMins: 120, endMins: 180 }], 90);
      expect(withNow[0].type).toBe("now");
      expect(insertNowMarker([{ type: "free", id: 10, gapStartMins: 120, minutes: 30 }, { type: "note", id: 11 }], 10)[1].type).toBe("free");
      expect(insertNowMarker([{ type: "note", id: "n0" }, { type: "event", id: 16, startMins: 120, endMins: 180 }], 10)[1].type).toBe("now");
    });

    it("hydrates blank hour grids hiding labels for proximate events", () => {
      const withMarks = injectHourMarks([{ type: "event", id: 1, startMins: 180, endMins: 240 }, { type: "now", id: "now-marker", nowMins: 330 }, { type: "free", id: 3, startMins: 360, gapStartMins: 360, minutes: 60 }]);
      expect(withMarks.some((row) => row.type === "hourMark")).toBe(true);
      expect(withMarks.some((row) => row.hideTimeLabel)).toBe(true);
    });
  });

  describe("compute public timelines", () => {
    const ds = new Date("2026-03-24T06:00:00");
    const de = new Date("2026-03-24T22:00:00");

    it("skips now markers safely when time bounds mismatch", () => {
      const rows = computePlanTimelineRows([{ id: 1, title: "Lec", start_time: "2026-03-24T08:00:00", end_time: "2026-03-24T09:00:00" }], null, ds, de, null, [], [], () => true);
      expect(rows.some((row) => row.type === "now")).toBe(false);
      const rowsWithoutNow = computePlanTimelineRows([{ id: 3, title: "Class", start_time: "2026-03-24T11:00:00", end_time: "2026-03-24T12:00:00" }], "2026-03-24", ds, de, new Date("2026-03-24T09:15:00"), [], [], () => false);
      expect(rowsWithoutNow.some((row) => row.type === "now")).toBe(false);
    });

    it("constructs full layout including now and events successfully", () => {
      const rows = computePlanTimelineRows([{ id: 2, title: "Study", start_time: "2026-03-24T10:00:00", end_time: "2026-03-24T11:00:00" }, { id: 1, title: "Lec", start_time: "2026-03-24T08:00:00" }], "2026-03-24", ds, de, new Date("2026-03-24T09:15:00"), [], [], () => true);
      expect(rows.some((row) => row.type === "now")).toBe(true);
      expect(rows.some((row) => row.type === "event")).toBe(true);
    });

    it("inserts tiny gaps around missing event spacing successfully", () => {
      const rows = computePlanTimelineRows([{ id: 4, title: "Class", start_time: "2026-03-24T08:00:00", end_time: "2026-03-24T08:30:00" }, { id: 5, title: "Class", start_time: "2026-03-24T10:00:00", end_time: "2026-03-24T11:00:00" }], "2026-03-24", ds, de, new Date("2026-03-24T09:15:00"), [], [], () => true);
      expect(rows.some((row) => row.type === "free" || row.type === "tinyGap")).toBe(true);
    });
  });
});
