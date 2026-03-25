/* Tests for useTaskFeedData hook filtering, sorting, and navigation logic */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const navigateMock = vi.hoisted(() => vi.fn());
const getModulesMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../../../api/moduleApi", () => ({
  getModules: (...args) => getModulesMock(...args),
}));

vi.mock("../../../../components/Timer/taskInput/taskInputUtils", () => ({
  buildListItems: (lists = []) => lists.map((list) => ({ value: list.id, label: list.name })),
  filterListItems: (items) => items,
  groupModuleItems: (items) => ({ All: items }),
}));

vi.mock("../../../../lib/allTasksCompleteMessages", () => ({
  getClearMessage: () => "Great job",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedUtils", () => ({
  getHeaderTitle: () => "Header",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedDataUtils", () => ({
  buildDateBounds: vi.fn(() => ({
    now: new Date("2026-03-08T10:00:00Z"),
    dayStart: new Date("2026-03-08T00:00:00Z"),
    todayEnd: new Date("2026-03-08T23:59:59Z"),
    weekEnd: new Date("2026-03-15T23:59:59Z"),
  })),
  filterBySearch: vi.fn((arr) => arr),
  getOverdue: vi.fn(() => [{ id: 1 }]),
  getToday: vi.fn(() => [{ id: 2 }]),
  getThisWeek: vi.fn(() => [{ id: 3 }]),
  getLater: vi.fn(() => [{ id: 4 }]),
  getCompletedTodayCount: vi.fn(() => 1),
  getCompletedWeekCount: vi.fn(() => 2),
  getCompletedLaterCount: vi.fn(() => 3),
  getFilterHandlers: vi.fn(() => ({
    toggleListFilter: vi.fn(),
    toggleModuleFilter: vi.fn(),
    clearAllFilters: vi.fn(),
  })),
}));

import useTaskFeedData from "../../../../pages/Tasks/hooks/useTaskFeedData";
import * as taskFeedDataUtils from "../../../../pages/Tasks/utils/taskFeedDataUtils";

