import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskFeedFilters } from "../../../../pages/Tasks/components/useTaskFeedFilters";

describe("useTaskFeedFilters", () => {
  const tasks = [
    { id: 1, title: "T1", completed: false, module_code: "CS101", module_name: "CS 101", task_list: 1 },
    { id: 2, title: "T2", completed: true, module_code: "CS101", module_name: "CS 101", task_list: 1 },
    { id: 3, title: "T3", completed: false, module_code: "MA102", module_name: "Math", task_list: 2 },
  ];
  const lists = [
    { id: 1, name: "List A" },
    { id: 2, name: "List B" },
  ];

  it("builds listMap and list items from lists", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    expect(result.current.listMap["1"].name).toBe("List A");
    expect(result.current.visibleListItems).toEqual([
      { value: "1", label: "List A" },
      { value: "2", label: "List B" },
    ]);
  });

  it("filters pending and completed by module when filterModuleCodes set", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    act(() => result.current.toggleModuleFilter("CS101"));
    expect(result.current.pending).toHaveLength(1);
    expect(result.current.completed).toHaveLength(1);
    expect(result.current.pending[0].module_code).toBe("CS101");
  });

  it("returns all tasks when filterModuleCodes empty", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    expect(result.current.pending).toHaveLength(2);
    expect(result.current.completed).toHaveLength(1);
  });

  it("filterQuery filters visible list items", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    act(() => result.current.setFilterQuery("List A"));
    expect(result.current.visibleListItems).toHaveLength(1);
    expect(result.current.visibleListItems[0].label).toBe("List A");
  });

  it("groupedVisibleModuleItems and moduleGroupKeys are derived", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    expect(result.current.moduleGroupKeys.sort()).toEqual(["CS", "MA"]);
    expect(result.current.groupedVisibleModuleItems["CS"]).toBeDefined();
    expect(result.current.groupedVisibleModuleItems["MA"]).toBeDefined();
  });

  it("toggleListFilter calls onFilterByList with toggled set", () => {
    const onFilterByList = vi.fn();
    const { result, rerender } = renderHook(
      ({ filterListIds }) => useTaskFeedFilters(tasks, lists, filterListIds, onFilterByList),
      { initialProps: { filterListIds: [] } }
    );
    act(() => result.current.toggleListFilter("1"));
    expect(onFilterByList).toHaveBeenCalledWith(["1"]);
    rerender({ filterListIds: ["1"] });
    act(() => result.current.toggleListFilter("1"));
    expect(onFilterByList).toHaveBeenLastCalledWith([]);
  });

  it("toggleModuleFilter updates filterModuleCodes", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    act(() => result.current.toggleModuleFilter("CS101"));
    expect(result.current.filterModuleCodes).toEqual(["CS101"]);
    act(() => result.current.toggleModuleFilter("CS101"));
    expect(result.current.filterModuleCodes).toEqual([]);
  });

  it("clearAllFilters resets list filter, module filter and query", () => {
    const onFilterByList = vi.fn();
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, ["1"], onFilterByList));
    act(() => result.current.toggleModuleFilter("CS101"));
    act(() => result.current.setFilterQuery("x"));
    act(() => result.current.clearAllFilters());
    expect(onFilterByList).toHaveBeenCalledWith([]);
    expect(result.current.filterModuleCodes).toEqual([]);
    expect(result.current.filterQuery).toBe("");
  });

  it("activeFilterCount is sum of filterListIds and filterModuleCodes", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, ["1", "2"], vi.fn()));
    expect(result.current.activeFilterCount).toBe(2);
    act(() => result.current.toggleModuleFilter("CS101"));
    expect(result.current.activeFilterCount).toBe(3);
  });

  it("buildModuleItems uses module_code and module_name", () => {
    const { result } = renderHook(() => useTaskFeedFilters(tasks, lists, [], vi.fn()));
    const csGroup = result.current.groupedVisibleModuleItems["CS"];
    expect(csGroup).toBeDefined();
    expect(csGroup.some(i => i.label.includes("CS 101"))).toBe(true);
  });

  it("handles tasks with empty module_code", () => {
    const tasksNoModule = [{ id: 1, title: "T", module_code: "", task_list: 1 }];
    const { result } = renderHook(() => useTaskFeedFilters(tasksNoModule, lists, [], vi.fn()));
    expect(result.current.moduleGroupKeys).toEqual([]);
  });
});
