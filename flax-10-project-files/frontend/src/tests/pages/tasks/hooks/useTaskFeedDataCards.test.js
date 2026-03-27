import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import {
  getTaskFeedDataMocks,
  renderTaskFeedData,
  resetTaskFeedDataUtils,
} from "./taskFeedDataTestSetup";
import * as taskFeedDataUtils from "../../../../pages/tasks/utils/taskFeedDataUtils";

const { navigateMock } = getTaskFeedDataMocks();

describe("useTaskFeedData - Empty State Cards", () => {
  beforeEach(() => {
    resetTaskFeedDataUtils({
      overdue: [],
      today: [],
      thisWeek: [],
      later: [],
      completedToday: undefined,
      completedWeek: undefined,
      completedLater: undefined,
    });
  });

  it("runs plan tomorrow callback from empty card", () => {
    const onPlanTomorrow = vi.fn();
    const { result } = renderTaskFeedData({ activeFilter: "today", onPlanTomorrow });
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(onPlanTomorrow).toHaveBeenCalled();
  });

  it("navigates when no custom planner callback", () => {
    const { result } = renderTaskFeedData({ activeFilter: "today" });
    act(() => result.current.todayEmptyCardProps.onCtaClick());
    expect(navigateMock).toHaveBeenCalledWith("/tasks?open=fullPlanning");
  });

  it("todayEmptyCardProps shows plural when completedTodayCount is 2", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(2);
    const { result } = renderTaskFeedData({ activeFilter: "today" });
    expect(result.current.todayEmptyCardProps.sub).toContain("2 tasks completed today");
  });

  it("todayEmptyCardProps shows singular when completedTodayCount is 1", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(1);
    const { result } = renderTaskFeedData({ activeFilter: "today" });
    expect(result.current.todayEmptyCardProps.sub).toContain("1 task completed today");
  });

  it("todayEmptyCardProps shows No tasks due today when completedTodayCount is 0", () => {
    vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(0);
    const { result } = renderTaskFeedData({ activeFilter: "today" });
    expect(result.current.todayEmptyCardProps.sub).toBe("No tasks due today.");
  });

  it("shows the search empty state when filtered pending and completed tasks are empty", () => {
    vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation(() => []);
    const { result } = renderTaskFeedData({ tasks: [{ id: 1 }], allTasks: [{ id: 1 }], activeFilter: "all" });
    act(() => { result.current.setSearch("missing"); });
    expect(result.current.showSearchEmptyState).toBe(true);
  });

  it("builds reading-list all-complete cards", () => {
    const tasks = [{ id: 8, title: "Finished", completed: true }];
    const lists = [{ id: 7, name: "CS101 - Computer Science" }];
    const { result } = renderTaskFeedData({ tasks, allTasks: tasks, lists, activeFilter: "all", activeListId: 7 });
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "All caught up on readings!",
      sub: "No suggested readings left for CS101 Computer Science right now.",
    });
  });

  it("builds generic all-complete cards when no active tasks remain", () => {
    const tasks = [{ id: 8, title: "Finished", completed: true }];
    const lists = [{ id: 8, name: "Inbox" }];
    const { result } = renderTaskFeedData({ tasks, allTasks: tasks, lists, activeFilter: "all", activeListId: 8 });
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "Great job", sub: "1 task completed. Take a moment — you earned it.",
    });
  });

  it("uses plural wording for generic all-complete cards with multiple completed tasks", () => {
    const tasks = [{ id: 8, completed: true }, { id: 9, completed: true }];
    const { result } = renderTaskFeedData({ tasks, allTasks: tasks, lists: [{ id: 8, name: "Inbox" }], activeFilter: "all", activeListId: 8 });
    expect(result.current.allTasksEmptyCardProps).toEqual({
      message: "Great job", sub: "2 tasks completed. Take a moment — you earned it.",
    });
  });
});
