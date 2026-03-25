import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isEnrolledInMock = vi.fn();
const utils = vi.hoisted(() => ({
  getDeadlineSuggestions: vi.fn(() => ["deadline-suggestion"]),
  getEnrolledModules: vi.fn(() => ["module-a"]),
  getFreeWindowLabel: vi.fn(() => "2h free"),
  getHomepageRecommendation: vi.fn(() => "recommendation"),
  getMissedItems: vi.fn(() => ["missed"]),
  getNavigatorData: vi.fn(() => ({ state: "gap" })),
  getOverdueTasksForNow: vi.fn(() => ["overdue"]),
  getPastIdsShownInTimeline: vi.fn(() => ["past-id"]),
  getPastItems: vi.fn(() => ["past"]),
  getSortedEvents: vi.fn(() => ["sorted"]),
  getSuggestableTasks: vi.fn(() => ["suggestable"]),
  getTaskWidgetCompletedCount: vi.fn(() => 3),
  getTaskWidgetDisplayList: vi.fn(() => ["widget-display"]),
  getTaskWidgetDueTodayCount: vi.fn(() => 2),
  getTaskWidgetList: vi.fn(() => ["widget-items"]),
  getTaskWidgetSpineCompletedPct: vi.fn(() => 75),
  getTasksDueToday: vi.fn(() => ["due-today"]),
  getTodayFreeWindows: vi.fn(() => ["window"]),
  getTomorrowFirstEvent: vi.fn(() => ({ id: "tomorrow" })),
  getUpcomingItems: vi.fn(() => ["upcoming"]),
}));

vi.mock("../../../../components/Modules/utils/moduleUtils", () => ({
  isEnrolledIn: (...args) => isEnrolledInMock(...args),
}));

vi.mock("../../../../pages/Homepage/utils/homepageViewModel", () => utils);

import { useHomepageViewModel } from "../../../../pages/Homepage/hooks/useHomepageViewModel.js";

describe("useHomepageViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepares contextual properties and filters elements", () => {
    const props = { allCalEvents: [{ id: "all" }], allTasks: [{ id: 1 }], dayEvents: [{ id: "day" }], dayTasks: [{ id: 2 }], enrollments: [{ module_id: 10 }], getTag: vi.fn(), modulesList: [{ id: 10 }], now: new Date("2026-03-25T09:00:00Z"), selectedDate: new Date("2026-03-25T00:00:00Z"), upcomingDeadlines: [{ id: "deadline" }] };
    renderHook(() => useHomepageViewModel(props));
    expect(utils.getSortedEvents).toHaveBeenCalledWith(props.dayEvents);
    expect(utils.getPastItems).toHaveBeenCalledWith(["sorted"], props.now);
    expect(utils.getUpcomingItems).toHaveBeenCalledWith(["sorted"], ["past"]);
    expect(utils.getPastIdsShownInTimeline).toHaveBeenCalledWith(["past"], ["upcoming"]);
    expect(utils.getMissedItems).toHaveBeenCalledWith(props.selectedDate, ["past"], ["past-id"]);
    expect(utils.getNavigatorData).toHaveBeenCalledWith(props.now, props.selectedDate, ["sorted"]);
  });

  it("evaluates task urgency and aggregates widget metrics", () => {
    const props = { allCalEvents: [], allTasks: [{ id: 1 }], dayEvents: [], dayTasks: [{ id: 2 }], enrollments: [], getTag: vi.fn(), modulesList: [], now: new Date(), selectedDate: new Date(), upcomingDeadlines: [] };
    renderHook(() => useHomepageViewModel(props));
    expect(utils.getTasksDueToday).toHaveBeenCalledWith(props.dayTasks, props.now);
    expect(utils.getOverdueTasksForNow).toHaveBeenCalledWith(["due-today"], props.getTag, props.now);
    expect(utils.getSuggestableTasks).toHaveBeenCalledWith(props.dayTasks, ["upcoming"]);
    expect(utils.getTaskWidgetList).toHaveBeenCalledWith(props.allTasks, props.now);
    expect(utils.getTaskWidgetDueTodayCount).toHaveBeenCalledWith(["widget-items"], props.now);
  });

  it("calculates recommendation contexts matching timeline blocks", () => {
    const props = { allCalEvents: [{ id: "all" }], allTasks: [], dayEvents: [], dayTasks: [], enrollments: [{ module_id: 10 }], getTag: vi.fn(), modulesList: [{ id: 10 }], now: new Date(), selectedDate: new Date(), upcomingDeadlines: [{ id: "deadline" }] };
    renderHook(() => useHomepageViewModel(props));
    expect(utils.getTomorrowFirstEvent).toHaveBeenCalledWith(props.allCalEvents, props.selectedDate);
    expect(utils.getTodayFreeWindows).toHaveBeenCalledWith(props.selectedDate, ["sorted"]);
    expect(utils.getFreeWindowLabel).toHaveBeenCalledWith(["window"]);
    expect(utils.getHomepageRecommendation).toHaveBeenCalledWith(["widget-items"], props.upcomingDeadlines, "2h free");
    expect(utils.getEnrolledModules).toHaveBeenCalledWith(props.modulesList, props.enrollments, expect.any(Function));
  });

  it("returns the unified compound state object cleanly", () => {
    const props = { allCalEvents: [], allTasks: [], dayEvents: [], dayTasks: [], enrollments: [], getTag: vi.fn(), modulesList: [], now: new Date(), selectedDate: new Date(), upcomingDeadlines: [] };
    const { result } = renderHook(() => useHomepageViewModel(props));
    expect(result.current).toMatchObject({
      deadlineSuggestions: ["deadline-suggestion"], missedItems: ["missed"], navigatorContext: { state: "gap" },
      overdueTasksForNow: ["overdue"], sortedEvents: ["sorted"], suggestableTasks: ["suggestable"],
      tasksDueToday: ["due-today"], tomorrowFirstEvent: { id: "tomorrow" }, taskWidgetDueTodayCount: 2,
      taskWidgetItemsOnly: ["widget-items"], taskWidgetList: ["widget-display"], taskWidgetOverdueCount: 0,
      taskWidgetSpineCompletedPct: 75, enrolledModules: ["module-a"], homepageRecommendation: "recommendation",
    });
  });
});
