import { describe, expect, it } from "vitest";
import { formatHour12h, formatTime, formatTime12h, formatTimeHHMM, fmtDurationShort } from "../../../pages/Homepage/utils/dateFormatUtils";

describe("homepageDateFormatUtils", () => {
  it("formats short 24-hour time strings gracefully", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("2026-03-24T08:05:00.000Z")).toMatch(/08:05/);
    expect(formatTimeHHMM(new Date("2026-03-24T08:05:00.000Z"))).toBe("08:05");
    expect(formatTimeHHMM("2026-03-24T14:30:00.000Z")).toBe("14:30");
  });

  it("safely generates humanised duration strings from minute pools", () => {
    expect(fmtDurationShort(null)).toBe("");
    expect(fmtDurationShort(-5)).toBe("");
    expect(fmtDurationShort(45)).toBe("45m");
    expect(fmtDurationShort(60)).toBe("1h");
    expect(fmtDurationShort(95)).toBe("1h 35m");
  });

  it("handles 12-hour AM/PM shifts and rounding conversions", () => {
    expect(formatTime12h("")).toBe("");
    expect(formatTime12h("2026-03-24T00:00:00.000Z")).toBe("12am");
    expect(formatTime12h("2026-03-24T12:00:00.000Z")).toBe("12pm");
    expect(formatTime12h("2026-03-24T14:30:00.000Z")).toBe("2:30pm");
  });

  it("interprets explicit integer arguments into 12-hour boundaries", () => {
    expect(formatHour12h(0)).toBe("12am");
    expect(formatHour12h(12)).toBe("12pm");
    expect(formatHour12h(14, 30)).toBe("2:30pm");
  });
});
