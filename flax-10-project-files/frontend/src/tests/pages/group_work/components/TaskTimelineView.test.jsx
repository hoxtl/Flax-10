import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskTimelineView from "@/pages/group_work/components/TaskTimelineView";
import * as timelineHook from "@/pages/group_work/components/useTaskTimelineState";
import styles from "@/pages/group_work/components/TaskTimelineView.module.css";

vi.mock("@/pages/group_work/components/TaskTimelineCards", () => ({
  TimelineCard: ({ task }) => <div data-testid={`timeline-card-${task.id}`}>{task.title}</div>,
  UnscheduledCard: ({ task }) => <div data-testid={`unscheduled-card-${task.id}`}>{task.title}</div>,
}));

const mockHandlers = {
  onDragOver: vi.fn((e) => e.preventDefault()),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  onDropWidget: vi.fn(),
};

vi.mock("@/pages/group_work/components/useTaskTimelineState", () => ({
  useTaskTimelineState: vi.fn(),
  useDragHandlers: vi.fn(() => mockHandlers),
}));

describe("TaskTimelineView", () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const tasks = [];
  const members = [];

  const mockTimelineState = {
    weeks: Array.from({ length: 9 }, (_, i) => ({ id: i, label: `Week ${i+1} (Oct ${i+1})`, startTs: i * 1000 * 3600 * 24 * 7 })),
    placed: { 0: { 0: [{ id: 1, title: "Placed Task" }] } },
    unscheduled: [{ id: 2, title: "Unscheduled Task" }],
    visible: [{ id: 0, label: "Week 1 (Oct 1)", startTs: 0 }],
    dayMs: 1000 * 3600 * 24,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    timelineHook.useTaskTimelineState.mockReturnValue(mockTimelineState);
  });

  it("renders correctly and handles interactions", () => {
    render(<TaskTimelineView tasks={tasks} members={members} onUpdate={onUpdate} onDelete={onDelete} />);
    
    expect(screen.getByText("Unscheduled")).toBeTruthy();
    expect(screen.getByTestId("unscheduled-card-2")).toBeTruthy();
    expect(screen.getByTestId("timeline-card-1")).toBeTruthy();
    expect(screen.getByText("Week 1")).toBeTruthy();
    expect(screen.getByText("(Oct 1)")).toBeTruthy();
    
    // Check pagination dots (9 weeks / 3 = 3 pages)
    const dots = screen.getAllByRole("button");
    expect(dots.length).toBe(3);
    
    fireEvent.click(dots[1]);
    expect(timelineHook.useTaskTimelineState).toHaveBeenCalledWith(tasks, 1);
  });

  it("handles drag and drop interactions", () => {
    render(<TaskTimelineView tasks={tasks} members={members} onUpdate={onUpdate} />);
    
    // Drag over unscheduled widget
    const widget = screen.getByText("Unscheduled").parentElement.nextSibling;
    fireEvent.dragOver(widget);
    expect(widget.classList.contains(styles.widgetListDropTarget)).toBeTruthy();

    fireEvent.dragLeave(widget);
    expect(widget.classList.contains(styles.widgetListDropTarget)).toBe(false);

    fireEvent.drop(widget);
    expect(mockHandlers.onDropWidget).toHaveBeenCalled();

    // Drop on grid cell
    const cell = screen.getByTestId("timeline-card-1").parentElement;
    fireEvent.drop(cell);
    expect(mockHandlers.onDrop).toHaveBeenCalled();
  });

  it("shows all scheduled message when unscheduled is empty", () => {
    timelineHook.useTaskTimelineState.mockReturnValue({
      ...mockTimelineState,
      unscheduled: []
    });
    render(<TaskTimelineView tasks={tasks} members={members} />);
    expect(screen.getByText("All tasks scheduled!")).toBeTruthy();
  });

  it("handles labels that don't match the regex", () => {
    timelineHook.useTaskTimelineState.mockReturnValue({
      ...mockTimelineState,
      visible: [{ id: 0, label: "InvalidLabel" }]
    });
    render(<TaskTimelineView tasks={tasks} members={members} />);
    expect(screen.getByText("InvalidLabel")).toBeTruthy();
  });
});
