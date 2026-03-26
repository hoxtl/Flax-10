import { describe, it, expect } from "vitest";
import {
  isDuringSleepWindow,
  doesEventOverlapSleepWindow,
} from "../../../../components/settings/sleep/sleepWarningUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDate(hours, minutes = 0) {
  const d = new Date(2024, 0, 15); // fixed calendar date
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// isDuringSleepWindow
// ---------------------------------------------------------------------------

describe("isDuringSleepWindow", () => {
  // Normal window: sleep 22:00, wake 07:00 (overnight)
  const SLEEP = "22:00";
  const WAKE = "07:00";

  it("returns true when time is after sleep time in an overnight window", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(23, 0))).toBe(true);
  });

  it("returns true when time is before wake time in an overnight window", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(3, 30))).toBe(true);
  });

  it("returns false when time is between wake and sleep in an overnight window", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(12, 0))).toBe(false);
  });

  it("returns true exactly at sleep time (inclusive lower bound)", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(22, 0))).toBe(true);
  });

  it("returns false exactly at wake time (exclusive upper bound)", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(7, 0))).toBe(false);
  });

  it("returns false one minute before sleep time", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(21, 59))).toBe(false);
  });

  it("returns true one minute after sleep time", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(22, 1))).toBe(true);
  });

  it("returns true one minute before wake time", () => {
    expect(isDuringSleepWindow(SLEEP, WAKE, makeDate(6, 59))).toBe(true);
  });

  // Normal (non-overnight) window: sleep 08:00, wake 20:00
  describe("normal (non-overnight) window", () => {
    const S = "08:00";
    const W = "20:00";

    it("returns true when time is inside the daytime window", () => {
      expect(isDuringSleepWindow(S, W, makeDate(12, 0))).toBe(true);
    });

    it("returns false when time is before the daytime window", () => {
      expect(isDuringSleepWindow(S, W, makeDate(7, 59))).toBe(false);
    });

    it("returns false when time is after the daytime window", () => {
      expect(isDuringSleepWindow(S, W, makeDate(20, 0))).toBe(false);
    });

    it("returns true exactly at sleep start (inclusive)", () => {
      expect(isDuringSleepWindow(S, W, makeDate(8, 0))).toBe(true);
    });

    it("returns false exactly at wake time (exclusive)", () => {
      expect(isDuringSleepWindow(S, W, makeDate(20, 0))).toBe(false);
    });
  });

  // Uses current date when no third argument provided
  it("defaults to current time when no date argument is supplied", () => {
    // Just check it runs without throwing; exact value depends on the time the test runs.
    const result = isDuringSleepWindow("00:00", "23:59");
    expect(typeof result).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// doesEventOverlapSleepWindow
// ---------------------------------------------------------------------------

describe("doesEventOverlapSleepWindow", () => {
  const SLEEP = "22:00";
  const WAKE = "07:00";

  it("returns false when startDate is null", () => {
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, null, null)).toBe(false);
  });

  it("returns false when startDate is undefined", () => {
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, undefined, null)).toBe(false);
  });

  it("returns false when startDate is an invalid date string", () => {
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, "not-a-date", null)).toBe(false);
  });

  it("returns false when endDate produces an invalid Date", () => {
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, "2024-01-15T23:00:00", "bad-end")).toBe(false);
  });

  it("falls back to isDuringSleepWindow when end <= start", () => {
    // start is during sleep window; end equals start → should return true
    const start = "2024-01-15T23:30:00";
    const end = "2024-01-15T23:30:00"; // equal
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, start, end)).toBe(true);
  });

  it("falls back to isDuringSleepWindow when end < start and start is outside sleep window", () => {
    const start = "2024-01-15T14:00:00"; // midday — outside sleep window
    const end = "2024-01-15T13:00:00"; // before start
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, start, end)).toBe(false);
  });

  it("returns true for a range that overlaps the sleep window", () => {
    // Event goes from 21:30 to 23:00 — crosses 22:00 sleep start
    const start = "2024-01-15T21:30:00";
    const end = "2024-01-15T23:00:00";
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, start, end)).toBe(true);
  });

  it("returns false for a range entirely outside the sleep window", () => {
    // 10:00–12:00 is well outside 22:00–07:00
    const start = "2024-01-15T10:00:00";
    const end = "2024-01-15T12:00:00";
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, start, end)).toBe(false);
  });

  it("returns true for a range entirely within the sleep window", () => {
    // 23:30–01:00 is inside overnight window
    const start = "2024-01-15T23:30:00";
    const end = "2024-01-16T01:00:00";
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, start, end)).toBe(true);
  });

  it("uses a default 25-minute window when endDate is not provided", () => {
    // 22:10 start, no end → window is 22:10–22:35 which is in sleep window
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, "2024-01-15T22:10:00", null)).toBe(true);
  });

  it("returns false for a short event well outside sleep window (no end date)", () => {
    // 14:00 start, no end → 14:00–14:25, outside sleep window
    expect(doesEventOverlapSleepWindow(SLEEP, WAKE, "2024-01-15T14:00:00", null)).toBe(false);
  });
});
