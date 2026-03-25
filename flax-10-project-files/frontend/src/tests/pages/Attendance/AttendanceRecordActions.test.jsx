import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isEventInPastMock = vi.fn();

vi.mock("lucide-react", () => ({
  Ban: () => <span>ban-icon</span>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ content, children }) => (
    <div data-testid="tooltip">
      <span>{content}</span>
      {children}
    </div>
  ),
}));

vi.mock("../../../pages/Attendance/utils/attendanceEventDate", () => ({
  isEventInPast: (...args) => isEventInPastMock(...args),
}));

import AttendanceRecordActions from "../../../pages/Attendance/components/AttendanceRecordActions";

describe("AttendanceRecordActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disabled future-event buttons inside the tooltip shell", () => {
    isEventInPastMock.mockReturnValue(false);

    render(
      <AttendanceRecordActions
        event={{ id: 5, start_time: "2026-04-01T12:00:00Z" }}
        submittingId={null}
        onRecord={vi.fn()}
      />,
    );

    expect(screen.getByTestId("tooltip")).toHaveTextContent("Lecture hasn't started yet");
    const buttons = screen.getAllByRole("button", { name: "Cannot mark future event" });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("renders past-event buttons and respects the submitting state", () => {
    isEventInPastMock.mockReturnValue(true);
    const onRecord = vi.fn();
    const { rerender } = render(
      <AttendanceRecordActions
        event={{ id: 7, start_time: "2026-03-01T12:00:00Z" }}
        submittingId={7}
        onRecord={onRecord}
      />,
    );

    expect(screen.getByRole("button", { name: "Attended" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Missed" })).toBeDisabled();

    rerender(
      <AttendanceRecordActions
        event={{ id: 7, start_time: "2026-03-01T12:00:00Z" }}
        submittingId={null}
        onRecord={onRecord}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Attended" }));
    fireEvent.click(screen.getByRole("button", { name: "Missed" }));
    expect(onRecord).toHaveBeenCalledWith(7, true);
    expect(onRecord).toHaveBeenCalledWith(7, false);
  });
});
