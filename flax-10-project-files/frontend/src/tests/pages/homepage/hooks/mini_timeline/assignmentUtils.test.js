import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deriveBestFreeRowId,
  deriveAssignedGapTasks,
  deriveGapDeadlineFallbacks,
} from "../../../../../pages/homepage/hooks/mini_timeline/assignmentUtils";

// Mock taskUtils so tests are isolated from focusPlanner internals

const { getTasksThatFitGapMock, taskDurationMinsMock } = vi.hoisted(() => ({
  getTasksThatFitGapMock: vi.fn(),
  taskDurationMinsMock: vi.fn(),
}));

vi.mock("../../../../../pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: (...args) => taskDurationMinsMock(...args),
  getTasksThatFitGap: (...args) => getTasksThatFitGapMock(...args),
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

  it("returns null when suggestableTasks is empty", () => {
    // score for each free row uses getGapScore; with no tasks suggested the score is just row.minutes
    // Both rows should still be evaluated and the one with higher minutes wins
    const result = deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [], NOW);
    // row-a has 60 minutes, row-b has 30  -  row-a wins
    expect(result).toBe("row-a");
  });

  it("returns the free row id with the best score (overdue + urgent boost)", () => {
    // TASK_URGENT_OVERDUE gets +240 (overdue) +140 (urgent) = +380 on top of row minutes
    // row-b has only 30 mins but fits t3 (estimated_blocks:2  -  50 mins <= 60 for row-a but > 30 for row-b)
    // row-a (60 mins) fits t3  -  score = 60 + 240 + 140 = 440
    // row-b (30 mins) doesn't fit t3  -  score = 30
    const result = deriveBestFreeRowId([FREE_ROW_A, FREE_ROW_B], [TASK_URGENT_OVERDUE], NOW);
    expect(result).toBe("row-a");
  });

  it("handles null suggestableTasks gracefully", () => {
    expect(() => deriveBestFreeRowId([FREE_ROW_A], null, NOW)).not.toThrow();
  });

  it("prefers a high-priority task when due dates match across rows", () => {
    const sameDue = "2024-06-02T10:00:00Z";
    const mediumTask = {
      id: "medium-1",
      title: "Medium task",
      priority: "medium",
      estimated_blocks: 1,
      completed: false,
      due_date: sameDue,
    };
    const urgentTask = {
      id: "urgent-1",
      title: "Urgent task",
      priority: "urgent",
      estimated_blocks: 1,
      completed: false,
      due_date: sameDue,
    };

    const result = deriveBestFreeRowId([FREE_ROW_B, FREE_ROW_A], [mediumTask, urgentTask], NOW);
    expect(result).toBe("row-a");
  });

  it("applies the high-priority gap boost when the best suggestion is high but not urgent", () => {
    const highTask = {
      id: "high-boost",
      title: "High boost task",
      priority: "high",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-05-20T00:00:00Z",
    };

    const result = deriveBestFreeRowId([{ id: "row-high", type: "free", minutes: 40 }], [highTask], NOW);
    expect(result).toBe("row-high");
  });

  it("keeps the first free row when scores tie and handles rows without minutes", () => {
    const rowWithoutMinutes = { id: "row-zero", type: "free" };
    const result = deriveBestFreeRowId([rowWithoutMinutes, FREE_ROW_B], null, NOW);
    expect(result).toBe("row-b");
  });
});

// deriveAssignedGapTasks

