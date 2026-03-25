import { describe, expect, it, vi } from "vitest";
import { act, render, screen, renderHook } from "@testing-library/react";

const getTimelineAnchor = vi.fn(() => new Date("2026-03-24T00:00:00.000Z"));
const buildWeeks = vi.fn(() => [
  { id: "w1", label: "Week 1", startTs: new Date("2026-03-24T00:00:00.000Z").getTime() },
  { id: "w2", label: "Week 2", startTs: new Date("2026-03-31T00:00:00.000Z").getTime() },
]);

vi.mock("../../../pages/GroupWork/utils/taskTimelineUtils", () => ({
  DAY_MS: 86400000,
  getTimelineAnchor: () => new Date("2026-03-24T00:00:00.000Z"),
  buildWeeks: () => [
    { id: "w1", label: "Week 1", startTs: new Date("2026-03-24T00:00:00.000Z").getTime() },
    { id: "w2", label: "Week 2", startTs: new Date("2026-03-31T00:00:00.000Z").getTime() },
    { id: "w3", label: "Week 3", startTs: 1775779200000 },
    { id: "w4", label: "Week 4", startTs: 1776384000000 },
  ],
  placeTasksIntoWeeks: vi.fn((tasks, weeks) => Object.fromEntries(
    weeks.map((week) => [week.id, { 0: tasks.filter((t) => t.weekId === week.id) }]),
  )),
}));

vi.mock("../../../pages/GroupWork/components/TaskTimelineCards", () => ({
  TimelineCard: ({ task }) => <div>Timeline:{task.title}</div>,
  UnscheduledCard: ({ task }) => <div>Unscheduled:{task.title}</div>,
}));

import TaskTimelineView from "../../../pages/GroupWork/components/TaskTimelineView";
import { useDragHandlers, useTaskTimelineState } from "../../../pages/GroupWork/components/useTaskTimelineState";

describe("GroupWork task component - Timeline", () => {
  it("renders TaskTimelineView and basic headers", () => {
    const tasks = [{ id: 1, title: "Task A", weekId: "w1", due_date: "2026-03-25T00:00:00.000Z" }];
    render(<TaskTimelineView tasks={tasks} members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
  });

  it("handles drag events in useDragHandlers", () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useDragHandlers(onUpdate, {}));

    const dragEvent = {
      preventDefault: vi.fn(),
      currentTarget: { classList: { add: vi.fn(), remove: vi.fn() } },
      dataTransfer: { getData: vi.fn(() => "9") },
    };

    act(() => result.current.onDragOver(dragEvent));
    expect(dragEvent.currentTarget.classList.add).toHaveBeenCalled();
    act(() => result.current.onDrop(dragEvent, new Date("2026-03-30T00:00:00.000Z").getTime()));
    expect(onUpdate).toHaveBeenCalledWith(9, expect.objectContaining({ due_date: expect.any(String) }));
  });

  it("derives timeline state in useTaskTimelineState", () => {
    const { result } = renderHook(() => useTaskTimelineState([
      { id: 1, weekId: "w1", due_date: "2026-03-25T00:00:00.000Z", completed: false },
      { id: 2, due_date: null, completed: false },
    ], 1));

    expect(result.current.weeks).toBeDefined();
    expect(result.current.unscheduled).toHaveLength(1);
    expect(result.current.dayMs).toBe(86400000);
  });
});
