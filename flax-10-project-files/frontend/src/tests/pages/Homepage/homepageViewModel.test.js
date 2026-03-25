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

  it("covers homepage view-model fallback branches and recommendation edges", () => {
    const now = new Date("2026-03-24T09:00:00.000Z");

    expect(getEnrolledModules(null, [1], () => true)).toEqual([]);
    expect(getTomorrowFirstEvent(null, new Date("2026-03-24T09:00:00.000Z"))).toBeNull();

    overlapsDayMock.mockReturnValue(false);
    expect(
      getTomorrowFirstEvent(
        [{ id: 1, start_time: "2026-03-25T09:00:00.000Z" }],
        new Date("2026-03-24T09:00:00.000Z"),
      ),
    ).toBeNull();
    overlapsDayMock.mockReturnValue(true);

    expect(
      getTaskCategoryPillMeta(
        { list_name: "none", task_list: 4, module: 5 },
        [{ id: 4, name: "none" }],
        [{ id: 5, module_name: "History" }],
      ),
    ).toEqual({ label: "History", listId: null });
    expect(
      getTaskCategoryPillMeta(
        { moduleId: 6 },
        [],
        [{ id: 6 }],
      ),
    ).toEqual({ label: "M6", listId: null });
    expect(getTaskCategoryPillMeta({ tag: 7 }, null, null)).toBeNull();
    expect(getTaskCategoryColor({ module_code: "CS101" }, () => null)).toBe("sage");
    expect(
      getHomepageRecommendation(
        [{ id: 6, title: "Module-code match", module_code: "BIO", completed: false }],
        [{ module_code: "BIO", title: "Biology notes", start_due_date: "2026-03-25T20:00:00.000Z" }],
      ),
    ).toEqual({
      meta: "BIO · due tomorrow",
      taskTitle: "Module-code match",
      text: "Focus on Module-code match for Biology notes.",
    });

    expect(getSortedEvents(null)).toEqual([]);
    expect(getSortedEvents([{ id: 10, start_time: "2026-03-24T09:00:00.000Z" }])).toEqual([
      { id: 10, start_time: "2026-03-24T09:00:00.000Z" },
    ]);
    expect(getSortedEvents([{ id: 9, title: "Lunch" }])).toEqual([{ id: 9, title: "Lunch" }]);
    isNowMock.mockReturnValue(true);
    expect(
      getPastItems(
        [{ id: 1, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }],
        new Date("2026-03-24T10:00:00.000Z"),
      ),
    ).toEqual([]);
    isNowMock.mockReturnValue(false);
    expect(getPastItems(null, new Date("2026-03-24T10:00:00.000Z"))).toEqual([]);
    expect(Array.from(getPastIdsShownInTimeline(null, null))).toEqual([]);
    expect(getUpcomingItems(null, [])).toEqual([]);
    expect(getUpcomingItems([{ id: 30, title: "Later" }], null)).toEqual([{ id: 30, title: "Later" }]);
    expect(
      Array.from(
        getPastIdsShownInTimeline(
          [{ id: 10, start_time: "2026-03-24T08:00:00.000Z" }],
          [{ id: 11, start_time: "2026-03-24T08:30:00.000Z" }],
        ),
      ),
    ).toEqual([]);
    expect(
      Array.from(
        getPastIdsShownInTimeline(
          [{ id: 14, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }],
          [{ id: 15, start_time: "2026-03-24T08:30:00.000Z" }],
        ),
      ),
    ).toEqual([14]);
    expect(
      Array.from(
        getPastIdsShownInTimeline(
          [{ id: 12, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" }],
          null,
        ),
      ),
    ).toEqual([]);
    expect(getMissedItems(now, null, new Set())).toEqual([]);
    expect(getSuggestableTasks(null, [{ title: "Essay" }])).toEqual([]);
    expect(getSuggestableTasks([{ id: 6, title: "Essay" }], null)).toEqual([{ id: 6, title: "Essay" }]);
    expect(getSuggestableTasks([{ id: 4, title: "Essay" }], [{ id: 5 }])).toEqual([{ id: 4, title: "Essay" }]);
    expect(getTasksDueToday(null, now)).toEqual([]);
    expect(getTasksDueToday([{ id: 7, completed: false }], now)).toEqual([]);

    expect(
      getDeadlineSuggestions(
        now,
        [{ id: 4, title: "Soon", start_due_date: "2026-03-25T12:00:00.000Z" }],
        [{}],
        now.getTime(),
      ),
    ).toEqual([{ id: 4, title: "Soon", start_due_date: "2026-03-25T12:00:00.000Z" }]);
    expect(
      getDeadlineSuggestions(
        now,
        [
          { id: 1, module_code: "BIO", start_due_date: "2026-03-25T12:00:00.000Z" },
          { id: 2, title: "No due date" },
          { id: 3, module_code: "CHEM", start_due_date: "2026-04-20T12:00:00.000Z" },
        ],
        [{ id: 44, title: "BIO quiz prep" }],
        now.getTime(),
      ),
    ).toEqual([]);
    expect(
      getDeadlineSuggestions(
        now,
        [
          { id: 6, title: "Second", start_due_date: "2026-03-27T12:00:00.000Z" },
          { id: 7, title: "First", start_due_date: "2026-03-25T12:00:00.000Z" },
        ],
        null,
        now.getTime(),
      ).map((deadline) => deadline.id),
    ).toEqual([7, 6]);
    isTodayMock.mockReturnValue(false);
    expect(getDeadlineSuggestions(now, [{ id: 8, start_due_date: "2026-03-25T12:00:00.000Z" }], [], now.getTime())).toEqual([]);
    isTodayMock.mockReturnValue(true);
    expect(getDeadlineSuggestions(now, null, [], now.getTime())).toEqual([]);
    expect(
      getDeadlineSuggestions(
        now,
        [{ id: 5, assessment_title: "Essay plan", start_due_date: "2026-03-25T12:00:00.000Z" }],
        [{ id: 77, title: "essay pl review" }],
        now.getTime(),
      ),
    ).toEqual([]);
    expect(getOverdueTasksForNow(null, () => null, now)).toEqual([]);
    isRoutineOrEventTaskMock.mockImplementation((task) => task.title === "Routine");
    expect(
      getOverdueTasksForNow(
        [
          { id: 20, title: "Routine", completed: false, due_date: "2026-03-23T08:00:00.000Z" },
          { id: 21, title: "Essay", completed: false, due_date: "2026-03-23T07:00:00.000Z" },
          { id: 22, title: "Essay 2", completed: false, due_date: "2026-03-23T06:00:00.000Z" },
        ],
        () => null,
        now,
      ).map((task) => task.id),
    ).toEqual([22, 21]);
    isRoutineOrEventTaskMock.mockReturnValue(false);

    expect(getTaskWidgetList(null, now)).toEqual([]);
    expect(getTaskWidgetList([{ id: 2, title: "No due date", completed: false }], now)).toEqual([]);
    expect(
      getTaskWidgetList(
        [{ id: 1, title: "Done", completed: true, due_date: "2026-03-24T11:00:00.000Z", priority: "low" }],
        now,
      ),
    ).toEqual([
      expect.objectContaining({
        id: 1,
        taskWidgetStatus: "completed",
      }),
    ]);

    const fiveShownItems = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      title: `Task ${index + 1}`,
      completed: false,
      due_date: "2026-03-24T10:00:00.000Z",
      sortTime: new Date("2026-03-24T10:00:00.000Z"),
      taskWidgetStatus: "upcoming",
      priority: "medium",
    }));
    expect(getTaskWidgetDisplayList([], now, fiveShownItems)).toEqual(fiveShownItems);
    expect(getTaskWidgetDisplayList([], now)).toEqual([]);
    expect(
      getTaskWidgetDisplayList(
        null,
        now,
        [
          { id: "overdue", title: "Overdue", completed: false, due_date: "2026-03-24T08:00:00.000Z", sortTime: "2026-03-24T08:00:00.000Z", taskWidgetStatus: "overdue", priority: "medium" },
          { id: "upcoming", title: "Upcoming", completed: false, due_date: "2026-03-24T12:00:00.000Z", sortTime: "2026-03-24T12:00:00.000Z", taskWidgetStatus: "upcoming", priority: "medium" },
        ],
      ).map((task) => task.id),
    ).toEqual(["overdue", "upcoming"]);
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          { id: "upcoming-first", title: "Upcoming", completed: false, due_date: "2026-03-24T12:00:00.000Z", sortTime: "2026-03-24T12:00:00.000Z", taskWidgetStatus: "upcoming", priority: "medium" },
          { id: "overdue-second", title: "Overdue", completed: false, due_date: "2026-03-24T08:00:00.000Z", sortTime: "2026-03-24T08:00:00.000Z", taskWidgetStatus: "overdue", priority: "medium" },
        ],
      ).map((task) => task.id),
    ).toEqual(["overdue-second", "upcoming-first"]);
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          { id: "upcoming-a", title: "Upcoming A", completed: false, due_date: "2026-03-24T12:00:00.000Z", sortTime: "2026-03-24T12:00:00.000Z", taskWidgetStatus: "upcoming", priority: "medium" },
          { id: "overdue-a", title: "Overdue A", completed: false, due_date: "2026-03-24T08:00:00.000Z", sortTime: "2026-03-24T08:00:00.000Z", taskWidgetStatus: "overdue", priority: "medium" },
          { id: "upcoming-b", title: "Upcoming B", completed: false, due_date: "2026-03-24T13:00:00.000Z", sortTime: "2026-03-24T13:00:00.000Z", taskWidgetStatus: "upcoming", priority: "medium" },
        ],
      ).slice(0, 2).map((task) => task.id),
    ).toEqual(["overdue-a", "upcoming-a"]);
    expect(getTaskWidgetDisplayList([], now, null)).toEqual([]);

    const sortedDisplay = getTaskWidgetDisplayList(
      [
        { id: 90, title: "Future filler", completed: false, due_date: "2026-03-30T09:00:00.000Z", priority: "urgent" },
        { id: 91, title: "Invalid filler", completed: false, due_date: "invalid-date", priority: "low" },
      ],
      now,
      [
        { id: "a", title: "Zed overdue", completed: false, due_date: "2026-03-24T08:00:00.000Z", sortTime: "bad-time", taskWidgetStatus: "overdue", priority: "mystery" },
        { id: "b", title: "Alpha overdue", completed: false, due_date: "2026-03-24T08:00:00.000Z", sortTime: "bad-time", taskWidgetStatus: "overdue", priority: "mystery" },
      ],
    );
    expect(sortedDisplay[0].title).toBe("Alpha overdue");
    expect(sortedDisplay[1].title).toBe("Zed overdue");
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          {
            id: "o2",
            title: "Later overdue",
            completed: false,
            due_date: "2026-03-24T09:00:00.000Z",
            sortTime: "2026-03-24T09:00:00.000Z",
            taskWidgetStatus: "overdue",
            priority: "medium",
          },
          {
            id: "o1",
            title: "Earlier overdue",
            completed: false,
            due_date: "2026-03-24T07:00:00.000Z",
            sortTime: "2026-03-24T07:00:00.000Z",
            taskWidgetStatus: "overdue",
            priority: "medium",
          },
        ],
      ).map((task) => task.id),
    ).toEqual(["o1", "o2"]);
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          { id: "u2", title: "Later upcoming", completed: false, due_date: "2026-03-24T12:00:00.000Z", sortTime: "2026-03-24T12:00:00.000Z", taskWidgetStatus: "upcoming" },
          { id: "u1", title: "Sooner upcoming", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
          { id: "u3", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
        ],
      ).map((task) => task.id),
    ).toEqual(["u3", "u1", "u2"]);
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          { id: "named", title: "Named", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
          { id: "untitled", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
        ],
      ).map((task) => task.id),
    ).toEqual(["untitled", "named"]);
    expect(
      getTaskWidgetDisplayList(
        [],
        now,
        [
          { id: "empty-1", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
          { id: "empty-2", completed: false, due_date: "2026-03-24T10:00:00.000Z", sortTime: "2026-03-24T10:00:00.000Z", taskWidgetStatus: "upcoming" },
        ],
      ).map((task) => task.id),
    ).toEqual(["empty-1", "empty-2"]);
    expect(
      getTaskWidgetDisplayList(
        [
          { id: 40, completed: false, due_date: "2026-03-26T09:00:00.000Z" },
          { id: 41, completed: false, due_date: "2026-03-26T09:00:00.000Z" },
        ],
        now,
        [],
      ).map((task) => task.id),
    ).toEqual([40, 41]);

    expect(getTaskWidgetDueTodayCount(null, now)).toBe(0);
    expect(getTaskWidgetDueTodayCount([{ completed: false }], now)).toBe(0);
    expect(getTaskWidgetCompletedCount(null)).toBe(0);
    expect(getTaskWidgetSpineCompletedPct([], 0)).toBe(0);

    isTodayMock.mockReturnValue(false);
    expect(getTodayFreeWindows(now, [{ id: 1 }])).toEqual([]);
    isTodayMock.mockReturnValue(true);
    getAllFreeWindowsTodayMock.mockReturnValue([{ start: 10, end: 11, minutes: 10 }]);
    expect(getTodayFreeWindows(now, [{ id: 1 }])).toEqual([]);

    expect(getHomepageRecommendation(null, null, null)).toBeNull();
    expect(
      getHomepageRecommendation(
        [{ id: 10, title: "Empty key task", completed: false }],
        [{ id: 11, title: "Deadline only", start_due_date: "2026-03-28T20:00:00.000Z" }],
        null,
      ),
    ).toEqual({
      meta: "Module · due in 4d",
      taskTitle: "Empty key task",
      text: "Focus on Empty key task for Deadline only.",
    });
    expect(
      getHomepageRecommendation(
        [{ id: 11, title: "Sort deadlines", completed: false }],
        [
          { id: 12, title: "Later deadline", start_due_date: "2026-03-29T20:00:00.000Z" },
          { id: 13, title: "Sooner deadline", start_due_date: "2026-03-25T20:00:00.000Z" },
        ],
        null,
      ),
    ).toEqual({
      meta: "Module · due tomorrow",
      taskTitle: "Sort deadlines",
      text: "Focus on Sort deadlines for Sooner deadline.",
    });
    expect(getHomepageRecommendation([{ id: 9, title: "No window yet", completed: false }], null, "20m")).toEqual({
      meta: "Best task to move next",
      taskTitle: "No window yet",
      text: "Use the 20m window to move No window yet forward.",
    });
    expect(
      getHomepageRecommendation(
        [{ id: 7, title: "Plan module work", module: 8, completed: false }],
        [{ module: 8, start_due_date: "2026-03-24T20:00:00.000Z" }],
      ),
    ).toEqual({
      meta: "Module · due today",
      taskTitle: "Plan module work",
      text: "Focus on Plan module work for upcoming deadline.",
    });
    expect(
      getHomepageRecommendation(
        [{ id: 8, title: "No window yet", completed: false }],
        [],
        null,
      ),
    ).toBeNull();
    expect(
      getHomepageRecommendation(
        [{ id: 12, title: "Unmatched", module_code: "ZZZ", completed: false }],
        [{ module_code: "BIO", start_due_date: "2026-03-25T20:00:00.000Z" }],
        null,
      ),
    ).toBeNull();
  });
});
