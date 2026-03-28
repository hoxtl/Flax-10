import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineCard, UnscheduledCard } from "@/pages/group_work/components/TaskTimelineCards";
import * as editUtils from "@/pages/group_work/components/taskCardEditUtils";

vi.mock("@/pages/group_work/components/TaskAvatarStack", () => ({
  default: () => <div data-testid="avatar-stack">Avatars</div>,
}));

vi.mock("@/pages/group_work/components/TaskAssigneePopup", () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="assign-popup">Popup</div> : null),
}));

vi.mock("@/pages/group_work/components/TaskContextMenu", () => ({
  default: ({ onEditStart, onDelete, task }) => (
    <div data-testid="ctx-menu">
      <button onClick={onEditStart}>Edit</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getPriorityStyle: vi.fn(() => ({ bg: "red", border: "darkred", text: "white", color: "white", backgroundColor: "red" })),
}));

vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: vi.fn(),
  filterVisibleAssignees: vi.fn((info) => info || []),
  handleDragStartTask: vi.fn(),
}));

vi.mock("@/pages/group_work/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: vi.fn(),
}));

describe("TaskTimelineCards", () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const members = [];
  const task = { id: 1, title: "Timeline Task", priority: "high", completed: false };

  const mockEditState = {
    editing: false,
    editTitle: "Timeline Task",
    setEditTitle: vi.fn(),
    setEditing: vi.fn(),
    saveEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    editUtils.useTaskTitleEdit.mockReturnValue(mockEditState);
  });

  describe("TimelineCard", () => {
    it("renders correctly and handles interactions", () => {
      render(<TimelineCard task={task} members={members} onUpdate={onUpdate} onDelete={onDelete} />);
      
      expect(screen.getByText("Timeline Task")).toBeTruthy();
      expect(screen.getByTestId("avatar-stack")).toBeTruthy();

      // Toggle popup
      fireEvent.click(screen.getByTestId("avatar-stack").parentElement);
      expect(screen.getByTestId("assign-popup")).toBeTruthy();

      // Right click for context menu
      fireEvent.contextMenu(screen.getByText("Timeline Task").parentElement.parentElement);
      expect(screen.getByTestId("ctx-menu")).toBeTruthy();
    });

    it("handles editing mode", () => {
      editUtils.useTaskTitleEdit.mockReturnValue({ ...mockEditState, editing: true });
      render(<TimelineCard task={task} members={members} onUpdate={onUpdate} />);
      
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Title" } });
      expect(mockEditState.setEditTitle).toHaveBeenCalledWith("New Title");

      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockEditState.saveEdit).toHaveBeenCalled();

      fireEvent.keyDown(input, { key: "Escape" });
      expect(mockEditState.setEditing).toHaveBeenCalledWith(false);
    });

    it("applies completion opacity", () => {
      const doneTask = { ...task, completed: true };
      const { container } = render(<TimelineCard task={doneTask} members={members} />);
      // Expected opacity 0.6 - styles are inline
      const card = container.querySelector('[style*="opacity: 0.6"]');
      expect(card).toBeTruthy();
    });
  });

  describe("UnscheduledCard", () => {
    it("renders and handles edit via context menu", () => {
      render(<UnscheduledCard task={task} members={members} onUpdate={onUpdate} onDelete={onDelete} />);
      
      expect(screen.getByText("Timeline Task")).toBeTruthy();
      
      fireEvent.contextMenu(screen.getByText("Timeline Task").parentElement);
      fireEvent.click(screen.getByText("Edit"));
      expect(mockEditState.setEditing).toHaveBeenCalledWith(true);
    });

    it("renders edit input when editing", () => {
      editUtils.useTaskTitleEdit.mockReturnValue({ ...mockEditState, editing: true });
      render(<UnscheduledCard task={task} members={members} />);
      expect(screen.getByRole("textbox")).toBeTruthy();
    });
  });
});
