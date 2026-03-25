import { beforeEach, describe, expect, it, vi } from "vitest";

const isNowMock = vi.fn();
const getTflLinesForLocationMock = vi.fn();
const isSevereDisruptionMock = vi.fn();

vi.mock("../../../pages/Homepage/utils/eventUtils", () => ({
  isNow: (...args) => isNowMock(...args),
}));

vi.mock("../../../pages/Homepage/utils/kclTflMapping", () => ({
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
} from "../../../pages/Homepage/components/RightNowUtils";

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

  it("detects campus commute, journey summaries, and time-left strings", () => {
    getTflLinesForLocationMock.mockImplementation((value) => (String(value).includes("King's Cross") ? ["Victoria"] : []));

    expect(hasCampusCommute({ location: "King's Cross Station" })).toBe(true);
    expect(hasCampusCommute({ title: "King's Cross seminar" })).toBe(true);
    expect(hasCampusCommute({ location: "Other" })).toBe(false);
    expect(hasCampusCommute(null)).toBe(false);

    expect(formatTimeLeft(null, Date.now())).toBeNull();
    expect(formatTimeLeft("2026-03-24T09:00:00.000Z", new Date("2026-03-24T09:10:00.000Z").getTime())).toBe("Ended");
    expect(formatTimeLeft("2026-03-24T09:25:00.000Z", new Date("2026-03-24T09:00:00.000Z").getTime())).toBe("25m left");
    expect(formatTimeLeft("2026-03-24T11:05:00.000Z", new Date("2026-03-24T09:00:00.000Z").getTime())).toBe("2h 5m left");

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
});
