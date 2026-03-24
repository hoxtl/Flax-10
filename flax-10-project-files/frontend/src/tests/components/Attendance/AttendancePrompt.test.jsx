import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, waitFor, renderHook } from "@testing-library/react";

import AttendancePrompt from "../../../components/Attendance/AttendancePrompt";
import AttendancePromptModal from "../../../components/Attendance/AttendancePromptModal";
import {
  dismissAttendancePrompt,
  submitAttendancePromptAnswer,
} from "../../../components/Attendance/attendancePromptActions";
import {
  isInPromptWindow,
  getDateRangeForPrompt,
  findCandidateEvent,
} from "../../../components/Attendance/attendancePromptUtils";
import {
  getPromptedIds,
  setPromptedId,
} from "../../../components/Attendance/attendancePromptStorage";

const recordAttendanceMock = vi.fn();
const getEventsMock = vi.fn();
const candidateState = { value: null, setValue: vi.fn() };

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../components/Attendance/hooks/useCandidateEvent", () => ({
  useCandidateEvent: vi.fn(() => [candidateState.value, candidateState.setValue]),
}));

vi.mock("../../../components/common/ConfirmModal/ConfirmModal", () => ({
  default: ({ title, message, onConfirm, onAlternate, onCancel, confirmText, alternateText, cancelText }) => (
    <div>
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onConfirm}>{confirmText}</button>
      <button onClick={onAlternate}>{alternateText}</button>
      <button onClick={onCancel}>{cancelText}</button>
    </div>
  ),
}));

describe("Attendance prompt", () => {
  beforeEach(() => {
    localStorage.clear();
    candidateState.value = null;
    candidateState.setValue = vi.fn();
    recordAttendanceMock.mockReset();
    getEventsMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T10:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing without a candidate event and shows the prompt when one exists", () => {
    const { rerender, container } = render(<AttendancePrompt />);
    expect(container).toBeEmptyDOMElement();

    candidateState.value = { id: 1, title: "Lecture" };
    rerender(<AttendancePrompt />);
    expect(screen.getByText("Did you attend?")).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toBeInTheDocument();
  });

  it("wires the prompt modal buttons", () => {
    const onAnswer = vi.fn();
    const onDismiss = vi.fn();
    render(<AttendancePromptModal event={{ title: "Seminar" }} onAnswer={onAnswer} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Yes"));
    fireEvent.click(screen.getByText("No"));
    fireEvent.click(screen.getByText("Dismiss"));
    expect(onAnswer).toHaveBeenCalledWith(true);
    expect(onAnswer).toHaveBeenCalledWith(false);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("dismisses and submits attendance prompt answers", async () => {
    const setEvent = vi.fn();
    recordAttendanceMock.mockResolvedValue({});

    dismissAttendancePrompt({ id: 7 }, setEvent);
    expect(getPromptedIds().has(7)).toBe(true);
    expect(setEvent).toHaveBeenCalledWith(null);

    const setSubmitting = vi.fn();
    await submitAttendancePromptAnswer({ id: 9 }, true, false, setEvent, setSubmitting);
    expect(recordAttendanceMock).toHaveBeenCalledWith(9, true);
    expect(setSubmitting).toHaveBeenCalledWith(true);
    expect(setSubmitting).toHaveBeenCalledWith(false);
  });

  it("handles prompt utilities and candidate polling", async () => {
    const candidate = {
      id: 11,
      title: "Timetable Lecture",
      source: "kcl",
      external_id: "abc",
      start_time: "2026-03-01T10:00:00Z",
      end_time: "2026-03-01T11:00:00Z",
    };

    expect(isInPromptWindow(candidate)).toBe(true);
    expect(new Date(getDateRangeForPrompt().start).toString()).not.toBe("Invalid Date");
    expect(findCandidateEvent([candidate, { id: 12 }], new Set())).toEqual(candidate);

    getEventsMock.mockResolvedValue([candidate]);
    const { useCandidateEvent } = await vi.importActual("../../../components/Attendance/hooks/useCandidateEvent");

    const { result } = renderHook(() => useCandidateEvent());
    await act(async () => {
      await Promise.resolve();
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    expect(result.current[0]?.title).toBe("Timetable Lecture");
  });

  it("stores prompted ids safely even when storage is bad", () => {
    localStorage.setItem("flax_attendance_prompted_ids", "not-json");
    expect(getPromptedIds()).toEqual(new Set());
    setPromptedId(15);
    expect(getPromptedIds().has(15)).toBe(true);
  });
});
