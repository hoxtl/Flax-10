import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const overlapSleepMock = vi.fn();

vi.mock("../../../../components/settings/hooks/useSleepWarning", () => ({
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
} from "../../../../pages/homepage/components/IntelligenceUtils";

const pinnedNow = new Date("2026-03-24T09:30:00.000Z");
const baseLiveContextInput = {
  currentEvent: null,
  getRelevantDelays: () => [],
  isSevereDisruption: () => false,
  now: pinnedNow,
  overlaps: [],
  sleepWindow: null,
  tflDelays: [],
  upcomingEvent: null,
};

const buildLiveContextInput = (overrides = {}) => ({ ...baseLiveContextInput, ...overrides });

describe("IntelligenceUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("format helpers", () => {
    it("greets people with or without honorifics", () => {
      expect(getGreeting("Pat", true)).toBe("Good Morning, Dr. Pat.");
      expect(getGreeting("Ava", false)).toBe("Good Morning, Ava.");
    });

    it("formats today label and event times", () => {
      expect(getTodayLabel()).toContain("TUESDAY");
      expect(formatEventTime("2026-03-24T11:15:00.000Z")).toBe("11:15");
    });

    it("renders friendly duration strings", () => {
      expect(formatWindowDuration(-1)).toBeNull();
      expect(formatWindowDuration(45)).toBe("45m");
      expect(formatWindowDuration(60)).toBe("1h");
      expect(formatWindowDuration(95)).toBe("1h 35m");
    });
  });

  describe("event selection helpers", () => {
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

    it("returns the active timeline event", () => {
      expect(getCurrentEvent([currentEvent, upcomingEvent], pinnedNow)).toEqual(currentEvent);
      expect(getCurrentEvent([{ id: 3 }], pinnedNow)).toBeNull();
    });

    it("returns the next upcoming event", () => {
      expect(getUpcomingEvent([currentEvent, upcomingEvent], pinnedNow)).toEqual(upcomingEvent);
      expect(getUpcomingEvent([{ id: 4, start_time: "2026-03-24T08:00:00.000Z" }], pinnedNow)).toBeNull();
    });

    it("describes the next focus window duration", () => {
      const windows = [
        { start: new Date("2026-03-24T08:00:00.000Z"), end: new Date("2026-03-24T08:30:00.000Z") },
        { start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T12:30:00.000Z") },
      ];
      expect(getNextWindowMeta(windows, pinnedNow)).toEqual({ duration: "1h 30m", label: "Next focus window 11:00" });
      expect(getNextWindowMeta([], pinnedNow)).toBeNull();
    });
  });

  describe("next-step guidance", () => {
    it.each([
      [{ tasksCount: 2, nextWindowMeta: { duration: "45m" } }, "Use the 45m window to move one priority task forward."],
      [{ tasksCount: 1, nextWindowMeta: null }, "Clear one meaningful task before the day fragments."],
      [{ tasksCount: 0, nextWindowMeta: { duration: "2h" } }, "Your next open block gives you 2h to focus."],
      [{ tasksCount: 0, nextWindowMeta: null }, "Keep the timeline as the source of truth for the rest of today."],
    ])("returns guidance for %o", (input, expected) => {
      expect(getNextStep(input)).toBe(expected);
    });
  });

  describe("travel context", () => {
    const delay = { lineName: "Central", severityDescription: "Severe delays" };
    const baseTravelInput = {
      upcomingEvent: {
        id: 7,
        location: "Campus",
        start_time: "2026-03-24T10:00:00.000Z",
        title: "Maths",
      },
      now: new Date("2026-03-24T09:15:00.000Z"),
      getRelevantDelays: vi.fn(() => [delay]),
      isSevereDisruption: vi.fn((text) => text.includes("Severe")),
    };

    it("returns disruption info when the delay is imminent", () => {
      expect(getTravelContext({ ...baseTravelInput, tflDelays: [delay] })).toEqual({
        iconKey: "Train",
        label: "Travel",
        meta: "Severe delays · Campus",
        text: "Central line disruption — you may be late for your 10:00 Maths.",
        tone: "warning",
      });
    });

    it("returns null when no relevant delays exist", () => {
      expect(getTravelContext({ ...baseTravelInput, tflDelays: [] })).toBeNull();
    });

    it("returns null when the event is too far away", () => {
      const futureEvent = { ...baseTravelInput.upcomingEvent, start_time: "2026-03-24T14:00:00.000Z" };
      expect(getTravelContext({ ...baseTravelInput, upcomingEvent: futureEvent, tflDelays: [delay] })).toBeNull();
    });
  });

  describe("live context", () => {
    it("describes the current focus block with sleep overlap", () => {
      overlapSleepMock.mockReturnValue(true);
      const context = buildLiveContextInput({
        currentEvent: {
          end_time: "2026-03-24T10:30:00.000Z",
          location: "Library",
          start_time: "2026-03-24T09:30:00.000Z",
          title: "Deep work",
        },
        sleepWindow: { sleepTime: "23:00", wakeTime: "07:00" },
      });
      expect(getLiveContext(context)).toEqual({
        iconKey: "Clock3",
        label: "On now",
        meta: "Until 10:30",
        text: "😴 Deep work · Library",
        tone: "neutral",
      });
    });

    it("warns when overlaps exist", () => {
      const context = buildLiveContextInput({ overlaps: [{ a: { start_time: "2026-03-24T10:00:00.000Z" } }] });
      expect(getLiveContext(context)).toEqual({
        iconKey: "AlertTriangle",
        label: "Attention",
        meta: "Conflict at 10:00",
        text: "You have an overlap in today’s plan.",
        tone: "warning",
      });
    });

    it("surfaces travel disruptions when no current event exists", () => {
      const context = buildLiveContextInput({
        getRelevantDelays: () => [{ lineName: "Northern", severityDescription: "Minor delays" }],
        tflDelays: [{ severityDescription: "Minor delays" }],
        upcomingEvent: { start_time: "2026-03-24T10:00:00.000Z", title: "Class" },
      });
      expect(getLiveContext(context).label).toBe("Travel");
    });

    it("describes the next scheduled event", () => {
      const context = buildLiveContextInput({
        upcomingEvent: {
          location: "Room 2",
          start_time: "2026-03-24T10:00:00.000Z",
          title: "Workshop",
        },
      });
      expect(getLiveContext(context)).toEqual({
        iconKey: "Clock3",
        label: "Up next",
        meta: "Starts 10:00",
        text: "Workshop · Room 2",
        tone: "neutral",
      });
    });

    it("falls back to idle guidance when nothing is scheduled", () => {
      expect(getLiveContext(buildLiveContextInput())).toEqual({
        iconKey: "Clock3",
        label: "Right now",
        meta: "Use the banner to decide what to move forward next.",
        text: "You have breathing room before the next thing starts.",
        tone: "neutral",
      });
    });
  });
});
