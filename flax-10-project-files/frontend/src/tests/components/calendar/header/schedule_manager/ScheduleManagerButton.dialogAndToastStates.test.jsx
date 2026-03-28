/*
 * Dialog-state and toast-behaviour tests for ScheduleManagerButton.
 */

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

let mockProfile = { role: "student" };

vi.mock("../../../../../context/CalendarContext", () => ({
  useCalendar: () => ({ events: [{ id: 1 }], selectedDate: new Date("2026-03-24T00:00:00Z") }),
}));

vi.mock("../../../../../context/ToastContext", () => ({
  useToast: () => showToast,
}));

vi.mock("../../../../../context/AuthContext", () => ({
  useAuth: () => ({ profile: mockProfile }),
}));

vi.mock("../../../../../components/calendar/hooks/useCalendarEvents", () => ({
  useEventActions: () => ({ editEvent }),
  useCalendarEvents: () => ({ loadEvents }),
}));

vi.mock("../../../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../../components/common/confirm_modal/ConfirmModal", () => ({
  default: ({ onConfirm, onCancel, confirmText, cancelText, title, infoHint }) => (
    <div>
      <span>{title}</span>
      <span data-testid="info-hint">{infoHint}</span>
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

describe("ScheduleManagerButton dialogs and toast states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile = { role: "student" };
  });

  it("renders both the Auto-schedule and Reschedule buttons", () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    render(<ScheduleManagerButton />);
    expect(screen.getByLabelText("Auto schedule study time")).toBeInTheDocument();
    expect(screen.getByLabelText("Reschedule my events")).toBeInTheDocument();
  });

  it("opens the reschedule confirm modal when TriggerButton is clicked", () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    expect(screen.getByText("Reschedule now")).toBeInTheDocument();
  });

  it("shows the student hint (includes societies) in the reschedule modal", () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    expect(screen.getByTestId("info-hint").textContent).toContain("Lectures, societies, exams,");
  });

  it("shows the teacher hint (no societies) in the reschedule modal", () => {
    mockProfile = { role: "teacher" };
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    const hint = screen.getByTestId("info-hint").textContent;
    expect(hint).toContain("Lectures, exams,");
    expect(hint).not.toContain("societies");
  });

  it("closes the reschedule dialog when Keep plan is clicked", () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Keep plan"));
    expect(screen.queryByText("Reschedule now")).not.toBeInTheDocument();
  });

  it("shows a success toast without failure count when all moves succeed", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "op-1" }] });
    buildConflictResolutionToastMessage.mockReturnValue("Events rescheduled.");
    applyConflictResolutionPlan.mockResolvedValue({ failures: [] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Events rescheduled."));
  });

  it("opens the auto-schedule confirm modal when AutoScheduleButton is clicked", () => {
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Auto schedule study time"));
    expect(screen.getByText("Auto schedule")).toBeInTheDocument();
  });

  it("confirms auto-schedule and executes the flow", async () => {
    loadUpcomingDeadlineItems.mockResolvedValue([]);
    loadScheduleSettings.mockResolvedValue({});
    submitAutoScheduleWithPrefs.mockResolvedValue(undefined);
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Auto schedule study time"));
    fireEvent.click(screen.getByText("Auto schedule"));
    await waitFor(() => expect(submitAutoScheduleWithPrefs).toHaveBeenCalled());
  });

  it("closes the auto-schedule dialog when Not now is clicked", () => {
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Auto schedule study time"));
    expect(screen.getByText("Not now")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Not now"));
    expect(screen.queryByText("Not now")).not.toBeInTheDocument();
  });

  it("shows toast when no reschedule operations (empty plan)", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [] });
    buildConflictResolutionToastMessage.mockReturnValue("Nothing to reschedule 🗓️");
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Nothing to reschedule 🗓️"));
  });

  it("shows catch toast when applyConflictResolutionPlan throws", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "op-1" }] });
    applyConflictResolutionPlan.mockRejectedValue(new Error("API error"));
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Try again."));
  });

  it("shows read-only toast when all operations fail", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "op-1" }] });
    applyConflictResolutionPlan.mockResolvedValue({ failures: ["op-1"] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Some conflicts are read-only."));
  });

  it("appends failure count when some operations fail (partial failures)", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "op-1" }, { id: "op-2" }] });
    buildConflictResolutionToastMessage.mockReturnValue("Rescheduled.");
    applyConflictResolutionPlan.mockResolvedValue({ failures: ["op-2"] });
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Rescheduled. 1 couldn't be moved."));
  });

  it("treats missing failures field as 0 failures (null-safe result handling)", async () => {
    buildConflictResolutionPlan.mockReturnValue({ operations: [{ id: "op-1" }] });
    buildConflictResolutionToastMessage.mockReturnValue("Rescheduled.");
    applyConflictResolutionPlan.mockResolvedValue({});
    render(<ScheduleManagerButton />);
    fireEvent.click(screen.getByLabelText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Rescheduled."));
  });
});
