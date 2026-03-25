import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ScheduleManagerButton } from "../../../../../components/Calendar/header/ScheduleManager/ScheduleManagerButton";

const showToast = vi.fn();
const editEvent = vi.fn();
const buildConflictResolutionPlan = vi.fn();
const applyConflictResolutionPlan = vi.fn();
const buildConflictResolutionToastMessage = vi.fn();

vi.mock("../../../../../context/CalendarContext", () => ({
  useCalendar: () => ({
    events: [{ id: 1, title: "Study" }],
    selectedDate: new Date("2026-03-24T00:00:00.000Z"),
  }),
}));

vi.mock("../../../../../context/ToastContext", () => ({
  useToast: () => showToast,
}));

vi.mock("../../../../../components/Calendar/hooks/useCalendarEvents", () => ({
  useEventActions: () => ({ editEvent }),
}));

vi.mock("../../../../../components/Common/Tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../../components/common/ConfirmModal/ConfirmModal", () => ({
  default: ({ onConfirm, onCancel, confirmText, cancelText, title }) => (
    <div>
      <div>{title}</div>
      <button type="button" onClick={onConfirm}>{confirmText}</button>
      <button type="button" onClick={onCancel}>{cancelText}</button>
    </div>
  ),
}));

vi.mock("../../../../../components/Common/RescheduleEvents/rescheduleEventConflicts", () => ({
  buildConflictResolutionPlan: (...args) => buildConflictResolutionPlan(...args),
  applyConflictResolutionPlan: (...args) => applyConflictResolutionPlan(...args),
  buildConflictResolutionToastMessage: (...args) => buildConflictResolutionToastMessage(...args),
  undoConflictResolutionPlan: vi.fn(),
}));

describe("ScheduleManagerButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a toast and skips edits when there is nothing to reschedule", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    buildConflictResolutionToastMessage.mockReturnValue("All clear");

    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("All clear"));
    expect(applyConflictResolutionPlan).not.toHaveBeenCalled();
    expect(editEvent).not.toHaveBeenCalled();
  });

  it("shows the failure toast when rescheduling fails", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "move-1" }] });
    applyConflictResolutionPlan.mockRejectedValue(new Error("boom"));

    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));

    await waitFor(() => expect(applyConflictResolutionPlan).toHaveBeenCalledWith({ operations: [{ id: "move-1" }] }, editEvent));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Try again."));
  });
});
