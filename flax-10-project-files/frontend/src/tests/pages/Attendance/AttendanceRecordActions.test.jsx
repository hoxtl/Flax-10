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

vi.mock("../../../pages/attendance/utils/attendanceEventDate", () => ({
  isEventInPast: (...args) => isEventInPastMock(...args),
}));

import AttendanceRecordActions from "../../../pages/attendance/components/AttendanceRecordActions";

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

  it("disables buttons when submitting", () => {
    isEventInPastMock.mockReturnValue(true);
    render(<AttendanceRecordActions event={{ id: 7 }} submittingId={7} onRecord={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Attended" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Missed" })).toBeDisabled();
  });

  it("calls onRecord when buttons are clicked", () => {
    isEventInPastMock.mockReturnValue(true);
    const onRecord = vi.fn();
    render(<AttendanceRecordActions event={{ id: 7 }} submittingId={null} onRecord={onRecord} />);
    fireEvent.click(screen.getByRole("button", { name: "Attended" }));
    fireEvent.click(screen.getByRole("button", { name: "Missed" }));
    expect(onRecord).toHaveBeenCalledWith(7, true);
    expect(onRecord).toHaveBeenCalledWith(7, false);
  });
});
