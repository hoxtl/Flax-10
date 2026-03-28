/*
 * Tests for deriveBestFreeRowId – selecting the best free gap row.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { deriveBestFreeRowId } from "../../../../../pages/homepage/hooks/mini_timeline/assignmentUtils";

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
const TASK_URGENT_OVERDUE = { id: "t3", title: "Urgent overdue", priority: "urgent", estimated_blocks: 2, completed: false, due_date: "2024-05-01T00:00:00Z" };

describe("deriveBestFreeRowId", () => {
  beforeEach(() => {
    taskDurationMinsMock.mockImplementation((task) => (task?.estimated_blocks ?? 1) * 25);
    getTasksThatFitGapMock.mockImplementation((tasks, gapMinutes) => {
      const fits = tasks.filter((task) => (task?.estimated_blocks ?? 1) * 25 <= gapMinutes);
      return { suggested: fits[0] ?? null };
    });
  });

  it("returns null when rows is empty", () => {
    expect(deriveBestFreeRowId([], [], NOW)).toBeNull();
  });

  it("returns null when there are no free rows", () => {
    expect(deriveBestFreeRowId([BUSY_ROW], [TASK_LOW], NOW)).toBeNull();
  });

  it("returns the free row with higher minutes when no tasks are suggested", () => {
    expect(deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [], NOW)).toBe("row-a");
  });

  it("returns the free row id with the best score for overdue urgent tasks", () => {
    const result = deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [TASK_URGENT_OVERDUE], NOW);
    expect(result).toBe("row-a");
  });

  it("handles null suggestableTasks gracefully", () => {
    expect(() => deriveBestFreeRowId([FREE_ROW_A], null, NOW)).not.toThrow();
  });

  it("prefers a high-priority task when due dates match across rows", () => {
    const sameDue = "2024-06-02T10:00:00Z";
    const mediumTask = { id: "medium-1", title: "Medium task", priority: "medium", estimated_blocks: 1, completed: false, due_date: sameDue };
    const urgentTask = { id: "urgent-1", title: "Urgent task", priority: "urgent", estimated_blocks: 1, completed: false, due_date: sameDue };
    expect(deriveBestFreeRowId([FREE_ROW_B, FREE_ROW_A], [mediumTask, urgentTask], NOW)).toBe("row-a");
  });

  it("applies the high-priority gap boost when the best suggestion is high", () => {
    const highTask = { id: "high-boost", title: "High boost task", priority: "high", estimated_blocks: 1, completed: false, due_date: "2024-05-20T00:00:00Z" };
    expect(deriveBestFreeRowId([{ id: "row-high", type: "free", minutes: 40 }], [highTask], NOW)).toBe("row-high");
  });

  it("keeps the first free row when scores tie and handles rows without minutes", () => {
    const rowWithoutMinutes = { id: "row-zero", type: "free" };
    expect(deriveBestFreeRowId([rowWithoutMinutes, FREE_ROW_B], null, NOW)).toBe("row-b");
  });
});
