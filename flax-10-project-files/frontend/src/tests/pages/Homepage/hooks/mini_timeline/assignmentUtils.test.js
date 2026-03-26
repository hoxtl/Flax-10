import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deriveBestFreeRowId,
  deriveAssignedGapTasks,
  deriveGapDeadlineFallbacks,
} from "../../../../../pages/homepage/hooks/mini_timeline/assignmentUtils";

// Mock taskUtils so tests are isolated from focusPlanner internals

vi.mock("../../../../../pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: (task) => (task?.estimated_blocks ?? 1) * 25,
  getTasksThatFitGap: (tasks, gapMinutes) => {
    const fits = tasks.filter((t) => (t?.estimated_blocks ?? 1) * 25 <= gapMinutes);
    return { suggested: fits[0] ?? null };
  },
}));

// Fixtures

const NOW = new Date("2024-06-01T12:00:00Z");

const FREE_ROW_A = { id: "row-a", type: "free", minutes: 60, gapStartMins: 480 };
const FREE_ROW_B = { id: "row-b", type: "free", minutes: 30, gapStartMins: 600 };
const BUSY_ROW = { id: "row-busy", type: "busy", minutes: 60 };

const TASK_LOW = { id: "t1", title: "Low task", priority: "low", estimated_blocks: 2, completed: false };
const TASK_HIGH = { id: "t2", title: "High task", priority: "high", estimated_blocks: 1, completed: false };
const TASK_URGENT_OVERDUE = {
  id: "t3",
  title: "Urgent overdue",
  priority: "urgent",
  estimated_blocks: 2,
  completed: false,
  due_date: "2024-05-01T00:00:00Z", // overdue
};
const TASK_COMPLETED = { id: "t4", title: "Done task", priority: "low", estimated_blocks: 1, completed: true };

// deriveBestFreeRowId

describe("deriveBestFreeRowId", () => {
  it("returns null when rows is empty", () => {
    expect(deriveBestFreeRowId([], [], NOW)).toBeNull();
  });

  it("returns null when there are no free rows", () => {
    expect(deriveBestFreeRowId([BUSY_ROW], [TASK_LOW], NOW)).toBeNull();
  });

  it("returns null when suggestableTasks is empty", () => {
    // score for each free row uses getGapScore; with no tasks suggested the score is just row.minutes
    // Both rows should still be evaluated and the one with higher minutes wins
    const result = deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [], NOW);
    // row-a wins because it offers 60 minutes and row-b offers 30.
    expect(result).toBe("row-a");
  });

  it("returns the free row id with the best score (overdue + urgent boost)", () => {
    // TASK_URGENT_OVERDUE gets +240 (overdue) +140 (urgent) = +380 on top of row minutes
    // row-b only has 30 minutes, so t3 cannot fit there.
    // row-a fits t3, which gives it the highest score.
    // row-b keeps only its base row score.
    const result = deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [TASK_URGENT_OVERDUE], NOW);
    expect(result).toBe("row-a");
  });

  it("handles null suggestableTasks gracefully", () => {
    expect(() => deriveBestFreeRowId([FREE_ROW_A], null, NOW)).not.toThrow();
  });
});

// deriveAssignedGapTasks

