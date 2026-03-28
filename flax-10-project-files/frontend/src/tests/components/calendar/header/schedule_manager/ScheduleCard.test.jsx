/*
 * Tests for ScheduleCard and all its internal sub-components.
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ScheduleCard } from "../../../../../components/calendar/header/schedule_manager/ScheduleCard";

vi.mock("../../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("../../../../../components/common/text_input/TextInput", () => ({
  default: ({ value, onChange, "aria-label": ariaLabel, placeholder }) => (
    <input aria-label={ariaLabel || placeholder} value={value} onChange={onChange} />
  ),
}));

vi.mock("../../../../../components/calendar/header/CalendarHeaderUtils.module.css", () => ({
  default: {
    scheduleCard: "scheduleCard", scheduleInfo: "scheduleInfo",
    scheduleCardTitle: "scheduleCardTitle", scheduleMeta: "scheduleMeta",
    scheduleActions: "scheduleActions",
  },
}));

const schedule = { id: "sched-1", title: "Study Plan", event_allocations: [1, 2, 3] };

function makeProps(overrides = {}) {
  return {
    schedule,
    editingId: null,
    renameDraft: "",
    isSaving: false,
    isRemoving: false,
    onRenameStart: vi.fn(),
    onRenameCancel: vi.fn(),
    onRenameSave: vi.fn(),
    onRenameDraftChange: vi.fn(),
    onRemoveRequest: vi.fn(),
    ...overrides,
  };
}

describe("ScheduleCard – view mode", () => {
  it("renders the title, allocation count, Rename and Remove buttons", () => {
    render(<ScheduleCard {...makeProps()} />);
    expect(screen.getByText("Study Plan")).toBeInTheDocument();
    expect(screen.getByText("3 allocated events")).toBeInTheDocument();
    expect(screen.getByText("Rename")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("shows 0 allocated events when event_allocations is undefined", () => {
    render(<ScheduleCard {...makeProps({ schedule: { ...schedule, event_allocations: undefined } })} />);
    expect(screen.getByText("0 allocated events")).toBeInTheDocument();
  });

  it("calls onRenameStart with the schedule when Rename is clicked", () => {
    const props = makeProps();
    render(<ScheduleCard {...props} />);
    fireEvent.click(screen.getByText("Rename"));
    expect(props.onRenameStart).toHaveBeenCalledWith(schedule);
  });

  it("calls onRemoveRequest with the schedule id when Remove is clicked", () => {
    const props = makeProps();
    render(<ScheduleCard {...props} />);
    fireEvent.click(screen.getByText("Remove"));
    expect(props.onRemoveRequest).toHaveBeenCalledWith("sched-1");
  });

  it("disables the Remove button when isRemoving is true", () => {
    render(<ScheduleCard {...makeProps({ isRemoving: true })} />);
    expect(screen.getByText("Remove")).toBeDisabled();
  });

  it("stays in view mode when editingId refers to a different schedule", () => {
    render(<ScheduleCard {...makeProps({ editingId: "sched-99" })} />);
    expect(screen.getByText("Study Plan")).toBeInTheDocument();
    expect(screen.getByText("Rename")).toBeInTheDocument();
  });
});

describe("ScheduleCard – edit mode", () => {
  it("shows a text input and Save/Cancel buttons when editingId matches", () => {
    render(<ScheduleCard {...makeProps({ editingId: "sched-1", renameDraft: "New Name" })} />);
    expect(screen.getByDisplayValue("New Name")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.queryByText("Rename")).not.toBeInTheDocument();
  });

  it("calls onRenameDraftChange when the input value changes", () => {
    const props = makeProps({ editingId: "sched-1", renameDraft: "Old" });
    render(<ScheduleCard {...props} />);
    fireEvent.change(screen.getByDisplayValue("Old"), { target: { value: "Updated" } });
    expect(props.onRenameDraftChange).toHaveBeenCalledWith("Updated");
  });

  it("calls onRenameSave with the schedule id when Save is clicked", () => {
    const props = makeProps({ editingId: "sched-1" });
    render(<ScheduleCard {...props} />);
    fireEvent.click(screen.getByText("Save"));
    expect(props.onRenameSave).toHaveBeenCalledWith("sched-1");
  });

  it("calls onRenameCancel when Cancel is clicked", () => {
    const props = makeProps({ editingId: "sched-1" });
    render(<ScheduleCard {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onRenameCancel).toHaveBeenCalled();
  });

  it("disables the Save button when isSaving is true", () => {
    render(<ScheduleCard {...makeProps({ editingId: "sched-1", isSaving: true })} />);
    expect(screen.getByText("Save")).toBeDisabled();
  });
});
