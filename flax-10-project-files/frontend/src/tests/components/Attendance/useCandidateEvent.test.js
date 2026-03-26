import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCandidateEvent } from "../../../components/attendance/hooks/useCandidateEvent";
import { getEvents } from "../../../api/eventApi";
import {
  getLastPromptShownAt,
  getSkippedIds,
  setLastPromptShownAt,
} from "../../../components/attendance/attendancePromptStorage";
import {
  findCandidateEvent,
  getDateRangeForPrompt,
} from "../../../components/attendance/attendancePromptUtils";

vi.mock("../../../api/eventApi", () => ({
  getEvents: vi.fn(),
}));

vi.mock("../../../components/attendance/attendancePromptStorage", () => ({
  getLastPromptShownAt: vi.fn(),
  getSkippedIds: vi.fn(),
  setLastPromptShownAt: vi.fn(),
}));

vi.mock("../../../components/attendance/attendancePromptUtils", () => ({
  findCandidateEvent: vi.fn(),
  getDateRangeForPrompt: vi.fn(),
}));

describe("useCandidateEvent", () => {
  async function flushAsyncWork() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00Z"));
    vi.clearAllMocks();
    getDateRangeForPrompt.mockReturnValue({ start: "start", end: "end" });
    getSkippedIds.mockReturnValue(new Set());
    getLastPromptShownAt.mockReturnValue(0);
    getEvents.mockResolvedValue([]);
    findCandidateEvent.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 15 minutes before polling again when no prompt is active", async () => {
    renderHook(() => useCandidateEvent());

    await flushAsyncWork();
    expect(getEvents).toHaveBeenCalledTimes(1);
    expect(getEvents).toHaveBeenCalledWith({ start: "start", end: "end" });

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
      await Promise.resolve();
    });
    expect(getEvents).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(14 * 60 * 1000);
      await Promise.resolve();
    });
    expect(getEvents).toHaveBeenCalledTimes(2);
  });

  it("stores the prompt timestamp and stops polling while a candidate is visible", async () => {
    findCandidateEvent.mockReturnValue({ id: 42, title: "Seminar" });

    const { result } = renderHook(() => useCandidateEvent());

    await flushAsyncWork();
    expect(result.current[0]).toEqual({ id: 42, title: "Seminar" });
    expect(setLastPromptShownAt).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(15 * 60 * 1000);
      await Promise.resolve();
    });
    expect(getEvents).toHaveBeenCalledTimes(1);
  });

  it("does not fetch new events while the prompt cooldown is active", async () => {
    getLastPromptShownAt.mockReturnValue(Date.now() - 5 * 60 * 1000);

    renderHook(() => useCandidateEvent());

    await act(async () => {
      await Promise.resolve();
    });
    expect(getEvents).not.toHaveBeenCalled();
    expect(setLastPromptShownAt).not.toHaveBeenCalled();
  });
});
