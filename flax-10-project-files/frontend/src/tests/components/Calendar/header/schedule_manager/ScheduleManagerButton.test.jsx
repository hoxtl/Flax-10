import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ScheduleManagerButton } from "../../../../../components/calendar/header/schedule_manager/ScheduleManagerButton";

const showToast = vi.fn();
const editEvent = vi.fn();
const loadEvents = vi.fn();
const buildConflictResolutionPlan = vi.fn();
const applyConflictResolutionPlan = vi.fn();
const buildConflictResolutionToastMessage = vi.fn();
const loadUpcomingDeadlineItems = vi.fn();
const loadScheduleSettings = vi.fn();
const submitAutoScheduleWithPrefs = vi.fn();

vi.mock("../../../../../context/CalendarContext", () => ({
  useCalendar: () => ({
    events: [{ id: 1, title: "Study" }],
    selectedDate: new Date("2026-03-24T00:00:00.000Z"),
  }),
}));

vi.mock("../../../../../context/ToastContext", () => ({
  useToast: () => showToast,
}));

vi.mock("../../../../../components/calendar/hooks/useCalendarEvents", () => ({
  useEventActions: () => ({ editEvent }),
  useCalendarEvents: () => ({ loadEvents }),
}));

vi.mock("../../../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../../components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ onConfirm, onCancel, confirmText, cancelText, title }) => (
    <div>
      <div>{title}</div>
      <button type="button" onClick={onConfirm}>{confirmText}</button>
      <button type="button" onClick={onCancel}>{cancelText}</button>
    </div>
  ),
}));

vi.mock("../../../../../components/common/reschedule_events/rescheduleEventConflicts", () => ({
  buildConflictResolutionPlan: (...args) => buildConflictResolutionPlan(...args),
  applyConflictResolutionPlan: (...args) => applyConflictResolutionPlan(...args),
  buildConflictResolutionToastMessage: (...args) => buildConflictResolutionToastMessage(...args),
  undoConflictResolutionPlan: vi.fn(),
}));

vi.mock("../../../../../components/schedules/auto/autoScheduleActions", () => ({
  loadUpcomingDeadlineItems: (...args) => loadUpcomingDeadlineItems(...args),
  loadScheduleSettings: (...args) => loadScheduleSettings(...args),
  submitAutoScheduleWithPrefs: (...args) => submitAutoScheduleWithPrefs(...args),
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

  it("shows the read-only conflict toast when every move fails", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "move-1" }] });
    applyConflictResolutionPlan.mockResolvedValue({ failures: [{ id: "move-1" }] });

    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Some conflicts are read-only."));
  });

  it("appends the partial-failure count to the success message", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "move-1" }, { id: "move-2" }] });
    buildConflictResolutionToastMessage.mockReturnValue("Moved your events.");
    applyConflictResolutionPlan.mockResolvedValue({ failures: [{ id: "move-2" }] });

    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Moved your events. 1 couldn't be moved."));
  });

  it("runs the auto-schedule flow and reloads events on completion", async () => {
    loadUpcomingDeadlineItems.mockResolvedValue([{ id: "deadline-1" }]);
    loadScheduleSettings.mockResolvedValue({ dailyTarget: 2 });
    submitAutoScheduleWithPrefs.mockResolvedValue(undefined);

    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Auto schedule study time"));
    fireEvent.click(screen.getByText("Auto schedule"));

    await waitFor(() => {
      expect(submitAutoScheduleWithPrefs).toHaveBeenCalledWith({
        deadlines: [{ id: "deadline-1" }],
        settings: { dailyTarget: 2 },
        showToast,
        onDone: loadEvents,
      });
    });
  });

  it("closes the auto-schedule dialog when cancelled", () => {
    render(<ScheduleManagerButton />);

    fireEvent.click(screen.getByLabelText("Auto schedule study time"));
    expect(screen.getByText("Auto schedule study time")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Not now"));
    expect(screen.queryByText("Auto schedule study time")).not.toBeInTheDocument();
  });
});
