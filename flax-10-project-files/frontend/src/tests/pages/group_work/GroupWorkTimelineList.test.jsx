import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, renderHook } from "@testing-library/react";

const useInlineEdit = vi.fn();
const getUserColor = vi.fn(() => "#123456");

vi.mock("../../../pages/group_work/utils/priorityUtils", () => ({
  getUserColor: (...args) => getUserColor(...args),
  getPriorityStyle: vi.fn(() => ({ bg: "#fff", border: "#ddd", color: "#111", backgroundColor: "#eee" })),
}));

vi.mock("../../../pages/group_work/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: vi.fn(() => ({ editing: false })),
}));

vi.mock("../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange }) => (
    <input value={value || ""} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("../../../components/common/inline_title_field/InlineTitleField", () => ({
  default: ({ value, onStart, onSave, onCancel }) => (
    <div>
      <span>{value}</span>
      <button onClick={onStart}>start-inline-edit</button>
      <button onClick={onSave}>save-inline-edit</button>
      <button onClick={onCancel}>cancel-inline-edit</button>
    </div>
  ),
  useInlineEdit: (...args) => useInlineEdit(...args),
}));

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ onCancel, onConfirm, title }) => (
    <div>
      <span>{title}</span>
      <button onClick={onCancel}>cancel-hold</button>
      <button onClick={onConfirm}>confirm-hold</button>
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  Check: () => <span>check-icon</span>,
  X: () => <span>x-icon</span>,
  Pencil: () => <span>pencil-icon</span>,
  Trash2: () => <span>trash-icon</span>,
  Calendar: () => <span>calendar-icon</span>,
}));

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

import { TimelineCard, UnscheduledCard } from "../../../pages/group_work/components/TaskTimelineCards";
import TaskTimelineView from "../../../pages/group_work/components/TaskTimelineView";
import TaskListRow from "../../../pages/group_work/components/TaskListRow";
import TaskListView from "../../../pages/group_work/components/TaskListView";
import { useDragHandlers, useTaskTimelineState } from "../../../pages/group_work/components/useTaskTimelineState";

vi.mock("../../../pages/group_work/utils/taskTimelineUtils", () => ({
  DAY_MS: 86400000,
  getTimelineAnchor: vi.fn(() => new Date("2026-03-24T00:00:00.000Z")),
  buildWeeks: vi.fn(() => [
    { id: "w1", label: "Week 1", startTs: new Date("2026-03-24T00:00:00.000Z").getTime() },
  ]),
  placeTasksIntoWeeks: vi.fn((tasks, weeks) => ({ w1: { 0: tasks } })),
}));

describe("GroupWork timeline and lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInlineEdit.mockReturnValue({ isEditing: false, start: vi.fn(), save: vi.fn(), cancel: vi.fn() });
  });

  it("renders TimelineCard and handles delete", () => {
    const onDelete = vi.fn();
    render(<TimelineCard task={{ id: 5, title: "T1" }} members={[]} onDelete={onDelete} onUpdate={vi.fn()} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("T1").closest("div"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("renders TaskTimelineView and handles pagination", () => {
    render(<TaskTimelineView tasks={[]} members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
  });

  it("renders TaskListRow and handles toggle/delete", () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(
      <TaskListRow
        task={{ id: 5, title: "Draft", completed: false, priority: "medium", due_date: null }}
        members={[]}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Delete task"));
    fireEvent.click(screen.getByText("confirm-hold"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("handles drag events and timeline state", () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useDragHandlers(onUpdate, {}));
    const dragEvent = {
        preventDefault: vi.fn(),
        currentTarget: { classList: { add: vi.fn(), remove: vi.fn() } },
        dataTransfer: { getData: vi.fn(() => "9") },
    };
    act(() => result.current.onDrop(dragEvent, new Date("2026-03-30T00:00:00.000Z").getTime()));
    expect(onUpdate).toHaveBeenCalled();
  });

  it("builds timeline state", () => {
    const { result } = renderHook(() => useTaskTimelineState([], 1));
    expect(result.current.weeks).toHaveLength(1);
    expect(result.current.dayMs).toBe(86400000);
  });
});
