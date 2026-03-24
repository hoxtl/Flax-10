import { beforeEach, describe, expect, it, vi } from "vitest";

const overlapSleepMock = vi.fn();

vi.mock("../../../components/Settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: (...args) => overlapSleepMock(...args),
}));

import {
  formatEventTime,
  formatWindowDuration,
  getCurrentEvent,
  getGreeting,
  getLiveContext,
  getNextStep,
  getNextWindowMeta,
  getTodayLabel,
  getTravelContext,
  getUpcomingEvent,
} from "../../../pages/Homepage/components/IntelligenceUtils";

describe("IntelligenceUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T09:30:00.000Z"));
  });

  it("formats greetings, dates, durations, and event times", () => {
    expect(getGreeting("Pat", true)).toBe("Good Morning, Dr. Pat.");
    expect(getGreeting("Ava", false)).toBe("Good Morning, Ava.");
    expect(getTodayLabel()).toContain("TUESDAY");
    expect(formatWindowDuration(-1)).toBeNull();
    expect(formatWindowDuration(45)).toBe("45m");
    expect(formatWindowDuration(60)).toBe("1h");
    expect(formatWindowDuration(95)).toBe("1h 35m");
    expect(formatEventTime("2026-03-24T11:15:00.000Z")).toBe("11:15");
  });

  it("finds the current and upcoming events and describes the next focus window", () => {
    const now = new Date("2026-03-24T09:30:00.000Z");
    const currentEvent = {
      id: 1,
      start_time: "2026-03-24T09:00:00.000Z",
      end_time: "2026-03-24T10:00:00.000Z",
      title: "Lecture",
    };
    const upcomingEvent = {
      id: 2,
      start_time: "2026-03-24T11:00:00.000Z",
      end_time: "2026-03-24T12:00:00.000Z",
      title: "Seminar",
    };

    expect(getCurrentEvent([currentEvent, upcomingEvent], now)).toEqual(currentEvent);
    expect(getUpcomingEvent([currentEvent, upcomingEvent], now)).toEqual(upcomingEvent);
    expect(getCurrentEvent([{ id: 3 }], now)).toBeNull();
    expect(getUpcomingEvent([{ id: 4, start_time: "2026-03-24T08:00:00.000Z" }], now)).toBeNull();

    expect(
      getNextWindowMeta(
        [
          { start: new Date("2026-03-24T08:00:00.000Z"), end: new Date("2026-03-24T08:30:00.000Z") },
          { start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T12:30:00.000Z") },
        ],
        now,
      ),
    ).toEqual({
      duration: "1h 30m",
      label: "Next focus window 11:00",
    });
    expect(getNextWindowMeta([], now)).toBeNull();
  });

  it("builds task-next-step guidance for each branch", () => {
    expect(getNextStep({ tasksCount: 2, nextWindowMeta: { duration: "45m" } })).toBe(
      "Use the 45m window to move one priority task forward.",
    );
    expect(getNextStep({ tasksCount: 1, nextWindowMeta: null })).toBe(
      "Clear one meaningful task before the day fragments.",
    );
    expect(getNextStep({ tasksCount: 0, nextWindowMeta: { duration: "2h" } })).toBe(
      "Your next open block gives you 2h to focus.",
    );
    expect(getNextStep({ tasksCount: 0, nextWindowMeta: null })).toBe(
      "Keep the timeline as the source of truth for the rest of today.",
    );
  });

  it("builds travel context only when a relevant disruption is near enough", () => {
    const upcomingEvent = {
      id: 7,
      location: "Campus",
      start_time: "2026-03-24T10:00:00.000Z",
      title: "Maths",
    };
    const delay = { lineName: "Central", severityDescription: "Severe delays" };
    const getRelevantDelays = vi.fn(() => [delay]);
    const isSevereDisruption = vi.fn((text) => text.includes("Severe"));

    expect(
      getTravelContext({
        upcomingEvent,
        tflDelays: [delay],
        now: new Date("2026-03-24T09:15:00.000Z"),
        getRelevantDelays,
        isSevereDisruption,
      }),
    ).toEqual({
      iconKey: "Train",
      label: "Travel",
      meta: "Severe delays · Campus",
      text: "Central line disruption — you may be late for your 10:00 Maths.",
      tone: "warning",
    });

    expect(
      getTravelContext({
        upcomingEvent,
        tflDelays: [],
        now: new Date("2026-03-24T09:15:00.000Z"),
        getRelevantDelays,
        isSevereDisruption,
      }),
    ).toBeNull();

    expect(
      getTravelContext({
        upcomingEvent: { ...upcomingEvent, start_time: "2026-03-24T14:00:00.000Z" },
        tflDelays: [delay],
        now: new Date("2026-03-24T09:15:00.000Z"),
        getRelevantDelays: () => [delay],
        isSevereDisruption,
      }),
    ).toBeNull();
  });

  it("builds the live context for current events, overlaps, travel delays, upcoming events, and idle time", () => {
    overlapSleepMock.mockReturnValue(true);

    expect(
      getLiveContext({
        currentEvent: {
          end_time: "2026-03-24T10:30:00.000Z",
          location: "Library",
          start_time: "2026-03-24T09:30:00.000Z",
          title: "Deep work",
        },
        getRelevantDelays: vi.fn(),
        isSevereDisruption: vi.fn(),
        now: new Date("2026-03-24T09:30:00.000Z"),
        overlaps: [],
        sleepWindow: { sleepTime: "23:00", wakeTime: "07:00" },
        tflDelays: [],
        upcomingEvent: null,
      }),
    ).toEqual({
      iconKey: "Clock3",
      label: "On now",
      meta: "Until 10:30",
      text: "😴 Deep work · Library",
      tone: "neutral",
    });

    expect(
      getLiveContext({
        currentEvent: null,
        getRelevantDelays: vi.fn(),
        isSevereDisruption: vi.fn(),
        now: new Date("2026-03-24T09:30:00.000Z"),
        overlaps: [{ a: { start_time: "2026-03-24T10:00:00.000Z" } }],
        sleepWindow: null,
        tflDelays: [],
        upcomingEvent: null,
      }),
    ).toEqual({
      iconKey: "AlertTriangle",
      label: "Attention",
      meta: "Conflict at 10:00",
      text: "You have an overlap in today’s plan.",
      tone: "warning",
    });

    expect(
      getLiveContext({
        currentEvent: null,
        getRelevantDelays: () => [{ lineName: "Northern", severityDescription: "Minor delays" }],
        isSevereDisruption: () => false,
        now: new Date("2026-03-24T09:15:00.000Z"),
        overlaps: [],
        sleepWindow: null,
        tflDelays: [{ severityDescription: "Minor delays" }],
        upcomingEvent: {
          start_time: "2026-03-24T10:00:00.000Z",
          title: "Class",
        },
      }).label,
    ).toBe("Travel");

    expect(
      getLiveContext({
        currentEvent: null,
        getRelevantDelays: () => [],
        isSevereDisruption: () => false,
        now: new Date("2026-03-24T09:30:00.000Z"),
        overlaps: [],
        sleepWindow: null,
        tflDelays: [],
        upcomingEvent: {
          location: "Room 2",
          start_time: "2026-03-24T10:00:00.000Z",
          title: "Workshop",
        },
      }),
    ).toEqual({
      iconKey: "Clock3",
      label: "Up next",
      meta: "Starts 10:00",
      text: "Workshop · Room 2",
      tone: "neutral",
    });

    expect(
      getLiveContext({
        currentEvent: null,
        getRelevantDelays: () => [],
        isSevereDisruption: () => false,
        now: new Date("2026-03-24T09:30:00.000Z"),
        overlaps: [],
        sleepWindow: null,
        tflDelays: [],
        upcomingEvent: null,
      }),
    ).toEqual({
      iconKey: "Clock3",
      label: "Right now",
      meta: "Use the banner to decide what to move forward next.",
      text: "You have breathing room before the next thing starts.",
      tone: "neutral",
    });
  });
});
