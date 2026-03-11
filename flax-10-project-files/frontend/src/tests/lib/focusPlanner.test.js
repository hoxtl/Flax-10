import { describe, expect, it } from "vitest";
import {
  PRIORITY_ORDER,
  getTaskDurationMinutes,
  splitEstimatedBlocks,
  compareTaskPriority,
  compareTaskDue,
  compareTaskEstimatedTime,
  compareTaskUrgency,
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

  it("sorts by priority, then due date", () => {
    const high = { priority: "high", due_date: "2026-03-15T10:00:00Z" };
    const urgent = { priority: "urgent", due_date: "2026-03-16T10:00:00Z" };
    expect(compareTaskPriority(urgent, high)).toBeLessThan(0);
  });

  it("sorts due dates with missing due dates last", () => {
    const due = { due_date: "2026-03-15T10:00:00Z" };
    const none = {};
    expect(compareTaskDue(due, none)).toBeLessThan(0);
    expect(compareTaskDue(none, due)).toBeGreaterThan(0);
  });

  it("sorts by estimated time, then priority", () => {
    const short = { estimated_blocks: 1, priority: "low" };
    const long = { estimated_blocks: 3, priority: "urgent" };
    expect(compareTaskEstimatedTime(short, long)).toBeLessThan(0);
  });

  it("prioritizes tasks inside the next 48 hours", () => {
    const now = new Date("2026-03-11T10:00:00Z");
    const soon = { id: 1, due_date: "2026-03-12T09:00:00Z", priority: "low" };
    const later = { id: 2, due_date: "2026-03-18T09:00:00Z", priority: "urgent" };
    expect(compareTaskUrgency(soon, later, now)).toBeLessThan(0);
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
});
