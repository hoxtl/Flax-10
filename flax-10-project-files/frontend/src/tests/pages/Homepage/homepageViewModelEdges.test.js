import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAllFreeWindowsTodayMock = vi.fn();
const getNavigatorContextMock = vi.fn();
const isNowMock = vi.fn();
const isRoutineOrEventTaskMock = vi.fn();
const isTodayMock = vi.fn();
const overlapsDayMock = vi.fn();

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
  overlapsDay: (...args) => overlapsDayMock(...args),
}));

vi.mock("../../../pages/homepage/utils/index", () => ({
  getAllFreeWindowsToday: (...args) => getAllFreeWindowsTodayMock(...args),
  getNavigatorContext: (...args) => getNavigatorContextMock(...args),
  isNow: (...args) => isNowMock(...args),
  isRoutineOrEventTask: (...args) => isRoutineOrEventTaskMock(...args),
}));

import {
  getDeadlineSuggestions,
  getEnrolledModules,
  getHomepageRecommendation,
  getMissedItems,
  getOverdueTasksForNow,
  getPastIdsShownInTimeline,
  getPastItems,
  getSortedEvents,
  getSuggestableTasks,
  getTaskCategoryColor,
  getTaskCategoryPillMeta,
  getTasksDueToday,
  getTaskWidgetCompletedCount,
  getTaskWidgetDisplayList,
  getTaskWidgetDueTodayCount,
  getTaskWidgetList,
  getTaskWidgetSpineCompletedPct,
  getTodayFreeWindows,
  getTomorrowFirstEvent,
  getUpcomingItems,
} from "../../../pages/homepage/utils/homepageViewModel";

const now = new Date("2026-03-24T09:00:00.000Z");

