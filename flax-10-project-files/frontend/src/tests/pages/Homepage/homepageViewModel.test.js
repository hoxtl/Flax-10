import { describe, expect, it } from "vitest";

import { getTaskWidgetDisplayList } from "../../../pages/Homepage/utils/homepageViewModel";

function buildTask(id, title, dueDate, priority = "medium") {
  return {
    id,
    title,
    completed: false,
    due_date: dueDate,
    priority,
  };
}

describe("homepageViewModel task widget ordering", () => {
  it("sorts upcoming widget fillers by nearest due date before priority", () => {
    const now = new Date("2026-03-24T09:00:00Z");
    const tasks = [
      buildTask(1, "Due in 2 days and urgent", "2026-03-26T09:00:00Z", "urgent"),
      buildTask(2, "Due tomorrow and medium", "2026-03-25T09:00:00Z", "medium"),
      buildTask(3, "Due in 3 days and high", "2026-03-27T09:00:00Z", "high"),
    ];

    const displayList = getTaskWidgetDisplayList(tasks, now, []);

    expect(displayList.map((task) => task.title)).toEqual([
      "Due tomorrow and medium",
      "Due in 2 days and urgent",
      "Due in 3 days and high",
    ]);
  });

  it("uses priority only as a tie-breaker when due dates match", () => {
    const now = new Date("2026-03-24T09:00:00Z");
    const tasks = [
      buildTask(1, "Tomorrow medium", "2026-03-25T09:00:00Z", "medium"),
      buildTask(2, "Tomorrow urgent", "2026-03-25T09:00:00Z", "urgent"),
      buildTask(3, "Tomorrow high", "2026-03-25T09:00:00Z", "high"),
    ];

    const displayList = getTaskWidgetDisplayList(tasks, now, []);

    expect(displayList.map((task) => task.title)).toEqual([
      "Tomorrow urgent",
      "Tomorrow medium",
      "Tomorrow high",
    ]);
  });
});
