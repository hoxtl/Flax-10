import { describe, expect, it } from "vitest";

import {
  getAvgMinPerPage,
  recalculatePendingBlocks,
} from "../../../../pages/tasks/utils/readingSpeedUtils";

describe("readingSpeedUtils", () => {
  it("calculates average minutes per page from completed reading tasks", () => {
    expect(
      getAvgMinPerPage([
        { completed: true, reading_id: 2, reading_page_count: 20, time_spent_minutes: 40 },
        { completed: true, page_count: 30, time_spent_minutes: 60 },
        { completed: false, page_count: 100, time_spent_minutes: 1000 },
      ]),
    ).toBe(2);
  });

  it("falls back to the default page time when no completed reading pages are available", () => {
    expect(
      getAvgMinPerPage([
        { completed: true, page_count: 0, time_spent_minutes: 10 },
        { completed: true, time_spent_minutes: 0, reading_id: 1, reading_page_count: 20 },
        { completed: false, page_count: 20, time_spent_minutes: 30 },
      ]),
    ).toBe(2);
  });

  it("recalculates estimated blocks for pending reading tasks and leaves the rest untouched", () => {
    const tasks = [
      { id: 1, completed: true, page_count: 20, time_spent_minutes: 40, estimated_blocks: 1 },
      { id: 2, completed: false, page_count: 10, estimated_blocks: 1 },
      { id: 3, completed: false, reading_page_count: 30, estimated_blocks: 1 },
      { id: 4, completed: false, estimated_blocks: 3 },
    ];

    expect(recalculatePendingBlocks(tasks)).toEqual([
      tasks[0],
      { id: 2, completed: false, page_count: 10, estimated_blocks: 1 },
      { id: 3, completed: false, reading_page_count: 30, estimated_blocks: 3 },
      tasks[3],
    ]);
  });

  it("falls back to zero pages when completed readings do not include page counts", () => {
    expect(
      getAvgMinPerPage([
        { completed: true, reading_id: 1, time_spent_minutes: 25 },
      ]),
    ).toBe(2);
  });
});
