/* Tests for useTaskFeedData hook filtering, sorting, and navigation logic */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import {
  getTaskFeedDataMocks,
  renderTaskFeedData,
  resetTaskFeedDataUtils,
} from "./taskFeedDataTestSetup";
import * as taskFeedDataUtils from "../../../../pages/tasks/utils/taskFeedDataUtils";

const { getModulesMock } = getTaskFeedDataMocks();

function appendFocusableElements() {
  const focus = vi.fn();
  const blur = vi.fn();
  const input = document.createElement("input");
  input.setAttribute("aria-label", "Task name");
  input.focus = focus;
  document.body.appendChild(input);

  const textarea = document.createElement("textarea");
  textarea.blur = blur;
  document.body.appendChild(textarea);

  return { focus, blur, input, textarea };
}

describe("useTaskFeedData", () => {
  beforeEach(() => {
    resetTaskFeedDataUtils();
  });

  it("builds sections and header", async () => {
    const tasks = [{ id: 1, completed: false }, { id: 2, completed: true }];
    const lists = [{ id: 9, name: "Inbox" }];
    const { result } = renderTaskFeedData({ tasks, lists });
    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([]));
    expect(result.current.headerTitle).toBe("Header");
    expect(result.current.overdue.length).toBe(1);
    expect(result.current.today.length).toBe(1);
    expect(result.current.thisWeek.length).toBe(1);
    expect(result.current.later.length).toBe(1);
  });



  it("builds module filter labels from loaded module metadata", async () => {
    getModulesMock.mockResolvedValueOnce([
      { module_code: "cs101", module_name: "Computer Science" },
      { module_code: "ma202", title: "Linear Algebra" },
      { module_code: "", module_name: "Ignored" },
    ]);

    const tasks = [
      { id: 1, completed: false, module_code: "CS101", module_name: "" },
      { id: 2, completed: false, module_code: "MA202", module_name: "" },
    ];

    const { result } = renderTaskFeedData({ tasks });

    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([
      { value: "CS101", label: "CS101 — Computer Science" },
      { value: "MA202", label: "MA202 — Linear Algebra" },
    ]));
  });

  it("searches within the selected list ids when a search query is active", async () => {
    const tasks = [
      { id: 1, completed: false, task_list: 9, module_code: "CS101" },
      { id: 2, completed: false, task_list: 10, module_code: "MA202" },
      { id: 3, completed: true, task_list: 9, module_code: "CS101" },
    ];
    const { result } = renderTaskFeedData({
      tasks,
      allTasks: tasks,
      lists: [{ id: 9, name: "Inbox" }],
      filterListIds: [9],
    });

    act(() => {
      result.current.setSearch("report");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, completed: false, task_list: 9, module_code: "CS101" }]);
      expect(result.current.completed).toEqual([{ id: 3, completed: true, task_list: 9, module_code: "CS101" }]);
    });
  });

  it("toggles module filter codes", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation((_l, _o, set) => ({ toggleModuleFilter: (c) => set((p) => (p.includes(c) ? [] : [c])) }));
    const { result } = renderTaskFeedData();
    act(() => { result.current.toggleModuleFilter("CS1"); });
    await waitFor(() => expect(result.current.filterModuleCodes).toEqual(["CS1"]));
  });

  it("filters task feed by selected module codes", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation((_filterListIds, _onFilterByList, setFilterModuleCodes) => ({
      toggleListFilter: vi.fn(),
      toggleModuleFilter: (code) => setFilterModuleCodes([code]),
      clearAllFilters: vi.fn(),
    }));

    const tasks = [{ id: 1, module_code: "CS1" }, { id: 2, module_code: "MA2" }];
    const { result } = renderTaskFeedData({ tasks, allTasks: tasks });
    act(() => { result.current.toggleModuleFilter("CS1"); });
    await waitFor(() => expect(result.current.pending).toEqual([{ id: 1, module_code: "CS1" }]));
  });

  it("clears all filters when clearAllFilters is called", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation(
      (_filterListIds, _onFilterByList, setFilterModuleCodes, setFilterQuery) => ({
        toggleListFilter: vi.fn(),
        toggleModuleFilter: vi.fn(),
        clearAllFilters: () => { setFilterModuleCodes([]); setFilterQuery(""); },
      }),
    );

    const { result } = renderTaskFeedData({ allTasks: [] });

    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([]));
    act(() => { result.current.clearAllFilters(); });
    expect(result.current.filterModuleCodes).toEqual([]);
  });

  it("uses overdue tasks from all tasks when searching in the overdue filter", async () => {
    const overdueDate = "2026-03-07T10:00:00Z";
    const futureDate = "2026-04-09T10:00:00Z";
    const tasks = [{ id: 99, title: "Visible subset", completed: false, due_date: futureDate }];
    const allTasks = [
      { id: 1, title: "Overdue task", completed: false, due_date: overdueDate },
      { id: 2, title: "Future task", completed: false, due_date: futureDate },
      { id: 3, title: "Completed overdue", completed: true, due_date: overdueDate },
    ];

    const { result } = renderTaskFeedData({ tasks, allTasks, activeFilter: "overdue" });

    act(() => {
      result.current.setSearch("over");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, title: "Overdue task", completed: false, due_date: overdueDate }]);
      expect(result.current.completed).toEqual([]);
    });
  });

  it("uses all tasks for search when there are no selected list filters", async () => {
    const tasks = [{ id: 1, title: "Subset task", completed: false, task_list: 1 }];
    const allTasks = [
      { id: 1, title: "Subset task", completed: false, task_list: 1 },
      { id: 2, title: "Other task", completed: true, task_list: 2 },
    ];

    const { result } = renderTaskFeedData({ tasks, allTasks });

    act(() => {
      result.current.setSearch("task");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, title: "Subset task", completed: false, task_list: 1 }]);
      expect(result.current.completed).toEqual([{ id: 2, title: "Other task", completed: true, task_list: 2 }]);
    });
  });




  it("focuses the task input for the n shortcut and blurs editable targets on escape", async () => {
    const { blur, focus, input, textarea } = appendFocusableElements();
    const { result } = renderTaskFeedData();
    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([]));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(focus).toHaveBeenCalled();
    expect(blur).toHaveBeenCalled();

    input.remove();
    textarea.remove();
  });

  describe("filter popup auto-close", () => {
    it("keeps the filter open when clicking inside the filter ref", async () => {
      const { result } = renderTaskFeedData();
      const inside = document.createElement("div");
      document.body.appendChild(inside);
      await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([]));
      act(() => {
        result.current.filterRef.current = { contains: (node) => node === inside };
        result.current.setIsFilterOpen(true);
        inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(result.current.isFilterOpen).toBe(true);
      inside.remove();
    });

    it("closes the filter when clicking outside the filter ref", async () => {
      const { result } = renderTaskFeedData();
      const outside = document.createElement("button");
      document.body.appendChild(outside);
      act(() => {
        result.current.filterRef.current = { contains: () => false };
        result.current.setIsFilterOpen(true);
      });
      act(() => {
        outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      await waitFor(() => expect(result.current.isFilterOpen).toBe(false));
      outside.remove();
    });
  });

  it("handles missing tasks, lists, and module metadata defaults", async () => {
    getModulesMock.mockResolvedValueOnce(undefined);

    const { result } = renderTaskFeedData();

    await waitFor(() => expect(result.current.visibleListItems).toEqual([]));
    expect(result.current.groupedVisibleModuleItems.All).toEqual([]);
    expect(result.current.listMap).toEqual({});
    expect(result.current.headerTitle).toBe("Header");
  });

  it("uses default task and list collections when the hook props omit them", async () => {
    const { result } = renderTaskFeedData({ activeListId: 999 });

    await waitFor(() => expect(result.current.listMap).toEqual({}));
    expect(result.current.pending).toEqual([]);
    expect(result.current.completed).toEqual([]);
  });

  it("ignores late module metadata responses after unmount", async () => {
    let resolveModules;
    getModulesMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveModules = resolve;
      }),
    );

    const { unmount } = renderTaskFeedData();

    unmount();

    await act(async () => {
      resolveModules([{ module_code: "CS1", module_name: "Late module" }]);
      await Promise.resolve();
    });
  });

  it("ignores rejected module metadata responses after unmount", async () => {
    let rejectModules;
    getModulesMock.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectModules = reject;
      }),
    );

    const { unmount } = renderTaskFeedData();

    unmount();

    await act(async () => {
      rejectModules(new Error("late metadata failure"));
      await Promise.resolve();
    });
  });

  it("filters tasks with missing module codes when the empty code is selected", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation((_f, _o, setM) => ({
        toggleListFilter: vi.fn(), toggleModuleFilter: (c) => setM((prev) => (prev.includes(c) ? [] : [c])),
        clearAllFilters: vi.fn(),
    }));
    const tasks = [{ id: 1, completed: false, module_code: null }, { id: 2, completed: false, module_code: "CS101" }];
    const { result } = renderTaskFeedData({ tasks, allTasks: tasks });

    act(() => { result.current.toggleModuleFilter(""); });
    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, completed: false, module_code: null }]);
      expect(result.current.completed).toEqual([]);
    });
  });

  it("builds module labels from code-only metadata when names are unavailable", async () => {
    getModulesMock.mockResolvedValueOnce([
      { module_code: "ph101" },
    ]);

    const tasks = [
      { id: 1, completed: false, module_code: "PH101", module_name: "" },
    ];

    const { result } = renderTaskFeedData({ tasks });

    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([
      { value: "PH101", label: "PH101" },
    ]));
  });
});
