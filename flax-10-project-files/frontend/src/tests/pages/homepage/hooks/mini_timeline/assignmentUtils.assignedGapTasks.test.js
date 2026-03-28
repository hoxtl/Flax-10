/*
 * Tests for deriveAssignedGapTasks – assigning tasks to free gap rows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { deriveAssignedGapTasks } from "../../../../../pages/homepage/hooks/mini_timeline/assignmentUtils";

const { getTasksThatFitGapMock, taskDurationMinsMock } = vi.hoisted(() => ({
  getTasksThatFitGapMock: vi.fn(),
  taskDurationMinsMock: vi.fn(),
}));

vi.mock("../../../../../pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: (...args) => taskDurationMinsMock(...args),
  getTasksThatFitGap: (...args) => getTasksThatFitGapMock(...args),
}));

const NOW = new Date("2024-06-01T12:00:00Z");

const FREE_ROW_A = { id: "row-a", type: "free", minutes: 60, gapStartMins: 480 };
const FREE_ROW_B = { id: "row-b", type: "free", minutes: 30, gapStartMins: 600 };
const BUSY_ROW = { id: "row-busy", type: "busy", minutes: 60 };

const TASK_LOW = { id: "t1", title: "Low task", priority: "low", estimated_blocks: 2, completed: false };
const TASK_HIGH = { id: "t2", title: "High task", priority: "high", estimated_blocks: 1, completed: false };
const TASK_COMPLETED = { id: "t4", title: "Done task", priority: "low", estimated_blocks: 1, completed: true };

const TASK_OVERDUE = { id: "overdue-1", title: "Overdue task", priority: "low", estimated_blocks: 1, completed: false, due_date: "2024-05-01T00:00:00Z" };
const TASK_FUTURE = { id: "future-1", title: "Future task", priority: "urgent", estimated_blocks: 1, completed: false, due_date: "2024-06-20T00:00:00Z" };
const TASK_SHORTER = { id: "short-1", title: "Short task", priority: "medium", estimated_blocks: 1, completed: false, due_date: "2024-06-20T00:00:00Z" };
const TASK_LONGER = { id: "long-1", title: "Long task", priority: "medium", estimated_blocks: 2, completed: false, due_date: "2024-06-20T00:00:00Z" };
const TASK_TWIN_A = { id: "twin-a", title: "Twin A", priority: "medium", estimated_blocks: 1, completed: false, due_date: "2024-06-20T00:00:00Z" };
const TASK_TWIN_B = { id: "twin-b", title: "Twin B", priority: "medium", estimated_blocks: 1, completed: false, due_date: "2024-06-20T00:00:00Z" };
const TASK_UNKNOWN_PRIORITY = { id: "unknown-priority", title: "Unknown priority", priority: "someday", estimated_blocks: 1, completed: false };
const TASK_KNOWN_LOW = { id: "known-low", title: "Known low", priority: "low", estimated_blocks: 1, completed: false };
const TASK_KNOWN_MEDIUM = { id: "known-medium", title: "Known medium", priority: "medium", estimated_blocks: 1, completed: false };
const TASK_UNKNOWN_SECOND = { id: "unknown-second", title: "Unknown second", priority: "mystery", estimated_blocks: 1, completed: false };

const emptySlottedIds = new Set();
const emptySlottedTitles = new Set();
const emptySkipped = {};

describe("deriveAssignedGapTasks", () => {
  beforeEach(() => {
    taskDurationMinsMock.mockImplementation((task) => (task?.estimated_blocks ?? 1) * 25);
    getTasksThatFitGapMock.mockImplementation((tasks, gapMinutes) => {
      const fits = tasks.filter((task) => (task?.estimated_blocks ?? 1) * 25 <= gapMinutes);
      return { suggested: fits[0] ?? null };
    });
  });

  it("returns empty map and nextMap when rows is empty", () => {
    const result = deriveAssignedGapTasks([], [TASK_LOW], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map).toEqual({});
    expect(result.nextMap).toEqual({});
  });

  it("returns empty map when suggestableTasks is empty", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A, FREE_ROW_B], [], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map).toEqual({});
  });

  it("skips completed tasks", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_COMPLETED], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("assigns a task to a free row when it fits", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_LOW], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-a"]).toBeDefined();
    expect(result.map["row-a"].id).toBe("t1");
  });

  it("does not assign the same task to two rows", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A, FREE_ROW_B], [TASK_HIGH], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    const assignedIds = Object.values(result.map).filter(Boolean).map((t) => t.id);
    expect(new Set(assignedIds).size).toBe(assignedIds.length);
  });

  it("skips tasks in the skipped set for that row", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_LOW], NOW, { "row-a": new Set(["t1"]) }, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("skips tasks already in slottedTaskIds", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_LOW], NOW, emptySkipped, new Set(["t1"]), emptySlottedTitles);
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("skips tasks whose title is in slottedTitles", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_LOW], NOW, emptySkipped, emptySlottedIds, new Set(["Low task"]));
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("ignores non-free rows", () => {
    const result = deriveAssignedGapTasks([BUSY_ROW, FREE_ROW_A], [TASK_LOW], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-busy"]).toBeUndefined();
  });

  it("produces nextMap pointing each row to the next row's assignment", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A, FREE_ROW_B], [TASK_HIGH, TASK_LOW], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.nextMap["row-a"]).toEqual(result.map["row-b"] || null);
  });

  it("prefers overdue tasks over non-overdue tasks when both fit", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_FUTURE, TASK_OVERDUE], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-a"]).toMatchObject({ id: "overdue-1" });
  });

  it("prefers the longer fitting task when rank ties exactly", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], [TASK_SHORTER, TASK_LONGER], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-a"]).toMatchObject({ id: "long-1" });
  });

  it("keeps a stable choice when candidate ranks are identical", () => {
    const result = deriveAssignedGapTasks(
      [{ id: "row-start-only", type: "free", startMins: 500, minutes: 30 }],
      [TASK_TWIN_A, TASK_TWIN_B],
      NOW,
      { "row-start-only": new Set(["not-used"]) },
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-start-only"]).toMatchObject({ id: "twin-a" });
  });

  it("uses fallback ranking values when tasks have no due date or unknown priority", () => {
    const result = deriveAssignedGapTasks(
      [{ id: "row-no-times", type: "free", minutes: 30 }],
      [TASK_UNKNOWN_PRIORITY, TASK_KNOWN_LOW],
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-no-times"]).toMatchObject({ id: "unknown-priority" });
  });

  it("sorts queue correctly when the second task uses the unknown-priority fallback", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_B], [TASK_KNOWN_MEDIUM, TASK_UNKNOWN_SECOND], NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-b"]).toMatchObject({ id: "known-medium" });
  });

  it("handles undefined gap minutes by falling back to zero in ranking", () => {
    taskDurationMinsMock.mockImplementation((task) => task.estimated_blocks ?? 0);
    getTasksThatFitGapMock.mockImplementation((tasks) => ({ suggested: tasks[0] ?? null }));
    const zeroTask = { id: "zero-task", title: "Zero task", priority: "medium", estimated_blocks: 0, completed: false };
    const result = deriveAssignedGapTasks([{ id: "row-no-minutes", type: "free", startMins: 540 }], [zeroTask], NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-no-minutes"]).toMatchObject({ id: "zero-task" });
  });

  it("handles an explicit zero-minute gap using the zero fallback", () => {
    taskDurationMinsMock.mockImplementation((task) => task.estimated_blocks ?? 0);
    getTasksThatFitGapMock.mockImplementation((tasks) => ({ suggested: tasks[0] ?? null }));
    const taskA = { id: "zero-gap-task", title: "Zero gap task", priority: "medium", estimated_blocks: 0, completed: false };
    const taskB = { id: "zero-gap-task-b", title: "Zero gap task B", priority: "medium", estimated_blocks: 0, completed: false };
    const result = deriveAssignedGapTasks([{ id: "row-zero-gap", type: "free", minutes: 0 }], [taskA, taskB], NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(result.map["row-zero-gap"]).toMatchObject({ id: "zero-gap-task" });
  });

  it("sorts free rows using gapStartMins, then startMins, then zero fallback", () => {
    const tasks = [
      { id: "first", title: "First", priority: "medium", estimated_blocks: 1, completed: false },
      { id: "second", title: "Second", priority: "medium", estimated_blocks: 1, completed: false },
      { id: "third", title: "Third", priority: "medium", estimated_blocks: 1, completed: false },
    ];
    const rows = [
      { id: "row-default-zero", type: "free", minutes: 30 },
      { id: "row-start", type: "free", startMins: 120, minutes: 30 },
      { id: "row-gap", type: "free", gapStartMins: 60, minutes: 30 },
    ];
    const result = deriveAssignedGapTasks(rows, tasks, NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(Object.keys(result.map)).toEqual(["row-default-zero", "row-gap", "row-start"]);
  });

  it("handles row sorting when every timing fallback path is compared in reverse order", () => {
    const rows = [
      { id: "row-gap-late", type: "free", gapStartMins: 90, minutes: 30 },
      { id: "row-zero", type: "free", minutes: 30 },
      { id: "row-start-mid", type: "free", startMins: 45, minutes: 30 },
    ];
    const tasks = [
      { id: "a", title: "A", priority: "medium", estimated_blocks: 1, completed: false },
      { id: "b", title: "B", priority: "medium", estimated_blocks: 1, completed: false },
      { id: "c", title: "C", priority: "medium", estimated_blocks: 1, completed: false },
    ];
    const result = deriveAssignedGapTasks(rows, tasks, NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(Object.keys(result.map)).toEqual(["row-zero", "row-start-mid", "row-gap-late"]);
  });

  it("returns an empty assignment map when suggestable tasks are null", () => {
    const result = deriveAssignedGapTasks([FREE_ROW_A], null, NOW, {}, emptySlottedIds, emptySlottedTitles);
    expect(result).toEqual({ map: {}, nextMap: {} });
  });
});
