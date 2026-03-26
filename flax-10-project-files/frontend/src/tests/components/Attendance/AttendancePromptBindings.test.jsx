import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";

import { render, screen } from "../../../utils/testUtils";

const dismissAttendancePromptMock = vi.fn();
const submitAttendancePromptAnswerMock = vi.fn();
const candidateState = { setValue: vi.fn(), value: null };

vi.mock("../../../components/Attendance/AttendancePromptModal", () => ({
  default: ({ onAnswer, onDismiss }) => (
    <div>
      <button type="button" onClick={() => onAnswer(true, { closeDelayMs: 0 })}>
        answer-yes
      </button>
      <button type="button" onClick={onDismiss}>
        dismiss-prompt
      </button>
    </div>
  ),
}));

vi.mock("../../../components/Attendance/attendancePromptActions", () => ({
  dismissAttendancePrompt: (...args) => dismissAttendancePromptMock(...args),
  submitAttendancePromptAnswer: (...args) => submitAttendancePromptAnswerMock(...args),
}));

vi.mock("../../../components/Attendance/hooks/useCandidateEvent", () => ({
  useCandidateEvent: () => [candidateState.value, candidateState.setValue],
}));

import AttendancePrompt from "../../../components/Attendance/AttendancePrompt";

describe("AttendancePrompt bindings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    candidateState.setValue = vi.fn();
    candidateState.value = { id: 12, title: "Lecture" };
  });

  it("wires answer and dismiss callbacks through the attendance action helpers", () => {
    render(<AttendancePrompt />);

    fireEvent.click(screen.getByText("answer-yes"));
    expect(submitAttendancePromptAnswerMock).toHaveBeenCalledWith(
      candidateState.value,
      true,
      false,
      candidateState.setValue,
      expect.any(Function),
      { closeDelayMs: 0 },
    );

    fireEvent.click(screen.getByText("dismiss-prompt"));
    expect(dismissAttendancePromptMock).toHaveBeenCalledWith(candidateState.value, candidateState.setValue);
  });
});
