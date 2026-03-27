import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";

import { render, screen } from "../../../utils/testUtils";

const dismissAttendancePromptMock = vi.fn();
const submitAttendancePromptAnswerMock = vi.fn();
const candidateState = { setValue: vi.fn(), value: null };

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/attendance/AttendancePromptBindings.test.jsx
vi.mock("../../../components/attendance/components/AttendancePromptModal", () => ({
=======
vi.mock("../../../components/attendance/AttendancePromptModal", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Attendance/AttendancePromptBindings.test.jsx
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

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/attendance/AttendancePromptBindings.test.jsx
vi.mock("../../../components/attendance/utils/attendancePromptActions", () => ({
=======
vi.mock("../../../components/attendance/attendancePromptActions", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Attendance/AttendancePromptBindings.test.jsx
  dismissAttendancePrompt: (...args) => dismissAttendancePromptMock(...args),
  submitAttendancePromptAnswer: (...args) => submitAttendancePromptAnswerMock(...args),
}));

vi.mock("../../../components/attendance/hooks/useCandidateEvent", () => ({
  useCandidateEvent: () => [candidateState.value, candidateState.setValue],
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/attendance/AttendancePromptBindings.test.jsx
import AttendancePrompt from "../../../components/attendance/components/AttendancePrompt";
=======
import AttendancePrompt from "../../../components/attendance/AttendancePrompt";
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Attendance/AttendancePromptBindings.test.jsx

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
