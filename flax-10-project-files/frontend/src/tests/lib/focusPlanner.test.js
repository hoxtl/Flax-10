import { describe, expect, it, vi } from "vitest";
import {
  PRIORITY_ORDER,
  getTaskDurationMinutes,
  splitEstimatedBlocks,
  compareTaskPriority,
  compareTaskDue,
  compareTaskEstimatedTime,
  compareTaskUrgency,
  rankTasksForFocus,
  getTasksThatFitWindow,
} from "../../lib/focusPlanner";

describe("focusPlanner", () => {
  it("exposes a shared priority order", () => {
    expect(PRIORITY_ORDER).toEqual({ urgent: 0, high: 1, medium: 2, low: 3 });
  });

  it("calculates task duration from estimated blocks", () => {
    expect(getTaskDurationMinutes({ estimated_blocks: 3 })).toBe(75);
    expect(getTaskDurationMinutes({})).toBe(25);
  });

  it("splits estimated blocks into sensible session groups", () => {
    expect(splitEstimatedBlocks(1)).toEqual({ sessionCount: 1, workMinutes: 25 });
    expect(splitEstimatedBlocks(4)).toEqual({ sessionCount: 4, workMinutes: 25 });
    expect(splitEstimatedBlocks(6)).toEqual({ sessionCount: 6, workMinutes: 25 });
  });

  it("falls back when blocks are invalid or cannot be split evenly", () => {
    expect(splitEstimatedBlocks(0)).toEqual({ sessionCount: 1, workMinutes: 25 });
    expect(splitEstimatedBlocks("5")).toEqual({ sessionCount: 5, workMinutes: 25 });
    expect(splitEstimatedBlocks(13)).toEqual({ sessionCount: 1, workMinutes: 325 });
  });

  it("sorts by priority, then due date", () => {
    const high = { priority: "high", due_date: "2026-03-15T10:00:00Z" };
    const urgent = { priority: "urgent", due_date: "2026-03-16T10:00:00Z" };
    expect(compareTaskPriority(urgent, high)).toBeLessThan(0);
  });

  it("uses due date as the priority tie-breaker and handles unknown priorities", () => {
    const earlier = { priority: "mystery", due_date: "2026-03-15T10:00:00Z" };
    const later = { priority: "mystery", due_date: "2026-03-16T10:00:00Z" };
    expect(compareTaskPriority(earlier, later)).toBeLessThan(0);
  });

  it("treats missing estimated blocks as one block when comparing durations", () => {
    expect(compareTaskEstimatedTime({}, {})).toBe(0);
  });

  it("sorts due dates with missing due dates last", () => {
    const due = { due_date: "2026-03-15T10:00:00Z" };
    const none = {};
    expect(compareTaskDue(due, none)).toBeLessThan(0);
    expect(compareTaskDue(none, due)).toBeGreaterThan(0);
  });

  it("returns zero when neither task has a due date and sorts dated tasks directly", () => {
    expect(compareTaskDue({}, {})).toBe(0);
    expect(
      compareTaskDue(
        { due_date: "2026-03-15T10:00:00Z" },
        { due_date: "2026-03-16T10:00:00Z" },
      ),
    ).toBeLessThan(0);
  });

  it("sorts by estimated time, then priority", () => {
    const short = { estimated_blocks: 1, priority: "low" };
    const long = { estimated_blocks: 3, priority: "urgent" };
    expect(compareTaskEstimatedTime(short, long)).toBeLessThan(0);
  });

  it("uses priority as the estimated-time tie-breaker", () => {
    const urgent = { estimated_blocks: 2, priority: "urgent", due_date: "2026-03-16T10:00:00Z" };
    const low = { estimated_blocks: 2, priority: "low", due_date: "2026-03-15T10:00:00Z" };
    expect(compareTaskEstimatedTime(urgent, low)).toBeLessThan(0);
  });

  it("prioritizes tasks inside the next 48 hours", () => {
    const now = new Date("2026-03-11T10:00:00Z");
    const soon = { id: 1, due_date: "2026-03-12T09:00:00Z", priority: "low" };
    const later = { id: 2, due_date: "2026-03-18T09:00:00Z", priority: "urgent" };
    expect(compareTaskUrgency(soon, later, now)).toBeLessThan(0);
  });

  it("covers overdue and no-due urgency branches and ranks tasks for focus", () => {
    const now = new Date("2026-03-11T10:00:00Z");
    const overdue = { id: 1, due_date: "2026-03-10T09:00:00Z", priority: "low" };
    const soonFuture = { id: 5, due_date: "2026-03-11T18:00:00Z", priority: "medium" };
    const future = { id: 2, due_date: "2026-03-15T09:00:00Z", priority: "urgent" };
    const noDueUrgent = { id: 3, priority: "urgent" };
    const noDueLow = { id: 4, priority: "low" };

    expect(compareTaskUrgency(overdue, future, now)).toBeLessThan(0);
    expect(compareTaskUrgency(overdue, soonFuture, now)).toBeLessThan(0);
    expect(compareTaskUrgency(soonFuture, overdue, now)).toBeGreaterThan(0);
    expect(compareTaskUrgency(noDueUrgent, noDueLow, now)).toBeLessThan(0);

    expect(rankTasksForFocus([future, noDueLow, overdue, noDueUrgent], now).map((task) => task.id)).toEqual([
      1,
      3,
      2,
      4,
    ]);
    expect(rankTasksForFocus(null, now)).toEqual([]);
  });

  it("covers the default now parameter and the direct due-date urgency ordering", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-11T10:00:00Z"));

    expect(
      compareTaskUrgency(
        { due_date: "2026-03-15T09:00:00Z", priority: "high" },
        { due_date: "2026-03-16T09:00:00Z", priority: "high" },
      ),
    ).toBeLessThan(0);

    expect(rankTasksForFocus()).toEqual([]);

    vi.useRealTimers();
  });

  it("returns the best fitting tasks for a focus window", () => {
    const now = new Date("2026-03-11T10:00:00Z");
    const result = getTasksThatFitWindow(
      [
        { id: 1, estimated_blocks: 4, due_date: "2026-03-12T09:00:00Z", priority: "urgent" },
        { id: 2, estimated_blocks: 1, due_date: "2026-03-12T11:00:00Z", priority: "high" },
        { id: 3, estimated_blocks: 1, due_date: "2026-03-20T11:00:00Z", priority: "urgent" },
      ],
      30,
      now,
    );
    expect(result.suggested?.id).toBe(2);
    expect(result.top3.map((task) => task.id)).toEqual([2, 3]);
  });

  it("returns empty fit results for small windows, empty lists, and no matching tasks", () => {
    expect(getTasksThatFitWindow([], 60)).toEqual({ suggested: null, top3: [] });
    expect(getTasksThatFitWindow([{ estimated_blocks: 1 }], 20)).toEqual({ suggested: null, top3: [] });
    expect(
      getTasksThatFitWindow([{ id: 1, estimated_blocks: 4, priority: "high" }], 25),
    ).toEqual({ suggested: null, top3: [] });
  });
});
