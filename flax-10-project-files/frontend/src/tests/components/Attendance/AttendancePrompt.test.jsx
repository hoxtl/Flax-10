import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, waitFor, renderHook } from "../../../utils/test-utils";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const {
            animate: _animate,
            exit: _exit,
            initial: _initial,
            transition: _transition,
            whileTap: _whileTap,
            ...rest
          } = props;

          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

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
  getSessionDismissedIds,
  setPromptedId,
} from "../../../components/Attendance/attendancePromptStorage";

const attendanceStatsState = { overall: { attended: 0, missed: 0 } };

const recordAttendanceMock = vi.fn();
const getEventsMock = vi.fn();
const candidateState = { value: null, setValue: vi.fn() };

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
  getAttendanceStats: vi.fn(async () => ({ overall: { attended: 0, missed: 0 } })),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../components/Attendance/hooks/useCandidateEvent", () => ({
  useCandidateEvent: vi.fn(() => [candidateState.value, candidateState.setValue]),
}));

vi.mock("../../../pages/Attendance/hooks/useAttendanceStats", () => ({
  useAttendanceStats: () => ({ refetch: vi.fn(), stats: attendanceStatsState }),
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
    sessionStorage.clear();
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
    expect(screen.getByText(/Did you attend/i)).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toBeInTheDocument();
  });

  it("hides the prompt for teacher profiles", () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));
    candidateState.value = { id: 3, title: "Lecture" };

    const { container } = render(<AttendancePrompt />);

    expect(container).toBeEmptyDOMElement();
  });

  it("wires the prompt modal buttons", () => {
    const onAnswer = vi.fn().mockResolvedValue(true);
    render(<AttendancePromptModal event={{ title: "Seminar" }} onAnswer={onAnswer} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText("Yes"));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(onAnswer).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ afterSuccess: expect.any(Function), closeDelayMs: 700 }),
    );
  });

  it("renders event metadata and hides the dismiss button when it is not provided", () => {
    render(
      <AttendancePromptModal
        event={{ title: "Seminar", start_time: "2026-03-01T10:00:00Z" }}
        onAnswer={vi.fn().mockResolvedValue(true)}
      />,
    );

    expect(screen.getByText(/at 10:00 on sunday, 1 march/i)).toBeInTheDocument();
    expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    fireEvent.mouseDown(document.querySelector('[class*="modal"]'));
  });

  it("renders the orange ring state for mid-range attendance and ignores repeat answers while pending", () => {
    attendanceStatsState.overall = { attended: 1, missed: 1 };
    const onAnswer = vi.fn().mockResolvedValue(true);

    render(<AttendancePromptModal event={{ title: "Workshop" }} onAnswer={onAnswer} onDismiss={vi.fn()} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
    const yesButton = screen.getByText("Yes");
    fireEvent.click(yesButton);
    fireEvent.click(yesButton);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onAnswer).toHaveBeenCalledTimes(1);
      expect(onAnswer).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ afterSuccess: expect.any(Function), closeDelayMs: 700 }),
    );
  });

  it("falls back to empty attendance totals when the stats payload has no overall section", () => {
    delete attendanceStatsState.overall;

    render(<AttendancePromptModal event={{ title: "Workshop" }} onAnswer={vi.fn().mockResolvedValue(true)} onDismiss={vi.fn()} />);

    expect(screen.getByText("100%")).toBeInTheDocument();

    attendanceStatsState.overall = { attended: 0, missed: 0 };
  });

  it("dismisses with null event (no session id stored)", () => {
    const setEvent = vi.fn();
    // null event → if (event) is false → no setSessionDismissedId call
    dismissAttendancePrompt(null, setEvent);
    expect(setEvent).toHaveBeenCalledWith(null);
    // No id stored since event was null
    expect(getSessionDismissedIds().size).toBe(0);
  });

  it("uses default closeDelayMs when not provided in options", async () => {
    const setEvent = vi.fn();
    const setSubmitting = vi.fn();
    recordAttendanceMock.mockResolvedValue({});
    // Don't provide closeDelayMs in options (undefined) → default 250ms branch used
    // closeDelayMs > 0 → wait(closeDelayMs) is called
    const afterSuccess = vi.fn().mockResolvedValue(undefined);
    // Use vi.runAllTimersAsync to handle async timers
    const promise = submitAttendancePromptAnswer({ id: 99 }, true, false, setEvent, setSubmitting, { afterSuccess });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe(true);
    expect(setEvent).toHaveBeenCalledWith(null);
  });

  it("ignores double-tap when answer is already set (button disabled state)", async () => {
    const onAnswer = vi.fn().mockResolvedValue(true);
    render(<AttendancePromptModal event={{ title: "Lab" }} onAnswer={onAnswer} onDismiss={vi.fn()} />);

    const yesButton = screen.getByText("Yes");
    // First click sets answeredWith = true
    await act(async () => { fireEvent.click(yesButton); });
    // Second click should hit the guard (answeredWith !== null → return)
    await act(async () => { fireEvent.click(yesButton); });

    act(() => { vi.advanceTimersByTime(1200); });
    // Only one onAnswer call should happen
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("dismisses and submits attendance prompt answers", async () => {
    const setEvent = vi.fn();
    recordAttendanceMock.mockResolvedValue({});

    dismissAttendancePrompt({ id: 7 }, setEvent);
    expect(getSessionDismissedIds().has(7)).toBe(true);
    expect(setEvent).toHaveBeenCalledWith(null);

    const setSubmitting = vi.fn();
    await submitAttendancePromptAnswer({ id: 9 }, true, false, setEvent, setSubmitting, { closeDelayMs: 0 });
    expect(recordAttendanceMock).toHaveBeenCalledWith(9, true);
    expect(setSubmitting).toHaveBeenCalledWith(true);
    expect(setSubmitting).toHaveBeenCalledWith(false);
  });

  it("returns early when there is no event or a submission is already in progress", async () => {
    const setEvent = vi.fn();
    const setSubmitting = vi.fn();

    await expect(
      submitAttendancePromptAnswer(null, true, false, setEvent, setSubmitting),
    ).resolves.toBe(false);
    await expect(
      submitAttendancePromptAnswer({ id: 10 }, true, true, setEvent, setSubmitting),
    ).resolves.toBe(false);

    expect(setEvent).not.toHaveBeenCalled();
    expect(setSubmitting).not.toHaveBeenCalled();
  });

  it("shows session confirmation message when answered", async () => {
    const onAnswer = vi.fn(() => Promise.resolve(true));
    render(<AttendancePromptModal event={{ title: "Seminar" }} onAnswer={onAnswer} onDismiss={vi.fn()} />);
    act(() => { fireEvent.click(screen.getByText("Yes")); });
    expect(screen.getByText("Attendance recorded!")).toBeInTheDocument();
  });

  it("restores the question when attendance submission fails", async () => {
    vi.useRealTimers();
    const onAnswer = vi.fn().mockResolvedValue(false);
    render(<AttendancePromptModal event={{ title: "Seminar" }} onAnswer={onAnswer} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByText("No"));
    
    await waitFor(() => expect(screen.getByText("Could not update attendance. Please try again.")).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText(/Did you attend/i)).toBeInTheDocument();
  });

  it("handles prompt utilities", () => {
    const candidate = {
      id: 11,
      title: "Lecture",
      start_time: "2026-03-01T10:00:00Z",
      end_time: "2026-03-01T11:00:00Z",
      source: "timetable",
      external_id: "abc-11",
    };
    expect(isInPromptWindow(candidate)).toBe(true);
    expect(getDateRangeForPrompt().start).toBeDefined();
    expect(findCandidateEvent([candidate], new Set())).toEqual(candidate);
    expect(isInPromptWindow({ start_time: "2026-02-25T08:00:00Z" })).toBe(false);
  });

  it("handles candidate polling hook", async () => {
    vi.useRealTimers();
    sessionStorage.clear();
    getEventsMock.mockResolvedValue([]);
    const { useCandidateEvent } = await vi.importActual("../../../components/Attendance/hooks/useCandidateEvent");

    renderHook(() => useCandidateEvent());
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(getEventsMock).toHaveBeenCalled());
    expect(getEventsMock.mock.calls[0][0]).toEqual(expect.objectContaining({ start: expect.any(String), end: expect.any(String) }));
  });

  it("stores prompted ids safely even when storage is bad", () => {
    attendanceStatsState.overall = { attended: 0, missed: 0 };
    localStorage.setItem("flax_attendance_prompted_ids", "not-json");
    expect(getPromptedIds()).toEqual(new Set());
    setPromptedId(15);
    expect(getPromptedIds().has(15)).toBe(true);
  });
});
