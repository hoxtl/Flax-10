/*
 * Tests for Tasks listSidebarUtils: computeListSidebarCounts (listCounts and smartFilters).
 */

import { describe, it, expect, vi } from "vitest";
import { computeListSidebarCounts } from "../../../pages/Tasks/utils/listSidebarUtils";

describe("listSidebarUtils", () => {
  const lists = [{ id: "1", name: "L1" }, { id: "2", name: "L2" }];

  it("returns listCounts and smartFilters", () => {
    const tasks = [];
    const out = computeListSidebarCounts(tasks, lists);
    expect(out).toHaveProperty("listCounts");
    expect(out).toHaveProperty("smartFilters");
    expect(out.listCounts["1"]).toBe(0);
    expect(out.listCounts["2"]).toBe(0);
    expect(out.smartFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "all", label: "All tasks" }),
        expect.objectContaining({ id: "today", label: "Today" }),
        expect.objectContaining({ id: "this_week", label: "This Week" }),
        expect.objectContaining({ id: "later", label: "Later" }),
      ])
    );
  });

  it("counts incomplete tasks per list", () => {
    const tasks = [
      { id: 1, task_list: "1", completed: false },
      { id: 2, task_list: "1", completed: true },
      { id: 3, task_list: "2", completed: false },
    ];
    const out = computeListSidebarCounts(tasks, lists);
    expect(out.listCounts["1"]).toBe(1);
    expect(out.listCounts["2"]).toBe(1);
  });

  it("includes overdue filter when overdue count > 0", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    const tasks = [
      { id: 1, task_list: "1", completed: false, due_date: "2026-03-10T12:00:00", title: "Task" },
    ];
    const out = computeListSidebarCounts(tasks, lists);
    const overdue = out.smartFilters.find((f) => f.id === "overdue");
    expect(overdue).toBeDefined();
    expect(overdue.danger).toBe(true);
    vi.useRealTimers();
  });

  it("excludes routine/event tasks from overdue count", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    const tasks = [
      { id: 1, task_list: "1", completed: false, due_date: "2026-03-10T12:00:00", title: "Breakfast" },
    ];
    const out = computeListSidebarCounts(tasks, lists);
    const overdue = out.smartFilters.find((f) => f.id === "overdue");
    expect(overdue).toBeUndefined();
    vi.useRealTimers();
  });
});
