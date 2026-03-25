import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAllFreeWindowsTodayMock = vi.fn();
const getNavigatorContextMock = vi.fn();
const isNowMock = vi.fn();
const isRoutineOrEventTaskMock = vi.fn();
const isTodayMock = vi.fn();
const overlapsDayMock = vi.fn();

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
  overlapsDay: (...args) => overlapsDayMock(...args),
}));

vi.mock("../../../pages/Homepage/utils/index", () => ({
  getAllFreeWindowsToday: (...args) => getAllFreeWindowsTodayMock(...args),
  getNavigatorContext: (...args) => getNavigatorContextMock(...args),
  isNow: (...args) => isNowMock(...args),
  isRoutineOrEventTask: (...args) => isRoutineOrEventTaskMock(...args),
}));

import {
  getDeadlineSuggestions,
  getEnrolledModules,
  getFreeWindowLabel,
  getHomepageRecommendation,
  getMissedItems,
  getNavigatorData,
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
} from "../../../pages/Homepage/utils/homepageViewModel";

function buildTask(id, title, dueDate, priority = "medium") {
  return {
    id,
    title,
    completed: false,
    due_date: dueDate,
    priority,
  };
}

describe("homepageViewModel task widget ordering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T09:00:00.000Z"));
    getAllFreeWindowsTodayMock.mockReset();
    getNavigatorContextMock.mockReset();
    isNowMock.mockReset();
    isRoutineOrEventTaskMock.mockReset();
    isTodayMock.mockReset();
    overlapsDayMock.mockReset();
    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
    isNowMock.mockReturnValue(false);
    isRoutineOrEventTaskMock.mockReturnValue(false);
    getNavigatorContextMock.mockReturnValue({ state: "gap", nextItem: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers module, list, tag, and tomorrow-event helpers", () => {
    expect(
      getEnrolledModules(
        [{ id: 1, name: "A" }, { id: 2, name: "B" }],
        [2],
        (moduleId, enrollments) => enrollments.includes(moduleId),
      ),
    ).toEqual([{ id: 2, name: "B" }]);

    expect(
      getTomorrowFirstEvent(
        [
          { id: 2, start_time: "2026-03-25T11:00:00.000Z", end_time: "2026-03-25T12:00:00.000Z" },
          { id: 1, start_time: "2026-03-25T09:00:00.000Z", end_time: "2026-03-25T10:00:00.000Z" },
        ],
        new Date("2026-03-24T09:00:00.000Z"),
      ),
    ).toEqual({ id: 1, start_time: "2026-03-25T09:00:00.000Z", end_time: "2026-03-25T10:00:00.000Z" });

    expect(
      getTaskCategoryPillMeta(
        { task_list: 4, list_name: "Deep Work" },
        [{ id: 4, name: "Inbox" }],
        [{ id: 9, module_code: "CS101" }],
        () => ({ label: "Academic" }),
      ),
    ).toEqual({ label: "Deep Work", listId: "4" });

    expect(
      getTaskCategoryPillMeta(
        { task_list: 4 },
        [{ id: 4, name: "Inbox" }],
        [{ id: 9, module_code: "CS101" }],
        () => ({ label: "Academic" }),
      ),
    ).toEqual({ label: "Inbox", listId: "4" });

    expect(
      getTaskCategoryPillMeta(
        { module_id: 9 },
        [],
        [{ id: 9, module_code: "CS101" }],
        () => ({ label: "Academic" }),
      ),
    ).toEqual({ label: "CS101", listId: null });

    expect(getTaskCategoryPillMeta({ module_code: "PHYS999" }, [], [], () => null)).toEqual({
      label: "PHYS999",
      listId: null,
    });

    expect(
      getTaskCategoryPillMeta({ tag: 7 }, [], [], () => ({ label: "Personal" })),
    ).toEqual({ label: "Personal", listId: null });
    expect(getTaskCategoryPillMeta({}, [], [], () => null)).toBeNull();

    expect(getTaskCategoryColor({ tag: 1 }, () => ({ label: "Academic Focus" }))).toBe("sage");
    expect(getTaskCategoryColor({ tag: 2 }, () => ({ label: "Personal Errands" }))).toBe("flax");
    expect(getTaskCategoryColor({ module_id: 3 }, () => ({ label: "Other" }))).toBe("sage");
    expect(getTaskCategoryColor({}, () => ({ label: "Other" }))).toBe("flax");
  });

  it("covers timeline filtering and deadline helpers", () => {
    const sorted = getSortedEvents([
      { id: 1, title: "Breakfast", start_time: "2026-03-24T08:00:00.000Z" },
      { id: 2, title: "breakfast", start_time: "2026-03-24T08:30:00.000Z" },
      { id: 3, title: "Lecture", start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
    ]);
    expect(sorted.map((event) => event.id)).toEqual([1, 3]);

    const pastItems = getPastItems(
      [
        { id: 1, start_time: "2026-03-24T07:00:00.000Z", end_time: "2026-03-24T08:00:00.000Z" },
        { id: 2, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
      ],
      new Date("2026-03-24T09:30:00.000Z"),
    );
    expect(pastItems.map((event) => event.id)).toEqual([1]);

    const upcomingItems = getUpcomingItems(
      [
        { id: 1, title: "Past" },
        { id: 2, title: "Upcoming" },
      ],
      pastItems,
    );
    expect(upcomingItems).toEqual([{ id: 2, title: "Upcoming" }]);

    expect(
      Array.from(
        getPastIdsShownInTimeline(
          [{ id: 1, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T10:15:00.000Z" }],
          [{ id: 2, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }],
        ),
      ),
    ).toEqual([1]);

    expect(
      getMissedItems(
        new Date("2026-03-24T09:00:00.000Z"),
        [
          { id: 1, source: "manual" },
          { id: 2, source: "module_deadline" },
        ],
        new Set([1]),
      ),
    ).toEqual([]);

    isTodayMock.mockReturnValue(false);
    expect(getMissedItems(new Date("2026-03-25T09:00:00.000Z"), [{ id: 3 }], new Set())).toEqual([]);
    isTodayMock.mockReturnValue(true);

    expect(
      getSuggestableTasks(
        [{ id: 1, title: "Essay" }, { id: 2, title: "Read" }],
        [{ id: 9, title: "essay" }],
      ),
    ).toEqual([{ id: 2, title: "Read" }]);

    expect(
      getTasksDueToday(
        [
          { id: 1, completed: false, due_date: "2026-03-24T08:00:00.000Z" },
          { id: 2, completed: false, due_date: "2026-03-25T08:00:00.000Z" },
          { id: 3, completed: false, due_date: "2026-03-24T18:00:00.000Z" },
        ],
        new Date("2026-03-24T09:00:00.000Z"),
      ).map((task) => task.id),
    ).toEqual([1, 3]);

    expect(
      getDeadlineSuggestions(
        new Date("2026-03-24T09:00:00.000Z"),
        [
          { id: 1, assessment_title: "Essay", module_code: "CS101", start_due_date: "2026-03-28T12:00:00.000Z" },
          { id: 2, title: "Report", module_code: "BIO", start_due_date: "2026-04-20T12:00:00.000Z" },
          { id: 3, title: "Maths sheet", module_code: "MATH", start_due_date: "2026-03-26T12:00:00.000Z" },
        ],
        [{ id: 44, title: "Maths sheet review" }],
        new Date("2026-03-24T09:00:00.000Z").getTime(),
      ).map((deadline) => deadline.id),
    ).toEqual([1]);

    isRoutineOrEventTaskMock.mockImplementation((task) => task.title === "Routine");
    expect(
      getOverdueTasksForNow(
        [
          { id: 1, title: "Essay", completed: false, due_date: "2026-03-23T10:00:00.000Z" },
          { id: 2, title: "Routine", completed: false, due_date: "2026-03-23T11:00:00.000Z" },
        ],
        () => ({ label: "Routine" }),
        new Date("2026-03-24T09:00:00.000Z"),
      ),
    ).toEqual([{ id: 1, title: "Essay", completed: false, due_date: "2026-03-23T10:00:00.000Z" }]);
  });

  it("sorts upcoming widget fillers by nearest due date before priority", () => {
    const now = new Date("2026-03-24T09:00:00Z");
    const tasks = [
      buildTask(1, "Due in 2 days and urgent", "2026-03-26T09:00:00Z", "urgent"),
      buildTask(2, "Due tomorrow and medium", "2026-03-25T09:00:00Z", "medium"),
      buildTask(3, "Due in 3 days and high", "2026-03-27T09:00:00Z", "high"),
    ];

    const displayList = getTaskWidgetDisplayList(tasks, now, []);

    expect(displayList.map((task) => task.title)).toEqual([
      "Due tomorrow and medium",
      "Due in 2 days and urgent",
      "Due in 3 days and high",
    ]);
  });

  it("uses priority only as a tie-breaker when due dates match", () => {
    const now = new Date("2026-03-24T09:00:00Z");
    const tasks = [
      buildTask(1, "Tomorrow medium", "2026-03-25T09:00:00Z", "medium"),
      buildTask(2, "Tomorrow urgent", "2026-03-25T09:00:00Z", "urgent"),
      buildTask(3, "Tomorrow high", "2026-03-25T09:00:00Z", "high"),
    ];

    const displayList = getTaskWidgetDisplayList(tasks, now, []);

    expect(displayList.map((task) => task.title)).toEqual([
      "Tomorrow urgent",
      "Tomorrow medium",
      "Tomorrow high",
    ]);
  });

  it("covers task widget status, counts, free-window labels, recommendations, and navigator data", () => {
    const now = new Date("2026-03-24T09:00:00.000Z");
    const widgetList = getTaskWidgetList(
      [
        { id: 1, title: "Morning reading", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "high", estimated_blocks: 2 },
        { id: 2, title: "Evening admin", completed: false, due_date: "2026-03-24T18:00:00.000Z", priority: "urgent" },
        { id: 3, title: "Done task", completed: true, due_date: "2026-03-24T12:00:00.000Z", priority: "low" },
      ],
      now,
    );

    expect(widgetList[0]).toMatchObject({
      id: 1,
      taskWidgetStatus: "now",
    });
    expect(widgetList.find((task) => task.taskWidgetUrgentGlow)).toMatchObject({
      id: 1,
      taskWidgetUrgentGlow: true,
    });

    const displayList = getTaskWidgetDisplayList(
      [
        { id: 1, title: "Already shown", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "urgent" },
        { id: 2, title: "Overdue filler", completed: false, due_date: "2026-03-23T09:00:00.000Z", priority: "high" },
        { id: 3, title: "Upcoming filler", completed: false, due_date: "2026-03-26T09:00:00.000Z", priority: "medium" },
        { id: 4, title: "No due date", completed: false, priority: "low" },
      ],
      now,
      [{ id: 1, title: "Already shown", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "urgent" }],
    );

    expect(displayList.slice(0, 3).map((task) => task.title)).toEqual([
      "Overdue filler",
      "Upcoming filler",
      "Already shown",
    ]);
    expect(getTaskWidgetDueTodayCount(widgetList, now)).toBe(2);
    expect(getTaskWidgetCompletedCount(widgetList)).toBe(1);
    expect(getTaskWidgetSpineCompletedPct(widgetList, 1)).toBeCloseTo(33.333, 3);

    getAllFreeWindowsTodayMock.mockReturnValue([
      { start: 5, end: 6, minutes: 15 },
      { start: 2, end: 3, minutes: 90 },
      { start: 1, end: 2, minutes: 45 },
    ]);
    expect(getTodayFreeWindows(new Date("2026-03-24T09:00:00.000Z"), [{ id: 1 }])).toEqual([
      { start: 1, end: 2, minutes: 45 },
      { start: 2, end: 3, minutes: 90 },
    ]);
    expect(getFreeWindowLabel([{ minutes: 45 }])).toBe("45m");
    expect(getFreeWindowLabel([{ minutes: 120 }])).toBe("2h");
    expect(getFreeWindowLabel([{ minutes: 125 }])).toBe("2h 5m");
    expect(getFreeWindowLabel([])).toBeNull();

    expect(
      getHomepageRecommendation(
        [{ id: 1, title: "Prep report", module_id: 7, completed: false }],
        [{ module_id: 7, module_code: "CS101", assessment_title: "Report", start_due_date: "2026-03-25T10:00:00.000Z" }],
        "45m",
      ),
    ).toEqual({
      meta: "CS101 · due tomorrow",
      taskTitle: "Prep report",
      text: "Focus on Prep report for Report.",
    });

    expect(
      getHomepageRecommendation(
        [{ id: 2, title: "Tidy notes", completed: false }],
        [],
        "30m",
      ),
    ).toEqual({
      meta: "Best task to move next",
      taskTitle: "Tidy notes",
      text: "Use the 30m window to move Tidy notes forward.",
    });

    expect(getNavigatorData(now, new Date("2026-03-24T09:00:00.000Z"), [{ id: 9 }])).toEqual({
      state: "gap",
      nextItem: null,
    });
    expect(getNavigatorContextMock).toHaveBeenCalledWith(
      now,
      new Date("2026-03-24T09:00:00.000Z"),
      [{ id: 9 }],
      expect.any(Function),
    );
  });
});