describe("homepageViewModel fallbacks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    getAllFreeWindowsTodayMock.mockReset();
    isNowMock.mockReset();
    isRoutineOrEventTaskMock.mockReset();
    isTodayMock.mockReset();
    overlapsDayMock.mockReset();
    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
    isNowMock.mockReturnValue(false);
    isRoutineOrEventTaskMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers enrolled modules and tomorrow events fallbacks", () => {
    expect(getEnrolledModules(null, [1], () => true)).toEqual([]);
    expect(getTomorrowFirstEvent(null, now)).toBeNull();
    overlapsDayMock.mockReturnValue(false);
    expect(getTomorrowFirstEvent([{ id: 1, start_time: "2026-03-25T09:00:00.000Z" }], now)).toBeNull();
  });

  it("covers task category pill meta fallbacks", () => {
    const listMeta = { list_name: "none", task_list: 4, module: 5 };
    expect(getTaskCategoryPillMeta(listMeta, [{ id: 4, name: "none" }], [{ id: 5, module_name: "History" }])).toEqual({ label: "History", listId: null });
    expect(getTaskCategoryPillMeta({ moduleId: 6 }, [], [{ id: 6 }])).toEqual({ label: "M6", listId: null });
    expect(getTaskCategoryPillMeta({ tag: 7 }, null, null)).toBeNull();
    expect(getTaskCategoryColor({ module_code: "CS101" }, () => null)).toBe("sage");
  });

  it("finds matching recommendation with module details", () => {
    const rec = getHomepageRecommendation(
      [{ id: 6, title: "Module-code match", module_code: "BIO", completed: false }],
      [{ module_code: "BIO", title: "Biology notes", start_due_date: "2026-03-25T20:00:00.000Z" }],
    );
    expect(rec).toEqual({ meta: "BIO · due tomorrow", taskTitle: "Module-code match", text: "Focus on Module-code match for Biology notes." });
  });

  it("handles basic timeline event and history missing arguments", () => {
    expect(getSortedEvents(null)).toEqual([]);
    expect(getSortedEvents([{ id: 10, start_time: "2026-03-24T09:00:00.000Z" }])).toEqual([{ id: 10, start_time: "2026-03-24T09:00:00.000Z" }]);
    expect(getSortedEvents([{ id: 9, title: "Lunch" }])).toEqual([{ id: 9, title: "Lunch" }]);
    expect(getPastItems(null, new Date("2026-03-24T10:00:00.000Z"))).toEqual([]);
    expect(Array.from(getPastIdsShownInTimeline(null, null))).toEqual([]);
    expect(getUpcomingItems(null, [])).toEqual([]);
    expect(getUpcomingItems([{ id: 30, title: "Later" }], null)).toEqual([{ id: 30, title: "Later" }]);
  });

  it("skips past items when the item is active 'now'", () => {
    isNowMock.mockReturnValue(true);
    expect(getPastItems([{ id: 1, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }], new Date("2026-03-24T10:00:00.000Z"))).toEqual([]);
  });

  it("filters shown timeline history ids cleanly", () => {
    expect(Array.from(getPastIdsShownInTimeline([{ id: 10, start_time: "2026-03-24T08:00:00.000Z" }], [{ id: 11, start_time: "2026-03-24T08:30:00.000Z" }]))).toEqual([]);
    expect(Array.from(getPastIdsShownInTimeline([{ id: 14, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }], [{ id: 15, start_time: "2026-03-24T08:30:00.000Z" }]))).toEqual([14]);
    expect(Array.from(getPastIdsShownInTimeline([{ id: 12, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }], null))).toEqual([]);
  });

  it("safely queries missed, suggested, and due tasks", () => {
    expect(getMissedItems(now, null, new Set())).toEqual([]);
    expect(getSuggestableTasks(null, [{ title: "Essay" }])).toEqual([]);
    expect(getSuggestableTasks([{ id: 6, title: "Essay" }], null)).toEqual([{ id: 6, title: "Essay" }]);
    expect(getSuggestableTasks([{ id: 4, title: "Essay" }], [{ id: 5 }])).toEqual([{ id: 4, title: "Essay" }]);
    expect(getTasksDueToday(null, now)).toEqual([]);
    expect(getTasksDueToday([{ id: 7, completed: false }], now)).toEqual([]);
  });

  it("extracts and prioritises deadline suggestions securely", () => {
    expect(getDeadlineSuggestions(now, [{ id: 4, title: "Soon", start_due_date: "2026-03-25T12:00:00.000Z" }], [{}], now.getTime())).toEqual([{ id: 4, title: "Soon", start_due_date: "2026-03-25T12:00:00.000Z" }]);
    expect(getDeadlineSuggestions(now, [{ id: 1, module_code: "BIO", start_due_date: "2026-03-25T12:00:00.000Z" }, { id: 2, title: "No due date" }, { id: 3, module_code: "CHEM", start_due_date: "2026-04-20T12:00:00.000Z" }], [{ id: 44, title: "BIO quiz prep" }], now.getTime())).toEqual([]);
    expect(getDeadlineSuggestions(now, [{ id: 6, title: "Second", start_due_date: "2026-03-27T12:00:00.000Z" }, { id: 7, title: "First", start_due_date: "2026-03-25T12:00:00.000Z" }], null, now.getTime()).map(d => d.id)).toEqual([7, 6]);
  });

  it("handles out of context timeline states for deadlines", () => {
    isTodayMock.mockReturnValue(false);
    expect(getDeadlineSuggestions(now, [{ id: 8, start_due_date: "2026-03-25T12:00:00.000Z" }], [], now.getTime())).toEqual([]);
    isTodayMock.mockReturnValue(true);
    expect(getDeadlineSuggestions(now, null, [], now.getTime())).toEqual([]);
    expect(getDeadlineSuggestions(now, [{ id: 5, assessment_title: "Essay plan", start_due_date: "2026-03-25T12:00:00.000Z" }], [{ id: 77, title: "essay pl review" }], now.getTime())).toEqual([]);
  });

  it("filters overdue tasks rejecting routines", () => {
    expect(getOverdueTasksForNow(null, () => null, now)).toEqual([]);
    isRoutineOrEventTaskMock.mockImplementation((task) => task.title === "Routine");
    expect(getOverdueTasksForNow([{ id: 20, title: "Routine", completed: false, due_date: "2026-03-23T08:00:00.000Z" }, { id: 21, title: "Essay", completed: false, due_date: "2026-03-23T07:00:00.000Z" }, { id: 22, title: "Essay 2", completed: false, due_date: "2026-03-23T06:00:00.000Z" }], () => null, now).map(t => t.id)).toEqual([22, 21]);
  });

  it("generates safe empty or completed widget list mappings", () => {
    expect(getTaskWidgetList(null, now)).toEqual([]);
    expect(getTaskWidgetList([{ id: 2, title: "No due date", completed: false }], now)).toEqual([]);
    expect(getTaskWidgetList([{ id: 1, title: "Done", completed: true, due_date: "2026-03-24T11:00:00.000Z", priority: "low" }], now)).toEqual([expect.objectContaining({ id: 1, taskWidgetStatus: "completed" })]);
  });

  it("keeps only the supplied today widget items", () => {
    const getDisp = (itemsOnly, allTasks = []) => getTaskWidgetDisplayList(allTasks, now, itemsOnly).map(t => t.id);
    expect(getDisp([{ id: "overdue", due_date: "2026-03-24T08:00Z", sortTime: new Date("2026-03-24T08:00Z"), taskWidgetStatus: "overdue" }, { id: "upcoming", due_date: "2026-03-24T12:00Z", sortTime: new Date("2026-03-24T12:00Z"), taskWidgetStatus: "upcoming" }])).toEqual(["overdue", "upcoming"]);
    expect(getDisp([{ id: "today", due_date: "2026-03-24T12:00Z", sortTime: new Date("2026-03-24T12:00Z"), taskWidgetStatus: "upcoming" }], [{ id: "future", due_date: "2026-03-28T12:00Z" }])).toEqual(["today"]);
  });

  it("sorts display candidates tightly", () => {
    const list = getTaskWidgetDisplayList([], now, [{ id: "u2", due_date: "2026-03-24T12:00Z", taskWidgetStatus: "upcoming" }, { id: "u1", due_date: "2026-03-24T10:00Z", taskWidgetStatus: "upcoming" }, { id: "u3", due_date: "2026-03-24T10:00Z", taskWidgetStatus: "upcoming" }]);
    expect(list.map(t => t.id)).toContain("u1");
    expect(getTaskWidgetDisplayList([], now, [{ id: "named", title: "Named", due_date: "2026-03-24T10:00Z", taskWidgetStatus: "upcoming" }, { id: "untitled", due_date: "2026-03-24T10:00Z", taskWidgetStatus: "upcoming" }]).map(t => t.id)).toContain("untitled");
  });

  it("calculates widget percentages and counts securely", () => {
    expect(getTaskWidgetDueTodayCount(null, now)).toBe(0);
    expect(getTaskWidgetDueTodayCount([{ completed: false }], now)).toBe(0);
    expect(getTaskWidgetCompletedCount(null)).toBe(0);
    expect(getTaskWidgetSpineCompletedPct([], 0)).toBe(0);
  });

  it("suppresses today free window tracking out of bounds", () => {
    isTodayMock.mockReturnValue(false);
    expect(getTodayFreeWindows(now, [{ id: 1 }])).toEqual([]);
    isTodayMock.mockReturnValue(true);
    getAllFreeWindowsTodayMock.mockReturnValue([{ start: 10, end: 11, minutes: 10 }]);
    expect(getTodayFreeWindows(now, [{ id: 1 }])).toEqual([]);
  });

  it("handles complex recommendation logic falls safely", () => {
    expect(getHomepageRecommendation(null, null, null)).toBeNull();
    expect(getHomepageRecommendation([{ id: 10, title: "Empty key task", completed: false }], [{ id: 11, title: "Deadline only", start_due_date: "2026-03-28T20:00Z" }], null)).toEqual({ meta: "Module · due in 4d", taskTitle: "Empty key task", text: "Focus on Empty key task for Deadline only." });
    expect(getHomepageRecommendation([{ id: 11, title: "Sort deadlines", completed: false }], [{ id: 12, start_due_date: "2026-03-29T20:00Z" }, { id: 13, title: "Sooner deadline", start_due_date: "2026-03-25T20:00Z" }], null)).toEqual({ meta: "Module · due tomorrow", taskTitle: "Sort deadlines", text: "Focus on Sort deadlines for Sooner deadline." });
    expect(getHomepageRecommendation([{ id: 8, title: "No window yet", completed: false }], [], null)).toBeNull();
  });
});
