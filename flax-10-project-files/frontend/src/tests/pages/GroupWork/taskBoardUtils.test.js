import { describe, expect, it } from "vitest";

import { buildBoardColumns } from "../../../pages/GroupWork/utils/taskBoardUtils";

describe("taskBoardUtils", () => {
  it("builds board columns from explicit and derived task statuses", () => {
    const columns = buildBoardColumns([
      { id: 1, title: "Read brief", status: "todo" },
      { id: 2, title: "Draft slides", status: "in_progress" },
      { id: 3, title: "Submit notes", status: "done" },
      { id: 4, title: "Review deck", completed: true },
      { id: 5, title: "Unknown state", status: "blocked" },
      { id: 6, title: "No status provided" },
    ]);

    expect(columns.map((column) => column.id)).toEqual(["todo", "in_progress", "done"]);
    expect(columns.map((column) => column.title)).toEqual(["To Do", "In Progress", "Done"]);

    expect(columns[0].tasks.map((task) => task.id)).toEqual([1, 5, 6]);
    expect(columns[1].tasks.map((task) => task.id)).toEqual([2]);
    expect(columns[2].tasks.map((task) => task.id)).toEqual([3, 4]);

    columns.forEach((column) => {
      expect(column.className).toBeTruthy();
      expect(column.dotClass).toBeTruthy();
      expect(column.textClass).toBeTruthy();
    });
  });
});
