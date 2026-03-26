/*
 * Tests for Tasks taskSortUtils: sortTasks by priority, due, alpha, list, date_added, est_time.
 */

import { describe, it, expect } from "vitest";
import { sortTasks } from "../../../pages/tasks/utils/taskSortUtils";

describe("taskSortUtils", () => {
  const listMap = { "1": { name: "List A" }, "2": { name: "List B" } };

  it("sorts by priority (urgent first)", () => {
    const tasks = [
      { id: 1, title: "M", priority: "medium", due_date: null },
      { id: 2, title: "U", priority: "urgent", due_date: null },
      { id: 3, title: "H", priority: "high", due_date: null },
    ];
    const out = sortTasks(tasks, "priority", listMap);
    expect(out[0].priority).toBe("urgent");
    expect(out[1].priority).toBe("high");
    expect(out[2].priority).toBe("medium");
  });

  it("sorts by due date when filter is due", () => {
    const tasks = [
      { id: 1, title: "L", due_date: "2026-03-15T12:00:00" },
      { id: 2, title: "E", due_date: "2026-03-10T12:00:00" },
    ];
    const out = sortTasks(tasks, "due", listMap);
    expect(out[0].title).toBe("E");
    expect(out[1].title).toBe("L");
  });

  it("puts tasks without due last when sorting by due", () => {
    const tasks = [
      { id: 1, title: "No due", due_date: null },
      { id: 2, title: "Has due", due_date: "2026-03-10T12:00:00" },
    ];
    const out = sortTasks(tasks, "due", listMap);
    expect(out[0].title).toBe("Has due");
    expect(out[1].title).toBe("No due");
  });

  it("sorts alphabetically by title when filter is alpha", () => {
    const tasks = [
      { id: 1, title: "Zebra", priority: "medium" },
      { id: 2, title: "Alpha", priority: "urgent" },
    ];
    const out = sortTasks(tasks, "alpha", listMap);
    expect(out[0].title).toBe("Alpha");
    expect(out[1].title).toBe("Zebra");
  });

  it("sorts alphabetically descending when filter is alpha-desc", () => {
    const tasks = [
      { id: 1, title: "Alpha", priority: "medium" },
      { id: 2, title: "Zebra", priority: "urgent" },
    ];
    const out = sortTasks(tasks, "alpha-desc", listMap);
    expect(out[0].title).toBe("Zebra");
    expect(out[1].title).toBe("Alpha");
  });

  it("sorts by list name when filter is list", () => {
    const tasks = [
      { id: 1, title: "T1", task_list: "2" },
      { id: 2, title: "T2", task_list: "1" },
    ];
    const out = sortTasks(tasks, "list", listMap);
    expect(out[0].task_list).toBe("1");
    expect(out[1].task_list).toBe("2");
  });

  it("sorts by date_added (newer first) when filter is date_added", () => {
    const tasks = [
      { id: 10, title: "Old" },
      { id: 20, title: "New" },
    ];
    const out = sortTasks(tasks, "date_added", listMap);
    expect(out[0].id).toBe(20);
    expect(out[1].id).toBe(10);
  });

  it("sorts by date_added ascending when filter is date_added_asc", () => {
    const tasks = [
      { id: 10, title: "Old" },
      { id: 20, title: "New" },
    ];
    const out = sortTasks(tasks, "date_added_asc", listMap);
    expect(out[0].id).toBe(10);
    expect(out[1].id).toBe(20);
  });

  it("sorts by estimated blocks when filter is est_time", () => {
    const tasks = [
      { id: 1, title: "Long", estimated_blocks: 4, priority: "medium" },
      { id: 2, title: "Short", estimated_blocks: 1, priority: "medium" },
    ];
    const out = sortTasks(tasks, "est_time", listMap);
    expect(out[0].title).toBe("Short");
    expect(out[1].title).toBe("Long");
  });

  it("does not mutate original array", () => {
    const tasks = [{ id: 2 }, { id: 1 }];
    const copy = [...tasks];
    sortTasks(tasks, "date_added", listMap);
    expect(tasks).toEqual(copy);
  });

  it("defaults to priority sort for unknown sortBy", () => {
    const tasks = [
      { id: 1, title: "M", priority: "medium" },
      { id: 2, title: "U", priority: "urgent" },
    ];
    const out = sortTasks(tasks, "unknown", listMap);
    expect(out[0].priority).toBe("urgent");
  });

  it("compareDue returns 0 when both have no due", () => {
    const tasks = [{ id: 1, title: "A", due_date: null }, { id: 2, title: "B", due_date: null }];
    const out = sortTasks(tasks, "due", listMap);
    expect(out).toHaveLength(2);
  });

  it("compareList uses priority when same list", () => {
    const tasks = [
      { id: 1, title: "A", task_list: "1", priority: "low" },
      { id: 2, title: "B", task_list: "1", priority: "urgent" },
    ];
    const out = sortTasks(tasks, "list", listMap);
    expect(out[0].priority).toBe("urgent");
  });

  it("compareList falls back cleanly when list metadata is missing", () => {
    const tasks = [
      { id: 1, title: "A", task_list: "9", priority: "low" },
      { id: 2, title: "B", task_list: "9", priority: "urgent" },
    ];
    const out = sortTasks(tasks, "list");
    expect(out[0].priority).toBe("urgent");
  });

  it("compareEstTime uses priority when same blocks", () => {
    const tasks = [
      { id: 1, title: "A", estimated_blocks: 2, priority: "low" },
      { id: 2, title: "B", estimated_blocks: 2, priority: "urgent" },
    ];
    const out = sortTasks(tasks, "est_time", listMap);
    expect(out[0].priority).toBe("urgent");
  });

  it("comparePriority uses due_date when same priority", () => {
    const tasks = [
      { id: 1, title: "L", priority: "medium", due_date: "2026-03-15T12:00:00" },
      { id: 2, title: "E", priority: "medium", due_date: "2026-03-10T12:00:00" },
    ];
    const out = sortTasks(tasks, "priority", listMap);
    expect(out[0].title).toBe("E");
  });

  it("compareList falls back to the default priority rank when priorities are missing", () => {
    const tasks = [
      { id: 1, title: "A", task_list: "1" },
      { id: 2, title: "B", task_list: "1", priority: "urgent" },
      { id: 3, title: "C", task_list: "1" },
    ];
    const out = sortTasks(tasks, "list", listMap);
    expect(out[0].priority).toBe("urgent");
    expect(out.at(-1).priority).toBeUndefined();
  });
});
