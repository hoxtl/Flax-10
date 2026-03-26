import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useTaskFeedData from "../../../../pages/tasks/hooks/useTaskFeedData";
import * as taskFeedDataUtils from "../../../../pages/tasks/utils/taskFeedDataUtils";

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock("../../../../api/moduleApi", () => ({ getModules: vi.fn().mockResolvedValue([]) }));
vi.mock("../../../../components/timer/task_input/taskInputUtils", () => ({ buildListItems: () => [], filterListItems: (arr) => arr, groupModuleItems: (arr) => ({ All: arr }) }));
vi.mock("../../../../lib/allTasksCompleteMessages", () => ({ getClearMessage: () => "Great job" }));
vi.mock("../../../../pages/tasks/utils/taskFeedUtils", () => ({ getHeaderTitle: () => "Header" }));

vi.mock("../../../../pages/tasks/utils/taskFeedDataUtils", () => ({
  buildDateBounds: vi.fn(() => ({ now: new Date(), dayStart: new Date(), todayEnd: new Date(), weekEnd: new Date() })),
  filterBySearch: vi.fn((arr) => arr), getOverdue: vi.fn(() => []), getToday: vi.fn(() => []),
  getThisWeek: vi.fn(() => []), getLater: vi.fn(() => []), getCompletedTodayCount: vi.fn(),
  getCompletedWeekCount: vi.fn(), getCompletedLaterCount: vi.fn(),
  getFilterHandlers: vi.fn(() => ({ toggleListFilter: vi.fn(), toggleModuleFilter: vi.fn(), clearAllFilters: vi.fn() })),
}));

describe("useTaskFeedData - Empty State Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation((arr) => arr);
    vi.mocked(taskFeedDataUtils.getOverdue).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getToday).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getThisWeek).mockReturnValue([]);
    vi.mocked(taskFeedDataUtils.getLater).mockReturnValue([]);
  });

  it("runs plan tomorrow callback from empty card", () => {
    const onPlanTomorrow = vi.fn();
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today", onPlanTomorrow }));
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(onPlanTomorrow).toHaveBeenCalled();
  });

  it("navigates when no custom planner callback", () => {
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today" }));
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(navigateMock).toHaveBeenCalledWith("/tasks?open=fullPlanning");
  });

  it("todayEmptyCardProps shows plural when completedTodayCount is 2", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(2);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today" }));
    expect(result.current.todayEmptyCardProps.sub).toContain("2 tasks completed today");
  });

  it("todayEmptyCardProps shows singular when completedTodayCount is 1", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(1);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today" }));
    expect(result.current.todayEmptyCardProps.sub).toContain("1 task completed today");
  });

  it("todayEmptyCardProps shows No tasks due today when completedTodayCount is 0", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(0);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [], lists: [], activeFilter: "today" }));
    expect(result.current.todayEmptyCardProps.sub).toBe("No tasks due today.");
  });

  it("shows the search empty state when filtered pending and completed tasks are empty", () => {
    vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation(() => []);
    const { result } = renderHook(() => useTaskFeedData({ tasks: [{ id: 1 }], allTasks: [{ id: 1 }], lists: [], activeFilter: "all" }));
    act(() => { result.current.setSearch("missing"); });
    expect(result.current.showSearchEmptyState).toBe(true);
  });

  it("builds reading-list all-complete cards", () => {
    const tasks = [{ id: 8, title: "Finished", completed: true }];
    const lists = [{ id: 7, name: "CS101 - Computer Science" }];
    const { result } = renderHook(() => useTaskFeedData({ tasks, allTasks: tasks, lists, activeFilter: "all", activeListId: 7 }));
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "All caught up on readings!",
      sub: "No suggested readings left for CS101 Computer Science right now.",
    });
  });

  it("builds generic all-complete cards when no active tasks remain", () => {
    const tasks = [{ id: 8, title: "Finished", completed: true }];
    const lists = [{ id: 8, name: "Inbox" }];
    const { result } = renderHook(() => useTaskFeedData({ tasks, allTasks: tasks, lists, activeFilter: "all", activeListId: 8 }));
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "Great job", sub: "1 task completed. Take a moment — you earned it.",
    });
  });

  it("uses plural wording for generic all-complete cards with multiple completed tasks", () => {
    const tasks = [{ id: 8, completed: true }, { id: 9, completed: true }];
    const { result } = renderHook(() => useTaskFeedData({ tasks, allTasks: tasks, lists: [{ id: 8, name: "Inbox" }], activeFilter: "all", activeListId: 8 }));
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "Great job", sub: "2 tasks completed. Take a moment — you earned it.",
    });
  });
});
