import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isTimetableEventMock = vi.fn((event) => Boolean(event?.isTimetable));

vi.mock("../../../../pages/attendance/utils/attendanceTimetable", () => ({
  isTimetableEvent: (...args) => isTimetableEventMock(...args),
}));

import {
  findCandidateEvent,
  getDateRangeForPrompt,
  isInPromptWindow,
} from "../../../../components/attendance/utils/attendancePromptUtils";

describe("attendancePromptUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
    isTimetableEventMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("identifies live and recent-past events inside the prompt window", () => {
    expect(isInPromptWindow({
      start_time: "2026-03-24T11:30:00.000Z",
      end_time: "2026-03-24T12:30:00.000Z",
    })).toBe(true);

    expect(isInPromptWindow({
      start_time: "2026-03-24T11:50:00.000Z",
      end_time: "2026-03-24T12:30:00.000Z",
    })).toBe(false);

    expect(isInPromptWindow({
      start_time: "2026-03-23T09:00:00.000Z",
      end_time: "2026-03-23T14:00:00.000Z",
    })).toBe(true);

    expect(isInPromptWindow({
      start_time: "2026-03-20T09:00:00.000Z",
      end_time: "2026-03-21T11:00:00.000Z",
    })).toBe(false);
  });

  it("builds the prompt lookup date range around the current day", () => {
    const range = getDateRangeForPrompt();
    expect(range.start.startsWith("2026-03-22")).toBe(true);
    expect(range.end.startsWith("2026-03-25")).toBe(true);
  });

  const promptEvents = [
    {
      id: 1,
      isTimetable: false,
      start_time: "2026-03-24T11:30:00.000Z",
      end_time: "2026-03-24T12:30:00.000Z",
    },
    {
      id: 2,
      isTimetable: true,
      start_time: "2026-03-24T11:30:00.000Z",
      end_time: "2026-03-24T12:30:00.000Z",
    },
    {
      id: 3,
      isTimetable: true,
      start_time: "2026-03-20T10:00:00.000Z",
      end_time: "2026-03-21T10:30:00.000Z",
    },
  ];

  it("returns null when the prompt candidate is skipped", () => {
    expect(findCandidateEvent(promptEvents, new Set([2]))).toBeNull();
  });

  it("returns the first unskipped timetable event in the prompt window", () => {
    expect(findCandidateEvent(promptEvents, new Set())).toEqual(promptEvents[1]);
  });

  it("returns null for missing event collections", () => {
    expect(findCandidateEvent(null, new Set())).toBeNull();
  });
});