describe("useTaskFeedData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation((arr) => arr);
    vi.mocked(taskFeedDataUtils.getOverdue).mockReturnValue([{ id: 1 }]);
    vi.mocked(taskFeedDataUtils.getToday).mockReturnValue([{ id: 2 }]);
    vi.mocked(taskFeedDataUtils.getThisWeek).mockReturnValue([{ id: 3 }]);
    vi.mocked(taskFeedDataUtils.getLater).mockReturnValue([{ id: 4 }]);
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(1);
    vi.mocked(taskFeedDataUtils.getCompletedWeekCount).mockReturnValue(2);
    vi.mocked(taskFeedDataUtils.getCompletedLaterCount).mockReturnValue(3);
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation(() => ({
      toggleListFilter: vi.fn(),
      toggleModuleFilter: vi.fn(),
      clearAllFilters: vi.fn(),
    }));
    getModulesMock.mockResolvedValue([]);
  });

  it("builds sections and header", () => {
    const tasks = [{ id: 1, completed: false }, { id: 2, completed: true }];
    const lists = [{ id: 9, name: "Inbox" }];
    const { result } = renderHook(() => useTaskFeedData({ tasks, lists, activeFilter: "all", activeListId: null, filterListIds: [] }));
    expect(result.current.headerTitle).toBe("Header");
    expect(result.current.overdue.length).toBe(1);
    expect(result.current.today.length).toBe(1);
    expect(result.current.thisWeek.length).toBe(1);
    expect(result.current.later.length).toBe(1);
  });

  it("runs plan tomorrow callback from empty card", () => {
    const onPlanTomorrow = vi.fn();
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", activeListId: null, filterListIds: [], onPlanTomorrow }));
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(onPlanTomorrow).toHaveBeenCalled();
  });

  it("navigates when no custom planner callback", () => {
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", activeListId: null, filterListIds: [] }));
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(navigateMock).toHaveBeenCalledWith("/tasks?open=fullPlanning");
  });

  it("todayEmptyCardProps shows plural when completedTodayCount is 2", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(2);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", activeListId: null, filterListIds: [] }));
    expect(result.current.todayEmptyCardProps.sub).toContain("2 tasks");
    expect(result.current.todayEmptyCardProps.sub).toContain("completed today");
  });

  it("todayEmptyCardProps shows singular when completedTodayCount is 1", () => {
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", activeListId: null, filterListIds: [] }));
    expect(result.current.todayEmptyCardProps.sub).toContain("1 task completed today");
  });

  it("todayEmptyCardProps shows No tasks due today when completedTodayCount is 0", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(0);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", activeListId: null, filterListIds: [] }));
    expect(result.current.todayEmptyCardProps.sub).toBe("No tasks due today.");
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

    const { result } = renderHook(() => useTaskFeedData({ tasks, lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }));

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
    const { result } = renderHook(() => useTaskFeedData({
      tasks,
      allTasks: tasks,
      lists: [{ id: 9, name: "Inbox" }],
      activeFilter: "all",
      activeListId: null,
      filterListIds: [9],
    }));

    act(() => {
      result.current.setSearch("report");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, completed: false, task_list: 9, module_code: "CS101" }]);
      expect(result.current.completed).toEqual([{ id: 3, completed: true, task_list: 9, module_code: "CS101" }]);
    });
  });

  it("filters by selected module codes when module filters are toggled", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation(
      (_filterListIds, _onFilterByList, setFilterModuleCodes, setFilterQuery) => ({
        toggleListFilter: vi.fn(),
        toggleModuleFilter: (code) => setFilterModuleCodes((prev) => (prev.includes(code) ? [] : [code])),
        clearAllFilters: () => {
          setFilterModuleCodes([]);
          setFilterQuery("");
        },
      }),
    );

    const tasks = [
      { id: 1, title: "Read notes", completed: false, module_code: "CS101" },
      { id: 2, title: "Submit lab", completed: false, module_code: "MA202" },
      { id: 3, title: "Done reading", completed: true, module_code: "CS101" },
    ];

    const { result } = renderHook(() =>
      useTaskFeedData({ tasks, allTasks: tasks, lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }),
    );

    act(() => {
      result.current.toggleModuleFilter("CS101");
    });

    await waitFor(() => {
      expect(result.current.filterModuleCodes).toEqual(["CS101"]);
      expect(result.current.pending).toEqual([{ id: 1, title: "Read notes", completed: false, module_code: "CS101" }]);
      expect(result.current.completed).toEqual([{ id: 3, title: "Done reading", completed: true, module_code: "CS101" }]);
    });

    act(() => {
      result.current.clearAllFilters();
    });

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

    const { result } = renderHook(() =>
      useTaskFeedData({ tasks, allTasks, lists: [], activeFilter: "overdue", activeListId: null, filterListIds: [] }),
    );

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

    const { result } = renderHook(() =>
      useTaskFeedData({ tasks, allTasks, lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }),
    );

    act(() => {
      result.current.setSearch("task");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, title: "Subset task", completed: false, task_list: 1 }]);
      expect(result.current.completed).toEqual([{ id: 2, title: "Other task", completed: true, task_list: 2 }]);
    });
  });

  it("shows the search empty state when filtered pending and completed tasks are empty", async () => {
    vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation(() => []);

    const tasks = [{ id: 1, title: "Task A", completed: false }];
    const { result } = renderHook(() =>
      useTaskFeedData({ tasks, allTasks: tasks, lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }),
    );

    act(() => {
      result.current.setSearch("missing");
    });

    await waitFor(() => {
      expect(result.current.showSearchEmptyState).toBe(true);
    });
  });

  it("builds reading-list and generic all-complete cards when no active tasks remain", () => {
    vi.mocked(taskFeedDataUtils.getOverdue).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getToday).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getThisWeek).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getLater).mockReturnValue([]);

    const completedTasks = [{ id: 8, title: "Finished", completed: true }];
    const readingLists = [{ id: 7, name: "CS101 - Computer Science" }];
    const regularLists = [{ id: 8, name: "Inbox" }];

    const { result: readingResult } = renderHook(() =>
      useTaskFeedData({
        tasks: completedTasks,
        allTasks: completedTasks,
        lists: readingLists,
        activeFilter: "all",
        activeListId: 7,
        filterListIds: [],
      }),
    );

    expect(readingResult.current.allTasksEmptyCardProps).toEqual({
      message: "All caught up on readings!",
      sub: "No suggested readings left for CS101 Computer Science right now.",
    });

    const { result: regularResult } = renderHook(() =>
      useTaskFeedData({
        tasks: completedTasks,
        allTasks: completedTasks,
        lists: regularLists,
        activeFilter: "all",
        activeListId: 8,
        filterListIds: [],
      }),
    );

    expect(regularResult.current.allTasksEmptyCardProps).toEqual({
      message: "Great job",
      sub: "1 task completed. Take a moment — you earned it.",
    });
  });

  it("uses plural wording for generic all-complete cards with multiple completed tasks", () => {
    vi.mocked(taskFeedDataUtils.getOverdue).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getToday).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getThisWeek).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getLater).mockReturnValue([]);

    const completedTasks = [
      { id: 8, title: "Finished", completed: true },
      { id: 9, title: "Finished again", completed: true },
    ];

    const { result } = renderHook(() =>
      useTaskFeedData({
        tasks: completedTasks,
        allTasks: completedTasks,
        lists: [{ id: 8, name: "Inbox" }],
        activeFilter: "all",
        activeListId: 8,
        filterListIds: [],
      }),
    );

    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "Great job",
      sub: "2 tasks completed. Take a moment — you earned it.",
    });
  });

  it("focuses the task input for the n shortcut and blurs editable targets on escape", () => {
    const focus = vi.fn();
    const blur = vi.fn();
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Task name");
    input.focus = focus;
    document.body.appendChild(input);

    const textarea = document.createElement("textarea");
    textarea.blur = blur;
    document.body.appendChild(textarea);

    renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(focus).toHaveBeenCalled();
    expect(blur).toHaveBeenCalled();

    input.remove();
    textarea.remove();
  });

  it("closes the filter popup when clicking outside the filter ref", async () => {
    const { result } = renderHook(() =>
      useTaskFeedData({ tasks: [], lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }),
    );

    const inside = document.createElement("div");
    const outside = document.createElement("button");
    document.body.appendChild(inside);
    document.body.appendChild(outside);

    act(() => {
      result.current.filterRef.current = { contains: (node) => node === inside };
      result.current.setIsFilterOpen(true);
    });

    expect(result.current.isFilterOpen).toBe(true);

    act(() => {
      inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(result.current.isFilterOpen).toBe(true);

    act(() => {
      outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    await waitFor(() => {
      expect(result.current.isFilterOpen).toBe(false);
    });

    inside.remove();
    outside.remove();
  });

  it("handles missing tasks, lists, and module metadata defaults", async () => {
    getModulesMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useTaskFeedData({ tasks: [], lists: [], activeFilter: "all" }),
    );

    await waitFor(() => expect(result.current.visibleListItems).toEqual([]));
    expect(result.current.groupedVisibleModuleItems.All).toEqual([]);
    expect(result.current.listMap).toEqual({});
    expect(result.current.headerTitle).toBe("Header");
  });

  it("uses default task and list collections when the hook props omit them", async () => {
    const { result } = renderHook(() =>
      useTaskFeedData({ activeFilter: "all", activeListId: 999 }),
    );

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

    const { unmount } = renderHook(() =>
      useTaskFeedData({ tasks: [], lists: [], activeFilter: "all", activeListId: null }),
    );

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

    const { unmount } = renderHook(() =>
      useTaskFeedData({ tasks: [], lists: [], activeFilter: "all", activeListId: null }),
    );

    unmount();

    await act(async () => {
      rejectModules(new Error("late metadata failure"));
      await Promise.resolve();
    });
  });

  it("filters tasks with missing module codes when the empty code is selected", async () => {
    vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation(
      (_filterListIds, _onFilterByList, setFilterModuleCodes, setFilterQuery) => ({
        toggleListFilter: vi.fn(),
        toggleModuleFilter: (code) => setFilterModuleCodes((prev) => (prev.includes(code) ? [] : [code])),
        clearAllFilters: () => {
          setFilterModuleCodes([]);
          setFilterQuery("");
        },
      }),
    );

    const tasks = [
      { id: 1, title: "No module", completed: false, module_code: null },
      { id: 2, title: "Has module", completed: false, module_code: "CS101" },
    ];

    const { result } = renderHook(() =>
      useTaskFeedData({
        tasks,
        allTasks: tasks,
        lists: [],
        activeFilter: "all",
        activeListId: null,
        filterListIds: [],
      }),
    );

    act(() => {
      result.current.toggleModuleFilter("");
    });

    await waitFor(() => {
      expect(result.current.pending).toEqual([{ id: 1, title: "No module", completed: false, module_code: null }]);
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

    const { result } = renderHook(() =>
      useTaskFeedData({ tasks, lists: [], activeFilter: "all", activeListId: null, filterListIds: [] }),
    );

    await waitFor(() => expect(result.current.groupedVisibleModuleItems.All).toEqual([
      { value: "PH101", label: "PH101" },
    ]));
  });
});
