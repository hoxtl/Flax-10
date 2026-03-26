import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useSocietyBrowseFilters } from "../../pages/societies/useSocietyBrowseFilters";

describe("useSocietyBrowseFilters", () => {
  it("updates search search and sort criteria", () => {
    const { result } = renderHook(() => useSocietyBrowseFilters());
    act(() => { result.current.setSearch("p"); result.current.setSortBy("m"); });
    expect(result.current.search).toBe("p");
    expect(result.current.sortBy).toBe("m");
  });

  it("updates and clears diverse filter categories", () => {
    const { result } = renderHook(() => useSocietyBrowseFilters());
    const cat = { id: "s", label: "S" };
    act(() => { result.current.setCategory([cat]); result.current.toggleFilter("r", "r"); });
    expect(result.current.filters).toEqual({ ratified: "all", category: [cat], r: "r" });
    act(() => { result.current.clearFilters(); });
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
