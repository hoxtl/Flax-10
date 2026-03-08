import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../../../lib/allTasksCompleteMessages", () => ({
  getClearMessage: () => "Great job",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedUtils", () => ({
  getHeaderTitle: () => "Header",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedDataUtils", () => ({
  buildDateBounds: () => ({
    now: new Date("2026-03-08T10:00:00Z"),
    dayStart: new Date("2026-03-08T00:00:00Z"),
    todayEnd: new Date("2026-03-08T23:59:59Z"),
    weekEnd: new Date("2026-03-15T23:59:59Z"),
  }),
  filterBySearch: (arr) => arr,
  getOverdue: () => [{ id: 1 }],
  getToday: () => [{ id: 2 }],
  getThisWeek: () => [{ id: 3 }],
  getLater: () => [{ id: 4 }],
  getCompletedTodayCount: () => 1,
  getCompletedWeekCount: () => 2,
  getCompletedLaterCount: () => 3,
  getFilterHandlers: () => ({
    toggleListFilter: vi.fn(),
    toggleModuleFilter: vi.fn(),
    clearAllFilters: vi.fn(),
  }),
}));

import useTaskFeedData from "../../../../pages/Tasks/hooks/useTaskFeedData";

describe("useTaskFeedData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
