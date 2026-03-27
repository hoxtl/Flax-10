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

  it("returns reading list section props", () => {
    const onSelectList = vi.fn();
    const lists = [{ id: "r1", name: "CS101 - Algorithms" }];
    const counts = { "r1": 3 };
    const { readingProps } = getMobileListSectionProps(lists, counts, "r1", onSelectList);
    expect(readingProps).toEqual({
      title: "READING LISTS",
      lists,
      listCounts: counts,
      activeListId: "r1",
      onSelectList,
      emptyMessage: "No reading lists",
    });
  });

  it("returns life list section props", () => {
    const onSelectList = vi.fn();
    const lists = [{ id: "l1", name: "Groceries" }];
    const counts = { "l1": 1 };
    const { lifeProps } = getMobileListSectionProps(lists, counts, "l1", onSelectList);
    expect(lifeProps).toEqual({
      title: "LIFE LISTS",
      lists,
      listCounts: counts,
      activeListId: "l1",
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
