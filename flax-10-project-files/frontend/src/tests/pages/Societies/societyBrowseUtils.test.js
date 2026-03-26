import { describe, expect, it, vi } from "vitest";

vi.mock("../../../pages/Societies/societyFilters", () => ({
  matchesCategory: (society, categoryId) => society.categories?.includes(categoryId) || society.category === categoryId,
}));

import { countForFilter, filterAndSort } from "../../../pages/Societies/societyBrowseUtils";

const societies = [
  { id: 1, name: "Alpha", is_ratified: true, member_count: 0, categories: ["arts"] },
  { id: 2, name: "Beta", is_ratified: false, member_count: 7, categories: ["arts"] },
  { id: 3, name: "Gamma", is_ratified: true, categories: ["sports"] },
];

describe("societyBrowseUtils", () => {
  it("counts societies by ratification state", () => {
    expect(countForFilter(societies, "all")).toBe(3);
    expect(countForFilter(societies, "ratified")).toBe(2);
    expect(countForFilter(societies, "unratified")).toBe(1);
  });

  it("filters by search/category and sorts by member count with zero-value fallbacks", () => {
    const result = filterAndSort(
      societies,
      "",
      { ratified: "all", category: [{ id: "arts" }] },
      "members",
    );

    expect(result.map((society) => society.name)).toEqual(["Beta", "Alpha"]);
  });

  it("treats missing member counts as zero when sorting the full list by members", () => {
    const result = filterAndSort(
      societies,
      "",
      { ratified: "all", category: [] },
      "members",
    );

    expect(result.map((society) => society.name)).toEqual(["Beta", "Alpha", "Gamma"]);
  });
});
