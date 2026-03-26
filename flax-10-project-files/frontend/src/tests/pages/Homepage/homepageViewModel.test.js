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

const defaultNow = new Date("2026-03-24T09:00:00.000Z");

const buildWidgetTasks = () => ([
  { id: 1, title: "Morning reading", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "high", estimated_blocks: 2 },
  { id: 2, title: "Evening admin", completed: false, due_date: "2026-03-24T18:00:00.000Z", priority: "urgent" },
  { id: 3, title: "Done task", completed: true, due_date: "2026-03-24T12:00:00.000Z", priority: "low" },
]);

describe("homepageViewModel helpers", () => {
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

  describe("module and category helpers", () => {
    it("filters enrolled modules when predicate returns true", () => {
      const predicate = (moduleId, enrollments) => enrollments.includes(moduleId);
      expect(
        getEnrolledModules(
          [{ id: 1, name: "A" }, { id: 2, name: "B" }],
          [2],
          predicate,
        ),
      ).toEqual([{ id: 2, name: "B" }]);
    });

    it("finds the earliest event scheduled for tomorrow", () => {
      const tomorrowEvents = [
        { id: 2, start_time: "2026-03-25T11:00:00.000Z", end_time: "2026-03-25T12:00:00.000Z" },
        { id: 1, start_time: "2026-03-25T09:00:00.000Z", end_time: "2026-03-25T10:00:00.000Z" },
      ];
      expect(getTomorrowFirstEvent(tomorrowEvents, defaultNow)).toEqual(tomorrowEvents[1]);
    });

    describe("task category pill metadata", () => {
      const lists = [{ id: 4, name: "Inbox" }];
      const modules = [{ id: 9, module_code: "CS101" }];
      const lookup = () => ({ label: "Academic" });

      it("prefers the row list_name when available", () => {
        expect(
          getTaskCategoryPillMeta({ task_list: 4, list_name: "Deep Work" }, lists, modules, lookup),
        ).toEqual({ label: "Deep Work", listId: "4" });
      });

      it("falls back to list metadata when only the id is provided", () => {
        expect(getTaskCategoryPillMeta({ task_list: 4 }, lists, modules, lookup)).toEqual({
          label: "Inbox",
          listId: "4",
        });
      });

      it("uses module metadata when module_id is present", () => {
        expect(getTaskCategoryPillMeta({ module_id: 9 }, [], modules, lookup)).toEqual({
          label: "CS101",
          listId: null,
        });
      });

      it("falls back to module code or tag label when no metadata matches", () => {
        expect(getTaskCategoryPillMeta({ module_code: "PHYS999" }, [], [], () => null)).toEqual({
          label: "PHYS999",
          listId: null,
        });
        expect(getTaskCategoryPillMeta({ tag: 7 }, [], [], () => ({ label: "Personal" }))).toEqual({
          label: "Personal",
          listId: null,
        });
      });

      it("returns null when no pill metadata can be derived", () => {
        expect(getTaskCategoryPillMeta({}, [], [], () => null)).toBeNull();
      });
    });

    it("maps task category labels to the correct colors", () => {
      expect(getTaskCategoryColor({ tag: 1 }, () => ({ label: "Academic Focus" }))).toBe("sage");
      expect(getTaskCategoryColor({ tag: 2 }, () => ({ label: "Personal Errands" }))).toBe("flax");
      expect(getTaskCategoryColor({ module_id: 3 }, () => ({ label: "Other" }))).toBe("sage");
      expect(getTaskCategoryColor({}, () => ({ label: "Other" }))).toBe("flax");
    });
  });

  describe("timeline filtering and deadlines", () => {
    it("sorts events and removes duplicates by title", () => {
      const sorted = getSortedEvents([
        { id: 1, title: "Breakfast", start_time: "2026-03-24T08:00:00.000Z" },
        { id: 2, title: "breakfast", start_time: "2026-03-24T08:30:00.000Z" },
        { id: 3, title: "Lecture", start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      ]);
      expect(sorted.map((event) => event.id)).toEqual([1, 3]);
    });

    it("splits events into past and upcoming buckets", () => {
      const pastItems = getPastItems(
        [
          { id: 1, start_time: "2026-03-24T07:00:00.000Z", end_time: "2026-03-24T08:00:00.000Z" },
          { id: 2, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        ],
        new Date("2026-03-24T09:30:00.000Z"),
      );
      expect(pastItems.map((event) => event.id)).toEqual([1]);
      expect(getUpcomingItems([{ id: 1 }, { id: 2 }], pastItems)).toEqual([{ id: 2 }]);
    });

    it("tracks which past ids should remain visible in the timeline", () => {
      const ids = Array.from(
        getPastIdsShownInTimeline(
          [{ id: 1, start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T10:15:00.000Z" }],
          [{ id: 2, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }],
        ),
      );
      expect(ids).toEqual([1]);
    });

    it("filters missed items to manual entries for the current day", () => {
      const missed = getMissedItems(
        defaultNow,
        [{ id: 1, source: "manual" }, { id: 2, source: "module_deadline" }],
        new Set([1]),
      );
      expect(missed).toEqual([]);
    });

    it("returns no missed items when the date is not today", () => {
      isTodayMock.mockReturnValue(false);
      expect(getMissedItems(new Date("2026-03-25T09:00:00.000Z"), [{ id: 3 }], new Set())).toEqual([]);
    });

    it("filters suggestable tasks that already match scheduled titles", () => {
      expect(
        getSuggestableTasks(
          [{ id: 1, title: "Essay" }, { id: 2, title: "Read" }],
          [{ id: 9, title: "essay" }],
        ),
      ).toEqual([{ id: 2, title: "Read" }]);
    });

    it("collects tasks due today based on the provided date", () => {
      const dueIds = getTasksDueToday(
        [
          { id: 1, completed: false, due_date: "2026-03-24T08:00:00.000Z" },
          { id: 2, completed: false, due_date: "2026-03-25T08:00:00.000Z" },
          { id: 3, completed: false, due_date: "2026-03-24T18:00:00.000Z" },
        ],
        defaultNow,
      ).map((task) => task.id);
      expect(dueIds).toEqual([1, 3]);
    });

    it("suggests only deadlines within the look-ahead window", () => {
      const suggestions = getDeadlineSuggestions(
        defaultNow,
        [
          { id: 1, assessment_title: "Essay", module_code: "CS101", start_due_date: "2026-03-28T12:00:00.000Z" },
          { id: 2, title: "Report", module_code: "BIO", start_due_date: "2026-04-20T12:00:00.000Z" },
          { id: 3, title: "Maths sheet", module_code: "MATH", start_due_date: "2026-03-26T12:00:00.000Z" },
        ],
        [{ id: 44, title: "Maths sheet review" }],
        defaultNow.getTime(),
      ).map((deadline) => deadline.id);
      expect(suggestions).toEqual([1]);
    });

    it("ignores routine tasks when computing overdue items for now", () => {
      isRoutineOrEventTaskMock.mockImplementation((task) => task.title === "Routine");
      const overdue = getOverdueTasksForNow(
        [
          { id: 1, title: "Essay", completed: false, due_date: "2026-03-23T10:00:00.000Z" },
          { id: 2, title: "Routine", completed: false, due_date: "2026-03-23T11:00:00.000Z" },
        ],
        () => ({ label: "Routine" }),
        defaultNow,
      );
      expect(overdue).toEqual([{ id: 1, title: "Essay", completed: false, due_date: "2026-03-23T10:00:00.000Z" }]);
    });
  });

  describe("task widget ordering", () => {
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

    describe("widget metrics and recommendations", () => {
      it("marks now status and urgent glow for tasks due soon", () => {
        const widgetList = getTaskWidgetList(buildWidgetTasks(), defaultNow);
        expect(widgetList[0]).toMatchObject({ id: 1, taskWidgetStatus: "now" });
        expect(widgetList.find((task) => task.taskWidgetUrgentGlow)).toMatchObject({ id: 1 });
      });

      it("prioritizes overdue and upcoming fillers before already shown tasks", () => {
        const displayList = getTaskWidgetDisplayList(
          [
            { id: 1, title: "Already shown", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "urgent" },
            { id: 2, title: "Overdue filler", completed: false, due_date: "2026-03-23T09:00:00.000Z", priority: "high" },
            { id: 3, title: "Upcoming filler", completed: false, due_date: "2026-03-26T09:00:00.000Z", priority: "medium" },
            { id: 4, title: "No due date", completed: false, priority: "low" },
          ],
          defaultNow,
          [{ id: 1, title: "Already shown", completed: false, due_date: "2026-03-24T09:30:00.000Z", priority: "urgent" }],
        );
        expect(displayList.slice(0, 3).map((task) => task.title)).toEqual([
          "Overdue filler",
          "Upcoming filler",
          "Already shown",
        ]);
      });

      it("computes due counts, completion counts, and progress pct", () => {
        const widgetList = getTaskWidgetList(buildWidgetTasks(), defaultNow);
        expect(getTaskWidgetDueTodayCount(widgetList, defaultNow)).toBe(2);
        expect(getTaskWidgetCompletedCount(widgetList)).toBe(1);
        expect(getTaskWidgetSpineCompletedPct(widgetList, 1)).toBeCloseTo(33.333, 3);
      });

      it("filters today free windows and formats their labels", () => {
        getAllFreeWindowsTodayMock.mockReturnValue([
          { start: 5, end: 6, minutes: 15 },
          { start: 2, end: 3, minutes: 90 },
          { start: 1, end: 2, minutes: 45 },
        ]);
        expect(getTodayFreeWindows(defaultNow, [{ id: 1 }])).toEqual([
          { start: 1, end: 2, minutes: 45 },
          { start: 2, end: 3, minutes: 90 },
        ]);
        expect(getFreeWindowLabel([{ minutes: 45 }])).toBe("45m");
        expect(getFreeWindowLabel([{ minutes: 120 }])).toBe("2h");
        expect(getFreeWindowLabel([{ minutes: 125 }])).toBe("2h 5m");
        expect(getFreeWindowLabel([])).toBeNull();
      });

      it("builds module-based homepage recommendations when deadlines match", () => {
        const recommendation = getHomepageRecommendation(
          [{ id: 1, title: "Prep report", module_id: 7, completed: false }],
          [{ module_id: 7, module_code: "CS101", assessment_title: "Report", start_due_date: "2026-03-25T10:00:00.000Z" }],
          "45m",
        );
        expect(recommendation).toEqual({
          meta: "CS101 · due tomorrow",
          taskTitle: "Prep report",
          text: "Focus on Prep report for Report.",
        });
      });

      it("falls back to generic recommendations when no deadline data exists", () => {
        const recommendation = getHomepageRecommendation(
          [{ id: 2, title: "Tidy notes", completed: false }],
          [],
          "30m",
        );
        expect(recommendation).toEqual({
          meta: "Best task to move next",
          taskTitle: "Tidy notes",
          text: "Use the 30m window to move Tidy notes forward.",
        });
      });

      it("delegates navigator data lookup to getNavigatorContext", () => {
        const data = getNavigatorData(defaultNow, defaultNow, [{ id: 9 }]);
        expect(data).toEqual({ state: "gap", nextItem: null });
        expect(getNavigatorContextMock).toHaveBeenCalledWith(
          defaultNow,
          defaultNow,
          [{ id: 9 }],
          expect.any(Function),
        );
      });
    });
  });


});
