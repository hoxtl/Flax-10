import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useSocietyBrowseFilters } from "../../pages/Societies/useSocietyBrowseFilters";

describe("useSocietyBrowseFilters", () => {
  it("updates search, sort, category, and can clear filters", () => {
    const { result } = renderHook(() => useSocietyBrowseFilters());

    const sports = { id: "sports", label: "Sports" };
    const arts = { id: "arts", label: "Arts" };

    act(() => {
      result.current.setSearch("photo");
      result.current.setSortBy("members");
      result.current.setCategory([sports, arts]);
      result.current.toggleFilter("ratified", "ratified");
    });

    expect(result.current.search).toBe("photo");
    expect(result.current.sortBy).toBe("members");
    expect(result.current.filters).toEqual({
      ratified: "ratified",
      category: [sports, arts],
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({ ratified: "all", category: [] });
  });

  it("toggles the same ratification filter back to all", () => {
    const { result } = renderHook(() => useSocietyBrowseFilters());

    act(() => {
      result.current.toggleFilter("ratified", "unratified");
    });
    expect(result.current.filters.ratified).toBe("unratified");

    act(() => {
      result.current.toggleFilter("ratified", "unratified");
    });
    expect(result.current.filters.ratified).toBe("all");
  });
});
