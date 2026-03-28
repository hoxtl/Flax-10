/*
 * Tests for plan timeline gap and hour mark helpers.
 */

import { describe, expect, it, vi } from "vitest";

const getCampusKey = vi.fn((location) => location || null);
const getTransitMins = vi.fn(() => 0);

vi.mock("../../../../pages/homepage/utils/plan_timeline/campus", () => ({
  getCampusKey: (...args) => getCampusKey(...args),
  getTransitMins: (...args) => getTransitMins(...args),
}));

import { computeGapContext } from "../../../../pages/homepage/utils/plan_timeline/gapContext";
import {
  injectHourMarks,
  insertNowMarker,
} from "../../../../pages/homepage/utils/plan_timeline/hourMarks";

const classificationCases = [
  { label: "evening", prev: null, next: null, gapMins: (18 - 6) * 60, usableMins: 30, expected: { type: "evening" } },
  {
    label: "personal",
    prev: { title: "Lunch", tag_name: "routine" },
    next: { title: "Gym session", tag_name: "wellness" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "personal" },
  },
  {
    label: "study",
    prev: { title: "Lecture", source: "timetable" },
    next: { title: "Assignment writing", tag_name: "academic" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "study" },
  },
  {
    label: "social and admin",
    prev: { title: "Coffee with Sam", tag_name: "social" },
    next: { title: "Admin catch-up", tag_name: "admin" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "personal" },
  },
  {
    label: "ambiguous",
    prev: { title: "Something ambiguous" },
    next: { title: "Another neutral thing" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "study" },
  },
  {
    label: "null previous event",
    prev: null,
    next: { title: "Coffee catch up", tag_name: "social" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "study" },
  },
  {
    label: "mixed social and academic",
    prev: { title: "Coffee chat", tag_name: "social" },
    next: { title: "Essay plan", tag_name: "academic" },
    gapMins: 120,
    usableMins: 45,
    expected: { type: "study" },
  },
];

function expectGapClassification({ prev, next, gapMins, usableMins, expected }) {
  getTransitMins.mockReturnValueOnce(0);
  expect(computeGapContext(prev, next, gapMins, usableMins)).toEqual(expected);
}

describe("plan timeline helpers", () => {
  it("classifies transit and transit-partial gaps", () => {
    getTransitMins.mockReturnValueOnce(20);
    expect(
      computeGapContext({ location: "Strand" }, { location: "Guy's" }, 60, 25),
    ).toEqual({ type: "transit", transitMins: 20, prevCampus: "Strand", nextCampus: "Guy's" });

    getTransitMins.mockReturnValueOnce(15);
    expect(
      computeGapContext({ location: "Waterloo" }, { location: "Strand" }, 60, 40),
    ).toEqual({ type: "transit-partial", transitMins: 15, freeAfterTransit: 25, prevCampus: "Waterloo", nextCampus: "Strand" });
  });

  it.each(classificationCases)("classifies $label gaps", expectGapClassification);

  it("inserts the now marker before the next future row or at the end", () => {
    const rows = [
      { type: "event", id: "a", startMins: 30, endMins: 60 },
      { type: "free", id: "b", gapStartMins: 90, endMins: 120 },
    ];
    expect(insertNowMarker(rows, 45).map((row) => row.id)).toEqual(["a", "now-marker", "b"]);
    expect(insertNowMarker(rows, 200).at(-1).id).toBe("now-marker");
  });

  it("injects hour marks, hides duplicate hour labels, skips overlapped insertions, and tracks passed now markers", () => {
    const rows = [
      { type: "tinyGap", id: "tiny-0", gapStartMins: 20, endMins: 30, minutes: 10 },
      { type: "event", id: "event-1", startMins: 60, endMins: 120 },
      { type: "event", id: "event-2", startMins: 120, endMins: 180 },
      { type: "free", id: "free-1", startMins: 240, endMins: 300 },
      { type: "now", id: "now-marker", nowMins: 330 },
      { type: "tinyGap", id: "tiny-1", gapStartMins: 360, endMins: 390, minutes: 30 },
    ];
    const result = injectHourMarks(rows);
    expect(result.find((row) => row.type === "hourMark" && row.hour === 6)).toBeTruthy();
    expect(result.find((row) => row.type === "hourMark" && row.hour === 7)).toBeTruthy();
    expect(result.find((row) => row.id === "event-1")).toMatchObject({ hideTimeLabel: true });
    expect(result.find((row) => row.type === "hourMark" && row.hour === 8)).toBeFalsy();
    expect(result.find((row) => row.type === "hourMark" && row.hour === 9)).toBeFalsy();
    expect(result.find((row) => row.type === "hourMark" && row.hour === 10)).toBeTruthy();
    expect(result.find((row) => row.type === "hourMark" && row.hour === 12)).toBeTruthy();
    expect(result.find((row) => row.type === "hourMark" && row.hour === 12 && row.id === "hour-12")).toBeTruthy();
  });

  it("uses the zero fallback when inserting now before rows without explicit start minutes", () => {
    const result = insertNowMarker(
      [{ type: "custom", id: "no-start-row" }, { type: "event", id: "late", startMins: 50, endMins: 80 }],
      10,
    );
    expect(result.map((row) => row.id)).toEqual(["no-start-row", "now-marker", "late"]);
  });

  it("handles null-start rows and preserves state around now rows", () => {
    const result = injectHourMarks([
      { type: "custom", id: "custom-row" },
      { type: "now", id: "now-marker", nowMins: 90 },
      { type: "free", id: "free-2", startMins: 30, endMins: 60 },
    ]);
    expect(result.map((row) => row.id)).toContain("custom-row");
    expect(result.find((row) => row.type === "hourMark")).toBeFalsy();
  });
});
