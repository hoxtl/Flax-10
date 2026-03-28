import { beforeEach, describe, expect, it, vi } from "vitest";

const isNowMock = vi.fn();
const getTflLinesForLocationMock = vi.fn();
const isSevereDisruptionMock = vi.fn();

vi.mock("@/pages/homepage/utils/eventUtils", () => ({
  isNow: (...args) => isNowMock(...args),
}));

vi.mock("@/pages/homepage/utils/kclTflMapping", () => ({
  getTflLinesForLocation: (...args) => getTflLinesForLocationMock(...args),
  isSevereDisruption: (...args) => isSevereDisruptionMock(...args),
}));

import {
  formatTimeLeft,
  getCurrentBlock,
  getJourneySummary,
  getLeaveByInfo,
  getNextEvent,
  getTimeLeftBand,
  hasCampusCommute,
} from "@/pages/homepage/components/rightNowUtils";

describe("RightNowUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTflLinesForLocationMock.mockReturnValue([]);
    isSevereDisruptionMock.mockReturnValue(false);
  });

  it("categorises time-left bands correctly filtering thresholds", () => {
    expect(getTimeLeftBand(null)).toBe("over");
    expect(getTimeLeftBand(-1)).toBe("over");
    expect(getTimeLeftBand(9)).toBe("under10");
    expect(getTimeLeftBand(10)).toBe("10to30");
    expect(getTimeLeftBand(30)).toBe("over30");
  });

  it("formats current block and next event lookups resolving bounds", () => {
    isNowMock.mockImplementation((start, end) => start === "current-start" && end === "current-end");
    expect(getCurrentBlock([{ id: 1, start_time: "current-start", end_time: "current-end" }, { id: 2 }])).toEqual({ id: 1, start_time: "current-start", end_time: "current-end" });
    expect(getCurrentBlock("not-an-array")).toBeNull();

    const now = new Date("2026-03-24T09:00:00.000Z");
    expect(getNextEvent([{ id: 1, start_time: "2026-03-24T11:00:00.000Z" }, { id: 2, start_time: "2026-03-24T10:00:00.000Z" }, { id: 3, start_time: "2026-03-24T08:00:00.000Z" }], now)).toEqual({ id: 2, start_time: "2026-03-24T10:00:00.000Z" });
    expect(getNextEvent([], now)).toBeNull();
  });

  it("returns null when no matching current or future events exist", () => {
    isNowMock.mockReturnValue(false);
    expect(getCurrentBlock([{ id: 1, start_time: "x" }, { id: 2 }])).toBeNull();
    const now = new Date("2026-03-24T09:00:00.000Z");
    expect(getNextEvent([{ id: 1, start_time: "2026-03-24T08:00:00.000Z" }, { id: 2 }], now)).toBeNull();
  });

  it("detects campus commute from locations and titles", () => {
    getTflLinesForLocationMock.mockImplementation((value) => (String(value).includes("King's Cross") ? ["Victoria"] : []));
    expect(hasCampusCommute({ location: "King's Cross Station" })).toBe(true);
    expect(hasCampusCommute({ title: "King's Cross seminar" })).toBe(true);
    expect(hasCampusCommute({ location: "Other" })).toBe(false);
    expect(hasCampusCommute(null)).toBe(false);
    expect(hasCampusCommute({ location: " ", title: "" })).toBe(false);
  });

  it("formats time-left strings for ended and active events", () => {
    expect(formatTimeLeft(null, Date.now())).toBeNull();
    expect(formatTimeLeft("2026-03-24T09:00:00.000Z", new Date("2026-03-24T09:10:00.000Z").getTime())).toBe("Ended");
    expect(formatTimeLeft("2026-03-24T09:25:00.000Z", new Date("2026-03-24T09:00:00.000Z").getTime())).toBe("25m left");
    expect(formatTimeLeft("2026-03-24T11:05:00.000Z", new Date("2026-03-24T09:00:00.000Z").getTime())).toBe("2h 5m left");
  });

  it("builds journey summaries from route options", () => {
    expect(
      getJourneySummary({
        duration: 42,
        legs: [
          { mode: "train", routeOptions: [{ name: "Central" }, { name: "Northern" }] },
          { mode: "walk", routeOptions: [{ name: "Central" }, { name: "" }, null] },
        ],
      }),
    ).toEqual({ duration: "42 min", mode: "train", lines: ["Central", "Northern"] });
    expect(getJourneySummary({ duration: Number.NaN, legs: [] })).toEqual({ duration: null, mode: "journey", lines: [] });
  });

  it("returns null leave-by info when the inputs are incomplete", () => {
    expect(getLeaveByInfo(null, [{ lineName: "Central", severityDescription: "Delays" }], Date.now())).toBeNull();
    expect(getLeaveByInfo({ start_time: "2026-03-24T11:00:00.000Z" }, [], Date.now())).toBeNull();
  });

  it("builds critical leave-by info for severe travel delays", () => {
    isSevereDisruptionMock.mockImplementation((text) => /severe/i.test(text));
    const urgent = getLeaveByInfo({ title: "Lecture", start_time: "2026-03-24T09:40:00.000Z" }, [{ lineName: "Central", severityDescription: "Severe delays" }], new Date("2026-03-24T09:00:00.000Z").getTime());
    expect(urgent).toMatchObject({ urgency: "critical", hasSevere: true, lineName: "Central", severity: "Severe delays", eventTitle: "Lecture" });
    expect(urgent.message).toContain("Leave now");
  });

  it("builds standard info leave-by contexts for minor delays", () => {
    isSevereDisruptionMock.mockImplementation((text) => /severe/i.test(text));
    const info = getLeaveByInfo({ title: "Seminar", start_time: "2026-03-24T11:00:00.000Z" }, [{ lineName: "Northern", severityDescription: "Minor delays" }], new Date("2026-03-24T09:00:00.000Z").getTime());
    expect(info).toMatchObject({ urgency: "info", hasSevere: false, lineName: "Northern", severity: "Minor delays", eventTitle: "Seminar", eventTime: "11:00" });
    expect(info.message).toContain("Leave by");
  });

  it("builds urgent leave-by contexts shortly before departure", () => {
    const urgent = getLeaveByInfo(
      { title: "Workshop", start_time: "2026-03-24T10:00:00.000Z" },
      [{ lineName: "Victoria", severityDescription: "Minor delays" }],
      new Date("2026-03-24T09:40:00.000Z").getTime(),
    );
    expect(urgent).toMatchObject({ urgency: "critical", hasSevere: false, lineName: "Victoria" });
    expect(urgent.message).toContain("Leave now");
  });

  it("returns null journey summaries for missing journeys", () => {
    expect(getJourneySummary(null)).toBeNull();
    expect(getJourneySummary(undefined)).toBeNull();
  });

  it("uses urgent leave-by wording when inside the 15-minute pre-departure window", () => {
    isSevereDisruptionMock.mockReturnValue(false);
    const info = getLeaveByInfo(
      { title: "Lecture", start_time: "2026-03-24T12:00:00.000Z" },
      [{ lineName: "District", severityDescription: "Minor delays" }],
      new Date("2026-03-24T11:05:00.000Z").getTime(),
    );
    expect(info).toMatchObject({ urgency: "urgent", hasSevere: false });
    expect(info.message).toContain("Leave in 10 min");
  });

  it("handles non-array inputs and default leave-by severities", () => {
    expect(getNextEvent(null, new Date("2026-03-24T09:00:00.000Z"))).toBeNull();
    expect(getJourneySummary({ duration: 10 })).toEqual({ duration: "10 min", mode: "journey", lines: [] });
    const info = getLeaveByInfo(
      { start_time: "2026-03-24T11:00:00.000Z" },
      [{ lineName: undefined, severityDescription: undefined }],
      new Date("2026-03-24T09:00:00.000Z").getTime(),
    );
    expect(info.severity).toBe("Delays");
  });

  it("falls back to the default event title and journey mode formatting", () => {
    expect(getJourneySummary({
      duration: 15,
      legs: [{ mode: "bus_route", routeOptions: [] }],
    })).toEqual({ duration: "15 min", mode: "bus route", lines: [] });

    const info = getLeaveByInfo(
      { start_time: "2026-03-24T11:00:00.000Z" },
      [{ severityDescription: "Minor delays" }],
      new Date("2026-03-24T09:00:00.000Z").getTime(),
    );
    expect(info.lineName).toBe("TfL");
    expect(info.eventTitle).toBe("your next event");
    expect(info.message).toContain("your next event");
  });

  it("ignores missing route options when summarising journeys", () => {
    expect(getJourneySummary({ duration: 12, legs: [{ mode: "walk" }] })).toEqual({ duration: "12 min", mode: "walk", lines: [] });
  });
});
