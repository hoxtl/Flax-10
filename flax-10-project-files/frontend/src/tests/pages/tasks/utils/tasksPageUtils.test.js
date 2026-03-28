/*
 * Tests for Tasks tasksPageUtils helpers.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createFnMap } from "../../../utils/testBuilderUtils";
import {
  getTodayEndISO,
  getTomorrowEndISO,
  filterTasksByListAndFilter,
  buildTasksPageHandlers,
  buildTasksPageViewProps,
} from "../../../../pages/tasks/utils/tasksPageUtils";

const baseTasks = [
  { id: 1, task_list: "1", completed: false, due_date: "2026-03-15T12:00:00" },
  { id: 2, task_list: "1", completed: false, due_date: "2026-03-10T10:00:00" },
  { id: 3, task_list: "2", completed: false, due_date: "2026-03-20T10:00:00" },
];
const TASK_STATE_SETTERS = [
  "setActiveListId",
  "setActiveFilter",
  "setFilterListIds",
  "setShowListModal",
  "setShowTaskModal",
  "setTaskModalDueDate",
  "setToastUndo",
  "setToastDelete",
  "setToastInfo",
  "setShowCreateListFromTask",
  "setLastCreatedListId",
];

function withFakeTime(date, run) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
  try {
    run();
  } finally {
    vi.useRealTimers();
  }
}

function createTasksPageState(overrides = {}) {
  return {
    activeListId: 4,
    activeFilter: "today",
    showTaskModal: true,
    taskModalDueDate: "2026-03-10T12:00:00Z",
    toastUndo: null,
    toastDelete: false,
    toastInfo: null,
    showListModal: true,
    showCreateListFromTask: true,
    lastCreatedListId: 8,
    ...createFnMap(TASK_STATE_SETTERS),
    ...overrides,
  };
}

function createListsApi(overrides = {}) {
  return {
    lists: [{ id: 4, name: "Inbox" }],
    archivedLists: [],
    loading: false,
    addList: vi.fn().mockResolvedValue({ id: 12, name: "New List" }),
    ...createFnMap(["renameList", "removeList", "restoreList", "permanentlyDeleteList"]),
    ...overrides,
  };
}

function createTasksApi(addTask, overrides = {}) {
  return {
    tasks: [],
    initialLoading: false,
    addTask,
    ...createFnMap(["removeTask", "editTask", "toggleComplete", "reload"]),
    ...overrides,
  };
}

function makeMocks(addTask = vi.fn().mockResolvedValue({ id: 45, title: "Saved task" })) {
  return {
    state: createTasksPageState(),
    listsApi: createListsApi(),
    tasksApi: createTasksApi(addTask),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("tasksPageUtils", () => {
  it("returns ISO strings for the end of today and tomorrow", () => {
    withFakeTime(new Date(2026, 2, 10, 12, 0), () => {
      const todayIso = getTodayEndISO();
      expect(todayIso).toMatch(/2026-03-10/);
      expect(new Date(todayIso).getHours()).toBe(23);
      expect(new Date(todayIso).getMinutes()).toBe(59);
    });

    withFakeTime(new Date(2026, 2, 10), () => {
      const tomorrowIso = getTomorrowEndISO();
      expect(tomorrowIso).toMatch(/2026-03-11/);
      expect(new Date(tomorrowIso).getHours()).toBe(23);
      expect(new Date(tomorrowIso).getMinutes()).toBe(59);
    });
  });

  describe("filterTasksByListAndFilter", () => {
    it("filters by activeListId and filterListIds", () => {
      expect(filterTasksByListAndFilter(baseTasks, "1", "all", null)).toHaveLength(2);
      expect(filterTasksByListAndFilter(baseTasks, null, "all", ["2"])).toEqual([baseTasks[2]]);
      expect(filterTasksByListAndFilter(baseTasks, null, "all", null)).toHaveLength(3);
    });

    it("filters overdue and today tasks", () => {
      withFakeTime(new Date(2026, 2, 12), () => {
        const overdueTasks = [
          ...baseTasks,
          { id: 4, task_list: "1", completed: false, due_date: "2026-03-09T12:00:00" },
        ];
        expect(filterTasksByListAndFilter(overdueTasks, null, "overdue", null).some((task) => task.id === 4)).toBe(true);
      });

      withFakeTime(new Date(2026, 2, 10, 0, 0), () => {
        expect(filterTasksByListAndFilter(baseTasks, null, "today", null).some((task) => task.id === 2)).toBe(true);
      });
    });

    it("filters this week and later using date bounds", () => {
      withFakeTime(new Date(2026, 2, 10, 0, 0), () => {
        const thisWeek = filterTasksByListAndFilter(baseTasks, null, "this_week", null);
        const later = filterTasksByListAndFilter(baseTasks, null, "later", null);

        expect(thisWeek.some((task) => task.id === 1)).toBe(true);
        expect(thisWeek.some((task) => task.id === 2)).toBe(true);
        expect(later).toEqual([baseTasks[2]]);
      });
    });
  });

  describe("buildTasksPageViewProps", () => {
    it("wires modal save and close handlers, including create-list-from-task", async () => {
      const { state, listsApi, tasksApi } = makeMocks();
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], "2026-03-10T23:59:59Z", null);

      await result.taskModalProps.onSave({ title: "Saved task" });
      result.taskModalProps.onOpenCreateList();
      result.taskModalProps.onClose();
      await result.createListFromTaskProps.onSave({ name: "New List" });
      result.createListFromTaskProps.onClose();

      expect(tasksApi.addTask).toHaveBeenCalledWith({ title: "Saved task" });
      expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 45, title: "Saved task" });
      expect(state.setShowTaskModal).toHaveBeenCalledWith(false);
      expect(listsApi.addList).toHaveBeenCalledWith({ name: "New List" });
      expect(state.setLastCreatedListId).toHaveBeenCalledWith(12);
    });

    it("skips undo toasts when task creation returns nothing", async () => {
      const { state, listsApi, tasksApi } = makeMocks(vi.fn().mockResolvedValue(null));
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], null, null);

      await result.feedProps.onAddTask({ title: "Ghost task" });
      expect(state.setToastUndo).not.toHaveBeenCalled();

      await result.taskModalProps.onSave({ title: "Ghost task" });
      expect(state.setToastUndo).toHaveBeenCalledWith(null);
    });
  });
});
