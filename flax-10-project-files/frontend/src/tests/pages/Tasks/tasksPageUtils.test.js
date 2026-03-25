/*
 * Tests for Tasks tasksPageUtils: getTodayEndISO, getTomorrowEndISO,
 * filterTasksByListAndFilter, buildTasksPageHandlers, buildTasksPageViewProps.
 */

import { describe, it, expect, vi } from "vitest";
import {
  getTodayEndISO,
  getTomorrowEndISO,
  filterTasksByListAndFilter,
  buildTasksPageHandlers,
  buildTasksPageViewProps,
} from "../../../pages/Tasks/utils/tasksPageUtils";

describe("tasksPageUtils", () => {
  describe("getTodayEndISO", () => {
    it("returns ISO string with time at end of today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 12, 0));
      const iso = getTodayEndISO();
      expect(iso).toMatch(/2026-03-10/);
      expect(new Date(iso).getHours()).toBe(23);
      expect(new Date(iso).getMinutes()).toBe(59);
      vi.useRealTimers();
    });
  });

  describe("getTomorrowEndISO", () => {
    it("returns ISO string for end of tomorrow", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const iso = getTomorrowEndISO();
      expect(iso).toMatch(/2026-03-11/);
      expect(new Date(iso).getHours()).toBe(23);
      vi.useRealTimers();
    });
  });

  describe("filterTasksByListAndFilter", () => {
    const tasks = [
      { id: 1, task_list: "1", completed: false, due_date: "2026-03-15T12:00:00" },
      { id: 2, task_list: "1", completed: false, due_date: "2026-03-10T10:00:00" },
      { id: 3, task_list: "2", completed: false, due_date: "2026-03-20T10:00:00" },
    ];

    it("filters by activeListId when set", () => {
      const out = filterTasksByListAndFilter(tasks, "1", "all", null);
      expect(out).toHaveLength(2);
      expect(out.every((t) => t.task_list === "1")).toBe(true);
    });

    it("filters by filterListIds when provided", () => {
      const out = filterTasksByListAndFilter(tasks, null, "all", ["2"]);
      expect(out).toHaveLength(1);
      expect(out[0].task_list).toBe("2");
    });

    it("returns all when no list filter and all filter", () => {
      const out = filterTasksByListAndFilter(tasks, null, "all", null);
      expect(out).toHaveLength(3);
    });

    it("filters overdue when activeFilter is overdue", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 12));
      const withOverdue = [
        ...tasks,
        { id: 4, task_list: "1", completed: false, due_date: "2026-03-09T12:00:00" },
      ];
      const out = filterTasksByListAndFilter(withOverdue, null, "overdue", null);
      expect(out.some((t) => t.id === 4)).toBe(true);
      vi.useRealTimers();
    });

    it("filters today when activeFilter is today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 0, 0));
      const out = filterTasksByListAndFilter(tasks, null, "today", null);
      expect(out.some((t) => t.id === 2)).toBe(true);
      vi.useRealTimers();
    });

    it("filters this week and later based on date bounds", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 0, 0));

      const thisWeek = filterTasksByListAndFilter(tasks, null, "this_week", null);
      const later = filterTasksByListAndFilter(tasks, null, "later", null);

      expect(thisWeek.some((t) => t.id === 1)).toBe(true);
      expect(thisWeek.some((t) => t.id === 2)).toBe(true);
      expect(later).toEqual([{ id: 3, task_list: "2", completed: false, due_date: "2026-03-20T10:00:00" }]);
      vi.useRealTimers();
    });
  });

  describe("filterTasksByListAndFilter", () => {
    const tasks = [
      { id: 1, task_list: "1", completed: false, due_date: "2026-03-15T12:00:00" },
      { id: 2, task_list: "1", completed: false, due_date: "2026-03-10T10:00:00" },
      { id: 3, task_list: "2", completed: false, due_date: "2026-03-20T10:00:00" },
    ];

    it("filters by activeListId when set", () => {
      const out = filterTasksByListAndFilter(tasks, "1", "all", null);
      expect(out).toHaveLength(2);
      expect(out.every((t) => t.task_list === "1")).toBe(true);
    });

    it("filters by filterListIds", () => {
      const out = filterTasksByListAndFilter(tasks, null, "all", ["2"]);
      expect(out).toHaveLength(1);
      expect(out[0].task_list).toBe("2");
    });

    it("filters overdue tasks", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 12));
      const withOverdue = [...tasks, { id: 4, task_list: "1", completed: false, due_date: "2026-03-09T00:00:00" }];
      const out = filterTasksByListAndFilter(withOverdue, null, "overdue", null);
      expect(out.some((t) => t.id === 4)).toBe(true);
      vi.useRealTimers();
    });

    it("filters today's tasks", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 0, 0));
      const out = filterTasksByListAndFilter(tasks, null, "today", null);
      expect(out.some((t) => t.id === 2)).toBe(true);
      vi.useRealTimers();
    });
  it("wires modal save and close handlers, including create-list-from-task", async () => {
    const state = {
      activeListId: 4,
        activeFilter: "today",
        setActiveListId: vi.fn(),
        setActiveFilter: vi.fn(),
        setFilterListIds: vi.fn(),
        setShowListModal: vi.fn(),
        setShowTaskModal: vi.fn(),
        setTaskModalDueDate: vi.fn(),
        showTaskModal: true,
        taskModalDueDate: "2026-03-10T12:00:00Z",
        toastUndo: null,
        toastDelete: false,
        toastInfo: null,
        setToastUndo: vi.fn(),
        setToastDelete: vi.fn(),
        setToastInfo: vi.fn(),
        showListModal: true,
        showCreateListFromTask: true,
        setShowCreateListFromTask: vi.fn(),
        lastCreatedListId: 8,
        setLastCreatedListId: vi.fn(),
      };
      const listsApi = {
        lists: [{ id: 4, name: "Inbox" }],
        archivedLists: [],
        loading: false,
        addList: vi.fn()
          .mockResolvedValueOnce({ id: 12, name: "New List" }),
        renameList: vi.fn(),
        removeList: vi.fn(),
        restoreList: vi.fn(),
        permanentlyDeleteList: vi.fn(),
      };
      const tasksApi = {
        tasks: [],
        initialLoading: false,
        addTask: vi.fn()
          .mockResolvedValueOnce({ id: 45, title: "Saved task" }),
        removeTask: vi.fn(),
        editTask: vi.fn(),
        toggleComplete: vi.fn(),
        reload: vi.fn(),
      };
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], "2026-03-10T23:59:59Z", null);

      await result.taskModalProps.onSave({ title: "Saved task" });
      result.taskModalProps.onOpenCreateList();
      result.taskModalProps.onClose();
      await result.createListFromTaskProps.onSave({ name: "New List" });
      result.createListFromTaskProps.onClose();
      result.listModalProps.onClose();

      expect(tasksApi.addTask).toHaveBeenCalledWith({ title: "Saved task" });
      expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 45, title: "Saved task" });
      expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(true);
      expect(state.setShowTaskModal).toHaveBeenCalledWith(false);
      expect(state.setLastCreatedListId).toHaveBeenCalledWith(null);
      expect(state.setTaskModalDueDate).toHaveBeenCalledWith(null);
      expect(listsApi.addList).toHaveBeenCalledWith({ name: "New List" });
      expect(state.setLastCreatedListId).toHaveBeenCalledWith(12);
      expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(false);
      expect(state.setShowListModal).toHaveBeenCalledWith(false);
    });

    it("skips undo toasts when task creation returns nothing", async () => {
      const state = {
        activeListId: null,
        activeFilter: "all",
        setActiveListId: vi.fn(),
        setActiveFilter: vi.fn(),
        setFilterListIds: vi.fn(),
        setShowListModal: vi.fn(),
        setShowTaskModal: vi.fn(),
        setTaskModalDueDate: vi.fn(),
        showTaskModal: false,
        taskModalDueDate: null,
        toastUndo: null,
        toastDelete: false,
        toastInfo: null,
        setToastUndo: vi.fn(),
        setToastDelete: vi.fn(),
        setToastInfo: vi.fn(),
        showListModal: false,
        showCreateListFromTask: false,
        setShowCreateListFromTask: vi.fn(),
        lastCreatedListId: null,
        setLastCreatedListId: vi.fn(),
      };
      const listsApi = {
        lists: [],
        archivedLists: [],
        loading: false,
        addList: vi.fn(),
        renameList: vi.fn(),
        removeList: vi.fn(),
        restoreList: vi.fn(),
        permanentlyDeleteList: vi.fn(),
      };
      const tasksApi = {
        tasks: [],
        initialLoading: false,
        addTask: vi.fn().mockResolvedValue(null),
        removeTask: vi.fn(),
        editTask: vi.fn(),
        toggleComplete: vi.fn(),
        reload: vi.fn(),
      };
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], null, null);

      await result.feedProps.onAddTask({ title: "Ghost task" });
      expect(state.setToastUndo).not.toHaveBeenCalled();

      await result.taskModalProps.onSave({ title: "Ghost task" });
      expect(state.setToastUndo).toHaveBeenCalledWith(null);
    });
  });
});
