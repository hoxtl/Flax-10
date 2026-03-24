import { describe, expect, it, vi } from "vitest";

import {
  getMobileListSectionProps,
  splitMobileLists,
} from "../../../../pages/Tasks/components/mobileTaskListsUtils";

describe("mobileTaskListsUtils", () => {
  it("splits reading and life lists from mixed input", () => {
    const lists = [
      { id: 1, name: "CS1010 - Algorithms" },
      { id: 2, name: "Groceries" },
      { id: 3, name: "Reading List - Modern History" },
      { id: 4, name: "Errands" },
    ];

    expect(splitMobileLists(lists)).toEqual({
      readingLists: [lists[0], lists[2]],
      lifeLists: [lists[1], lists[3]],
    });
  });

  it("returns section props with titles, counts, ids, and empty messages", () => {
    const onSelectList = vi.fn();
    const lists = [
      { id: "reading-1", name: "CS1010 - Algorithms" },
      { id: "life-1", name: "Groceries" },
    ];
    const listCounts = { "reading-1": 3, "life-1": 1 };

    const { readingProps, lifeProps } = getMobileListSectionProps(
      lists,
      listCounts,
      "reading-1",
      onSelectList,
    );

    expect(readingProps).toEqual({
      title: "READING LISTS",
      lists: [lists[0]],
      listCounts,
      activeListId: "reading-1",
      onSelectList,
      emptyMessage: "No reading lists",
    });
    expect(lifeProps).toEqual({
      title: "LIFE LISTS",
      lists: [lists[1]],
      listCounts,
      activeListId: "reading-1",
      onSelectList,
      emptyMessage: "No life lists",
    });
  });

  it("handles missing lists by returning empty sections", () => {
    const { readingProps, lifeProps } = getMobileListSectionProps(
      undefined,
      {},
      null,
      vi.fn(),
    );

    expect(readingProps.lists).toEqual([]);
    expect(lifeProps.lists).toEqual([]);
    expect(readingProps.emptyMessage).toBe("No reading lists");
    expect(lifeProps.emptyMessage).toBe("No life lists");
  });
});
