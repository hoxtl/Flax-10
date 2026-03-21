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
  });

  describe("buildTasksPageHandlers", () => {
    it("returns object with all handlers", () => {
      const state = { toastUndo: null, setToastUndo: vi.fn(), activeListId: null, setActiveListId: vi.fn(), setActiveFilter: vi.fn() };
      const listsApi = { removeList: vi.fn(), lists: [] };
      const tasksApi = { removeTask: vi.fn(), editTask: vi.fn(), reload: vi.fn(), restoreList: vi.fn(), permanentlyDeleteList: vi.fn() };
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      expect(handlers).toHaveProperty("handleUndoAddTask");
      expect(handlers).toHaveProperty("handleDeleteTask");
      expect(handlers).toHaveProperty("handleEditTask");
      expect(handlers).toHaveProperty("handleDeleteList");
      expect(handlers).toHaveProperty("handleUnarchiveList");
      expect(handlers).toHaveProperty("handlePermanentlyDeleteList");
    });

    it("handleUndoAddTask removes task and clears toast when toastUndo set", () => {
      const state = { toastUndo: { taskId: 5 }, setToastUndo: vi.fn() };
      const tasksApi = { removeTask: vi.fn() };
      const handlers = buildTasksPageHandlers(state, {}, tasksApi);
      handlers.handleUndoAddTask();
      expect(tasksApi.removeTask).toHaveBeenCalledWith(5);
      expect(state.setToastUndo).toHaveBeenCalledWith(null);
    });

    it("handleUndoAddTask does nothing when toastUndo null", () => {
      const state = { toastUndo: null, setToastUndo: vi.fn() };
      const tasksApi = { removeTask: vi.fn() };
      const handlers = buildTasksPageHandlers(state, {}, tasksApi);
      handlers.handleUndoAddTask();
      expect(tasksApi.removeTask).not.toHaveBeenCalled();
    });

    it("handleDeleteTask removes and sets toastDelete", async () => {
      vi.useFakeTimers();
      const state = { setToastDelete: vi.fn() };
      const tasksApi = { removeTask: vi.fn() };
      const handlers = buildTasksPageHandlers(state, {}, tasksApi);
      await handlers.handleDeleteTask(3);
      expect(tasksApi.removeTask).toHaveBeenCalledWith(3);
      expect(state.setToastDelete).toHaveBeenCalledWith(true);
      vi.advanceTimersByTime(3600);
      expect(state.setToastDelete).toHaveBeenCalledWith(false);
      vi.useRealTimers();
    });

    it("handleDeleteList clears activeListId when deleting active list", async () => {
      vi.useFakeTimers();
      const state = { activeListId: "1", setActiveListId: vi.fn(), setActiveFilter: vi.fn(), setToastInfo: vi.fn() };
      const listsApi = { removeList: vi.fn(), lists: [{ id: "1", name: "University" }] };
      const handlers = buildTasksPageHandlers(state, listsApi, {});
      await handlers.handleDeleteList("1");
      expect(state.setActiveListId).toHaveBeenCalledWith(null);
      expect(state.setActiveFilter).toHaveBeenCalledWith("all");
      expect(state.setToastInfo).toHaveBeenCalledWith('"University" deleted.');
      vi.useRealTimers();
    });

    it("handlePermanentlyDeleteList shows a delete toast", async () => {
      vi.useFakeTimers();
      const state = { setToastInfo: vi.fn() };
      const listsApi = {
        permanentlyDeleteList: vi.fn(),
        archivedLists: [{ id: 9, name: "Old List" }],
      };
      const handlers = buildTasksPageHandlers(state, listsApi, {});
      await handlers.handlePermanentlyDeleteList(9);
      expect(listsApi.permanentlyDeleteList).toHaveBeenCalledWith(9);
      expect(state.setToastInfo).toHaveBeenCalledWith('"Old List" permanently deleted.');
      vi.useRealTimers();
    });
  });

  describe("buildTasksPageViewProps", () => {
    it("returns loading, sidebarProps, feedProps, and modal/toast props", () => {
      const state = {
        activeListId: null, activeFilter: "all", setActiveListId: vi.fn(), setActiveFilter: vi.fn(),
        setFilterListIds: vi.fn(), setShowListModal: vi.fn(), setShowTaskModal: vi.fn(), setTaskModalDueDate: vi.fn(),
        showTaskModal: false, taskModalDueDate: null, toastUndo: null, toastDelete: false, toastInfo: null,
        setToastUndo: vi.fn(), setToastDelete: vi.fn(), setToastInfo: vi.fn(), showListModal: false,
        showCreateListFromTask: false, setShowCreateListFromTask: vi.fn(), lastCreatedListId: null, setLastCreatedListId: vi.fn(),
      };
      const listsApi = { lists: [], loading: false, addList: vi.fn(), renameList: vi.fn(), removeList: vi.fn(), restoreList: vi.fn(), permanentlyDeleteList: vi.fn() };
      const tasksApi = { tasks: [], initialLoading: false, addTask: vi.fn(), removeTask: vi.fn(), editTask: vi.fn(), toggleComplete: vi.fn(), reload: vi.fn() };
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
      const filteredTasks = [];
      const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, filteredTasks, null, null);
      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("sidebarProps");
      expect(result).toHaveProperty("feedProps");
      expect(result).toHaveProperty("showTaskModal");
      expect(result).toHaveProperty("taskModalProps");
      expect(result).toHaveProperty("listModalProps");
    });
  });
});