describe("deriveAssignedGapTasks", () => {
  const emptySlottedIds = new Set();
  const emptySlottedTitles = new Set();
  const emptySkipped = {};

  it("returns empty map and nextMap when rows is empty", () => {
    const result = deriveAssignedGapTasks([], [TASK_LOW], NOW, emptySkipped, emptySlottedIds, emptySlottedTitles);
    expect(result.map).toEqual({});
    expect(result.nextMap).toEqual({});
  });

  it("returns empty map when suggestableTasks is empty", () => {
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A, FREE_ROW_B],
      [],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map).toEqual({});
  });

  it("skips completed tasks", () => {
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [TASK_COMPLETED],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("assigns a task to a free row when it fits", () => {
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [TASK_LOW],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-a"]).toBeDefined();
    expect(result.map["row-a"].id).toBe("t1");
  });

  it("does not assign the same task to two rows", () => {
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A, FREE_ROW_B],
      [TASK_HIGH], // only one task
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    const assignedIds = Object.values(result.map).filter(Boolean).map((t) => t.id);
    expect(new Set(assignedIds).size).toBe(assignedIds.length); // all unique
  });

  it("skips tasks in the skipped set for that row", () => {
    const skipped = { "row-a": new Set(["t1"]) };
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [TASK_LOW],
      NOW,
      skipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("skips tasks already in slottedTaskIds", () => {
    const slottedIds = new Set(["t1"]);
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [TASK_LOW],
      NOW,
      emptySkipped,
      slottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("skips tasks whose title is in slottedTitles", () => {
    const slottedTitles = new Set(["Low task"]);
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [TASK_LOW],
      NOW,
      emptySkipped,
      emptySlottedIds,
      slottedTitles,
    );
    expect(result.map["row-a"]).toBeUndefined();
  });

  it("ignores non-free rows", () => {
    const result = deriveAssignedGapTasks(
      [BUSY_ROW, FREE_ROW_A],
      [TASK_LOW],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    expect(result.map["row-busy"]).toBeUndefined();
  });

  it("produces nextMap pointing each row to the next row's assignment", () => {
    // Two free rows; row-a gets TASK_HIGH (highest priority), row-b gets TASK_LOW
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A, FREE_ROW_B],
      [TASK_HIGH, TASK_LOW],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );
    // nextMap for row-a should equal map[row-b]
    expect(result.nextMap["row-a"]).toEqual(result.map["row-b"] || null);
  });
});

// deriveGapDeadlineFallbacks

describe("deriveGapDeadlineFallbacks", () => {
  const SUGGESTION_A = { assessment_title: "Essay 1" };
  const SUGGESTION_B = { assessment_title: "Lab Report" };

  it("returns empty map when rows is empty", () => {
    const result = deriveGapDeadlineFallbacks([], { map: {} }, [SUGGESTION_A], new Set());
    expect(result).toEqual({});
  });

  it("returns empty map when deadlineSuggestions is empty", () => {
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A],
      { map: {} },
      [],
      new Set(),
    );
    expect(result).toEqual({});
  });

  it("skips rows that already have an assigned gap task", () => {
    const assignedGapTasks = { map: { "row-a": TASK_LOW } };
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A],
      assignedGapTasks,
      [SUGGESTION_A],
      new Set(),
    );
    expect(result["row-a"]).toBeUndefined();
  });

  it("assigns a suggestion to a free row that has no assigned task", () => {
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A],
      { map: {} },
      [SUGGESTION_A],
      new Set(),
    );
    expect(result["row-a"]).toEqual(SUGGESTION_A);
  });

  it("distributes multiple suggestions across multiple unassigned rows in order", () => {
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A, FREE_ROW_B],
      { map: {} },
      [SUGGESTION_A, SUGGESTION_B],
      new Set(),
    );
    expect(result["row-a"]).toEqual(SUGGESTION_A);
    expect(result["row-b"]).toEqual(SUGGESTION_B);
  });

  it("filters out suggestions whose title is already slotted (Revision: prefix)", () => {
    const slottedTitles = new Set(["Revision: Essay 1"]);
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A],
      { map: {} },
      [SUGGESTION_A],
      slottedTitles,
    );
    // Essay 1 already has a matching revision title in slottedTitles.
    expect(result["row-a"]).toBeUndefined();
  });

  it("falls back to item.title when assessment_title is absent", () => {
    const suggestion = { title: "Mock Exam" };
    const slottedTitles = new Set(["Revision: Mock Exam"]);
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A],
      { map: {} },
      [suggestion],
      slottedTitles,
    );
    expect(result["row-a"]).toBeUndefined();
  });

  it("ignores non-free rows even if suggestions are available", () => {
    const result = deriveGapDeadlineFallbacks(
      [BUSY_ROW, FREE_ROW_A],
      { map: {} },
      [SUGGESTION_A],
      new Set(),
    );
    expect(result["row-busy"]).toBeUndefined();
    expect(result["row-a"]).toEqual(SUGGESTION_A);
  });
});