describe("deriveAssignedGapTasks", () => {
  const emptySlottedIds = new Set();
  const emptySlottedTitles = new Set();
  const emptySkipped = {};

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

  it("prefers overdue tasks over non-overdue tasks when both fit", () => {
    const overdue = {
      id: "overdue-1",
      title: "Overdue task",
      priority: "low",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-05-01T00:00:00Z",
    };
    const future = {
      id: "future-1",
      title: "Future task",
      priority: "urgent",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-06-20T00:00:00Z",
    };

    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [future, overdue],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-a"]).toMatchObject({ id: "overdue-1" });
  });

  it("prefers the longer fitting task when rank ties exactly", () => {
    const shorter = {
      id: "short-1",
      title: "Short task",
      priority: "medium",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-06-20T00:00:00Z",
    };
    const longer = {
      id: "long-1",
      title: "Long task",
      priority: "medium",
      estimated_blocks: 2,
      completed: false,
      due_date: "2024-06-20T00:00:00Z",
    };

    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      [shorter, longer],
      NOW,
      emptySkipped,
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-a"]).toMatchObject({ id: "long-1" });
  });

  it("keeps a stable choice when candidate ranks are identical", () => {
    const twinA = {
      id: "twin-a",
      title: "Twin A",
      priority: "medium",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-06-20T00:00:00Z",
    };
    const twinB = {
      id: "twin-b",
      title: "Twin B",
      priority: "medium",
      estimated_blocks: 1,
      completed: false,
      due_date: "2024-06-20T00:00:00Z",
    };

    const result = deriveAssignedGapTasks(
      [{ id: "row-start-only", type: "free", startMins: 500, minutes: 30 }],
      [twinA, twinB],
      NOW,
      { "row-start-only": new Set(["not-used"]) },
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-start-only"]).toMatchObject({ id: "twin-a" });
  });

  it("uses fallback ranking values when tasks have no due date or unknown priority", () => {
    const unknownPriority = {
      id: "unknown-priority",
      title: "Unknown priority",
      priority: "someday",
      estimated_blocks: 1,
      completed: false,
    };
    const lowPriority = {
      id: "known-low",
      title: "Known low",
      priority: "low",
      estimated_blocks: 1,
      completed: false,
    };

    const result = deriveAssignedGapTasks(
      [{ id: "row-no-times", type: "free", minutes: 30 }],
      [unknownPriority, lowPriority],
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-no-times"]).toMatchObject({ id: "unknown-priority" });
  });

  it("sorts queue correctly when the second task uses the unknown-priority fallback", () => {
    const knownMedium = {
      id: "known-medium",
      title: "Known medium",
      priority: "medium",
      estimated_blocks: 1,
      completed: false,
    };
    const unknownPriority = {
      id: "unknown-second",
      title: "Unknown second",
      priority: "mystery",
      estimated_blocks: 1,
      completed: false,
    };

    const result = deriveAssignedGapTasks(
      [FREE_ROW_B],
      [knownMedium, unknownPriority],
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-b"]).toMatchObject({ id: "known-medium" });
  });

  it("handles undefined gap minutes by falling back to zero in ranking math", () => {
    taskDurationMinsMock.mockImplementation((task) => task.estimated_blocks ?? 0);
    getTasksThatFitGapMock.mockImplementation((tasks) => ({ suggested: tasks[0] ?? null }));

    const zeroDurationTask = {
      id: "zero-task",
      title: "Zero task",
      priority: "medium",
      estimated_blocks: 0,
      completed: false,
    };

    const result = deriveAssignedGapTasks(
      [{ id: "row-no-minutes", type: "free", startMins: 540 }],
      [zeroDurationTask],
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result.map["row-no-minutes"]).toMatchObject({ id: "zero-task" });
  });

  it("handles an explicit zero-minute gap by using the same zero fallback", () => {
    taskDurationMinsMock.mockImplementation((task) => task.estimated_blocks ?? 0);
    getTasksThatFitGapMock.mockImplementation((tasks) => ({ suggested: tasks[0] ?? null }));

    const zeroDurationTask = {
      id: "zero-gap-task",
      title: "Zero gap task",
      priority: "medium",
      estimated_blocks: 0,
      completed: false,
    };
    const zeroDurationTaskB = {
      id: "zero-gap-task-b",
      title: "Zero gap task B",
      priority: "medium",
      estimated_blocks: 0,
      completed: false,
    };

    const result = deriveAssignedGapTasks(
      [{ id: "row-zero-gap", type: "free", minutes: 0 }],
      [zeroDurationTask, zeroDurationTaskB],
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );

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
    const result = deriveAssignedGapTasks(
      [FREE_ROW_A],
      null,
      NOW,
      {},
      emptySlottedIds,
      emptySlottedTitles,
    );

    expect(result).toEqual({ map: {}, nextMap: {} });
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
    // SUGGESTION_A.assessment_title is "Essay 1"  -  "Revision: Essay 1" is slotted  -  filtered out
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

  it("stops assigning once suggestions run out", () => {
    const result = deriveGapDeadlineFallbacks(
      [FREE_ROW_A, FREE_ROW_B],
      { map: {} },
      [SUGGESTION_A],
      new Set(),
    );

    expect(result["row-a"]).toEqual(SUGGESTION_A);
    expect(result["row-b"]).toBeUndefined();
  });

  it("returns an empty map when deadline suggestions are null", () => {
    const result = deriveGapDeadlineFallbacks(
      [{ id: "row-start-only", type: "free", startMins: 510 }],
      { map: {} },
      null,
      new Set(),
    );

    expect(result).toEqual({});
  });

  it("skips suggestions whose revision title is missing entirely", () => {
    const result = deriveGapDeadlineFallbacks(
      [{ id: "row-no-times", type: "free" }],
      { map: {} },
      [{}],
      new Set(["Revision: undefined"]),
    );

    expect(result["row-no-times"]).toBeUndefined();
  });
});
