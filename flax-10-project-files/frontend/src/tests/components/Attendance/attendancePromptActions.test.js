import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitAttendancePromptAnswer } from "../../../components/attendance/attendancePromptActions";
import { useAttendanceResource } from "../../../pages/Attendance/hooks/useAttendanceResource";
import { ATTENDANCE_UPDATED_EVENT } from "../../../lib/attendanceEvents";
import { recordAttendance } from "../../../api/attendanceApi";
import { setPromptedId } from "../../../components/attendance/attendancePromptStorage";

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: vi.fn(),
}));

vi.mock("../../../components/attendance/attendancePromptStorage", () => ({
  setPromptedId: vi.fn(),
  setSessionDismissedId: vi.fn(),
}));

describe("attendancePromptActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records attendance, refreshes stats listeners, and closes the prompt on success", async () => {
    const setEvent = vi.fn();
    const setSubmitting = vi.fn();
    const afterSuccess = vi.fn().mockResolvedValue(undefined);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    recordAttendance.mockResolvedValue({});

    const result = await submitAttendancePromptAnswer(
      { id: 42 },
      true,
      false,
      setEvent,
      setSubmitting,
      { afterSuccess, closeDelayMs: 0 },
    );

    expect(result).toBe(true);
    expect(recordAttendance).toHaveBeenCalledWith(42, true);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: ATTENDANCE_UPDATED_EVENT }));
    expect(afterSuccess).toHaveBeenCalledTimes(1);
    expect(setPromptedId).toHaveBeenCalledWith(42);
    expect(setEvent).toHaveBeenCalledWith(null);
    expect(setSubmitting.mock.calls).toEqual([[true], [false]]);
  });

  it("keeps the prompt open when recording attendance fails", async () => {
    const setEvent = vi.fn();
    const setSubmitting = vi.fn();
    const afterSuccess = vi.fn();

    recordAttendance.mockRejectedValue(new Error("save failed"));

    const result = await submitAttendancePromptAnswer(
      { id: 7 },
      false,
      false,
      setEvent,
      setSubmitting,
      { afterSuccess, closeDelayMs: 0 },
    );

    expect(result).toBe(false);
    expect(afterSuccess).not.toHaveBeenCalled();
    expect(setPromptedId).not.toHaveBeenCalled();
    expect(setEvent).not.toHaveBeenCalled();
    expect(setSubmitting.mock.calls).toEqual([[true], [false]]);
  });

  it("waits for the configured close delay before resolving", async () => {
    vi.useFakeTimers();
    const setEvent = vi.fn();
    const setSubmitting = vi.fn();

    recordAttendance.mockResolvedValue({});

    const promise = submitAttendancePromptAnswer(
      { id: 21 },
      true,
      false,
      setEvent,
      setSubmitting,
      { closeDelayMs: 5 },
    );

    await Promise.resolve();
    vi.advanceTimersByTime(5);
    await expect(promise).resolves.toBe(true);
    vi.useRealTimers();
  });
});

describe("useAttendanceResource", () => {
  it("refetches when attendance is updated elsewhere", async () => {
    const loader = vi.fn().mockResolvedValue({ overall: { attended: 1, missed: 0 } });

    renderHook(() => useAttendanceResource(loader, null));

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await act(async () => {
      window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
    });

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });
});
