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

    it("handleDeleteList uses a fallback name and does not reset unrelated active lists", async () => {
      vi.useFakeTimers();
      const state = { activeListId: "22", setActiveListId: vi.fn(), setActiveFilter: vi.fn(), setToastInfo: vi.fn() };
      const listsApi = { removeList: vi.fn(), lists: [] };
      const handlers = buildTasksPageHandlers(state, listsApi, {});

      await handlers.handleDeleteList("7");

      expect(listsApi.removeList).toHaveBeenCalledWith("7");
      expect(state.setToastInfo).toHaveBeenCalledWith('"List" deleted.');
      expect(state.setActiveListId).not.toHaveBeenCalled();
      expect(state.setActiveFilter).not.toHaveBeenCalled();
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

    it("handleEditTask shows move-list and due-date info toasts for context-menu actions", async () => {
      vi.useFakeTimers();
      const state = { setToastInfo: vi.fn() };
      const listsApi = { lists: [{ id: 3, name: "Coursework" }] };
      const tasksApi = {
        editTask: vi.fn()
          .mockResolvedValueOnce({ id: 11, task_list: 3 })
          .mockResolvedValueOnce({ id: 11, due_date: "2026-03-11T10:00:00Z" })
          .mockResolvedValueOnce({ id: 11, due_date: null }),
      };
      const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);

      await handlers.handleEditTask(11, { task_list: 3 }, { source: "context-menu", action: "move-list" });
      await handlers.handleEditTask(11, { due_date: "2026-03-11T10:00:00Z" }, { source: "context-menu", action: "set-due-date" });
      await handlers.handleEditTask(11, { due_date: null }, { source: "context-menu", action: "set-due-date" });

      expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to Coursework.");
      expect(state.setToastInfo).toHaveBeenCalledWith("Task due date updated.");
      expect(state.setToastInfo).toHaveBeenCalledWith("Task due date removed.");
      vi.useRealTimers();
    });

    it("handleUnarchiveList restores the list and reloads tasks", async () => {
      const listsApi = { restoreList: vi.fn() };
      const tasksApi = { reload: vi.fn() };
      const handlers = buildTasksPageHandlers({}, listsApi, tasksApi);

      await handlers.handleUnarchiveList(7);

      expect(listsApi.restoreList).toHaveBeenCalledWith(7);
      expect(tasksApi.reload).toHaveBeenCalled();
    });

    it("handleEditTask returns the updated task when no special context-menu handling applies", async () => {
      const updatedTask = { id: 4, title: "Updated" };
      const tasksApi = { editTask: vi.fn().mockResolvedValue(updatedTask) };
      const handlers = buildTasksPageHandlers({ setToastInfo: vi.fn() }, { lists: [] }, tasksApi);

      await expect(handlers.handleEditTask(4, { title: "Updated" })).resolves.toEqual(updatedTask);
    });
  });

  function buildTasksState(overrides = {}) {
    return {
      activeListId: null,
      activeFilter: "all",
      filterListIds: [],
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
      ...overrides,
    };
  }

  function buildListsApi(overrides = {}) {
    return {
      lists: [],
      archivedLists: [],
      loading: false,
      addList: vi.fn(),
      renameList: vi.fn(),
      removeList: vi.fn(),
      restoreList: vi.fn(),
      permanentlyDeleteList: vi.fn(),
      ...overrides,
    };
  }

  function buildTasksApi(overrides = {}) {
    return {
      tasks: [],
      initialLoading: false,
      addTask: vi.fn(),
      removeTask: vi.fn(),
      editTask: vi.fn(),
      toggleComplete: vi.fn(),
      reload: vi.fn(),
      ...overrides,
    };
  }

  function buildViewPropsFixture({
    stateOverrides = {},
    listsOverrides = {},
    tasksOverrides = {},
    filteredTasks = [],
    defaultDueDate = null,
    activeModuleCode = null,
  } = {}) {
    const state = buildTasksState(stateOverrides);
    const listsApi = buildListsApi(listsOverrides);
    const tasksApi = buildTasksApi(tasksOverrides);
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    const result = buildTasksPageViewProps(
      state,
      listsApi,
      tasksApi,
      handlers,
      filteredTasks,
      defaultDueDate,
      activeModuleCode,
    );
    return { state, listsApi, tasksApi, handlers, result };
  }

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

    describe("sidebar and feed callbacks", () => {
      it("selects a list and clears filter ids", () => {
        const { state, result } = buildViewPropsFixture({
          listsOverrides: { lists: [{ id: 1, name: "Inbox" }] },
        });
        result.sidebarProps.onSelectList(1);
        expect(state.setActiveListId).toHaveBeenCalledWith(1);
        expect(state.setFilterListIds).toHaveBeenCalledWith([]);
      });

      it("opens the list modal when creating a new list", () => {
        const { state, result } = buildViewPropsFixture();
        result.sidebarProps.onNewList();
        expect(state.setShowListModal).toHaveBeenCalledWith(true);
      });

      it("opens the task modal for quick create", () => {
        const { state, result } = buildViewPropsFixture();
        result.feedProps.onCreateTask();
        expect(state.setTaskModalDueDate).toHaveBeenCalledWith(null);
        expect(state.setShowTaskModal).toHaveBeenCalledWith(true);
      });

      it("plans tomorrow with a due date at tomorrow end", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 10, 8));
        const { state, result } = buildViewPropsFixture();
        result.feedProps.onPlanTomorrow();
        const dueCalls = state.setTaskModalDueDate.mock.calls;
        const dueDate = dueCalls[dueCalls.length - 1][0];
        expect(dueDate).toMatch(/2026-03-11/);
        expect(state.setShowTaskModal).toHaveBeenCalledWith(true);
        vi.useRealTimers();
      });

      it("adds a task and stores the undo toast", async () => {
        vi.useFakeTimers();
        const { state, tasksApi, result } = buildViewPropsFixture({
          tasksOverrides: { addTask: vi.fn().mockResolvedValue({ id: 99, title: "Created task" }) },
        });
        await result.feedProps.onAddTask({ title: "Created task" });
        expect(tasksApi.addTask).toHaveBeenCalledWith({ title: "Created task" });
        expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 99, title: "Created task" });
        vi.runAllTimers();
        expect(state.setToastUndo).toHaveBeenCalledWith(null);
        vi.useRealTimers();
      });
    });

    describe("modal save and close handlers", () => {
      const modalState = {
        activeListId: 4,
        activeFilter: "today",
        showTaskModal: true,
        taskModalDueDate: "2026-03-10T12:00:00Z",
        showListModal: true,
        showCreateListFromTask: true,
        lastCreatedListId: 8,
      };

      it("saves a task from the modal and stores undo", async () => {
        vi.useFakeTimers();
        const { state, tasksApi, result } = buildViewPropsFixture({
          stateOverrides: modalState,
          listsOverrides: { lists: [{ id: 4, name: "Inbox" }] },
          tasksOverrides: { addTask: vi.fn().mockResolvedValue({ id: 45, title: "Saved task" }) },
          defaultDueDate: "2026-03-10T23:59:59Z",
        });
        await result.taskModalProps.onSave({ title: "Saved task" });
        expect(tasksApi.addTask).toHaveBeenCalledWith({ title: "Saved task" });
        expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 45, title: "Saved task" });
        vi.runAllTimers();
        expect(state.setToastUndo).toHaveBeenCalledWith(null);
        vi.useRealTimers();
      });

      it("opens the create-list-from-task modal from the task modal", () => {
        const { state, result } = buildViewPropsFixture({
          stateOverrides: modalState,
        });
        result.taskModalProps.onOpenCreateList();
        expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(true);
      });

      it("closes the task modal and resets modal state", () => {
        const { state, result } = buildViewPropsFixture({
          stateOverrides: modalState,
        });
        result.taskModalProps.onClose();
        expect(state.setShowTaskModal).toHaveBeenCalledWith(false);
        expect(state.setLastCreatedListId).toHaveBeenCalledWith(null);
        expect(state.setTaskModalDueDate).toHaveBeenCalledWith(null);
      });

      it("saves a list from the create-list modal and stores the id", async () => {
        const { state, listsApi, result } = buildViewPropsFixture({
          stateOverrides: modalState,
          listsOverrides: {
            lists: [{ id: 4, name: "Inbox" }],
            addList: vi.fn().mockResolvedValue({ id: 12, name: "New List" }),
          },
        });
        await result.createListFromTaskProps.onSave({ name: "New List" });
        expect(listsApi.addList).toHaveBeenCalledWith({ name: "New List" });
        expect(state.setLastCreatedListId).toHaveBeenCalledWith(12);
        expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(false);
      });

      it("closes the create-list and main list modals", () => {
        const { state, result } = buildViewPropsFixture({
          stateOverrides: modalState,
        });
        result.createListFromTaskProps.onClose();
        result.listModalProps.onClose();
        expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(false);
        expect(state.setShowListModal).toHaveBeenCalledWith(false);
      });
    });
  });
});
