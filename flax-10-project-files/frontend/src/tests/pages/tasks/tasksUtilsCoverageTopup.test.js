import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTaskListMock = vi.fn();
const updateTaskListMock = vi.fn();
const deleteTaskListMock = vi.fn();

vi.mock("../../../api/taskApi", () => ({
  createTaskList: (...args) => createTaskListMock(...args),
  updateTaskList: (...args) => updateTaskListMock(...args),
  deleteTaskList: (...args) => deleteTaskListMock(...args),
}));

import {
  clampEstimateMinutes,
  getEstimateBlocks,
  minutesToEstimateBlocks,
  normalizeEstimateMinutesInput,
  runQuickAdd,
} from "../../../pages/tasks/utils/createTaskBarUtils";
import { getListColor } from "../../../pages/tasks/utils/listColorUtils";
import {
  getReadingListLabel,
  getSocietyDisplayName,
  isReadingListName,
  matchesReadingList,
} from "../../../pages/tasks/utils/readingListUtils";
import { getCompletedDueLabel, splitEstimatedBlocks } from "../../../pages/tasks/utils/taskCardUtils";
import { getCompletedWeekCount, getThisWeek } from "../../../pages/tasks/utils/taskFeedDataUtils";
import { sortTasks } from "../../../pages/tasks/utils/taskSortUtils";
import {
  buildTasksPageHandlers,
  buildTasksPageViewProps,
} from "../../../pages/tasks/utils/tasksPageUtils";
import {
  addListImpl,
  mergeListColors,
  removeListImpl,
  renameListImpl,
} from "../../../pages/tasks/utils/useTaskListsUtils";

const makeFnMap = (names) => Object.fromEntries(names.map((name) => [name, vi.fn()]));

function createState(overrides = {}) {
  return {
    activeListId: 7,
    activeFilter: "all",
    filterListIds: ["2"],
    showTaskModal: false,
    taskModalDueDate: null,
    toastUndo: null,
    toastDelete: false,
    toastInfo: null,
    toastError: null,
    showListModal: false,
    showCreateListFromTask: true,
    lastCreatedListId: null,
    ...makeFnMap([
      "setActiveListId",
      "setActiveFilter",
      "setFilterListIds",
      "setShowListModal",
      "setShowTaskModal",
      "setTaskModalDueDate",
      "setToastUndo",
      "setToastDelete",
      "setToastInfo",
      "setToastError",
      "setShowCreateListFromTask",
      "setLastCreatedListId",
    ]),
    ...overrides,
  };
}

function createListsApi(overrides = {}) {
  return {
    lists: [{ id: 7, name: "Inbox" }, { id: 9, name: "Reading" }],
    archivedLists: [{ id: 21, name: "Archive" }],
    loading: false,
    addList: vi.fn(),
    renameList: vi.fn(),
    removeList: vi.fn().mockResolvedValue(undefined),
    restoreList: vi.fn().mockResolvedValue(undefined),
    permanentlyDeleteList: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createTasksApi(overrides = {}) {
  return {
    tasks: [{ id: 1, title: "A", task_list: 7 }],
    initialLoading: false,
    addTask: vi.fn().mockResolvedValue({ id: 99, title: "Added" }),
    removeTask: vi.fn().mockResolvedValue(undefined),
    editTask: vi.fn().mockResolvedValue({ id: 4, task_list: 9 }),
    toggleComplete: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}

describe("tasks utils coverage topups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("normalizes estimate minutes across empty, invalid, min, max, and block conversions", () => {
    expect(clampEstimateMinutes("bad")).toBe(25);
    expect(clampEstimateMinutes(1)).toBe(5);
    expect(clampEstimateMinutes(999)).toBe(240);
    expect(normalizeEstimateMinutesInput("", 50)).toBe(50);
    expect(normalizeEstimateMinutesInput(null, 10)).toBe(10);
    expect(normalizeEstimateMinutesInput(undefined, 15)).toBe(15);
    expect(normalizeEstimateMinutesInput("oops", 20)).toBe(20);
    expect(normalizeEstimateMinutesInput("240", 10)).toBe(240);
    expect(normalizeEstimateMinutesInput("", undefined)).toBe(25);
    expect(normalizeEstimateMinutesInput("oops")).toBe(25);
    expect(minutesToEstimateBlocks(49)).toBe(2);
    expect(getEstimateBlocks(0)).toBe(1);
  });

  it("falls back to palette colours when stored list colour lookups fail", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getListColor({ id: 2 }, 1)).toBeTruthy();
  });

  it("builds reading list labels from generic names and future completion dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T10:00:00.000Z"));

    expect(getReadingListLabel({ name: "Independent Reading" })).toBe("Independent Reading");
    expect(getCompletedDueLabel("2026-03-12T10:00:00.000Z")).toMatch(/^Completed /);
    expect(matchesReadingList({}, { name: "cs101 - Systems" })).toBe(false);
    expect(getSocietyDisplayName({})).toBe("Society");
    expect(getSocietyDisplayName({ name: "   " })).toBe("Society");
    expect(isReadingListName(undefined)).toBe(false);
  });

  it("ignores missing due dates when calculating this-week and completed-week buckets", () => {
    const todayEnd = new Date("2026-03-10T23:59:59.999Z");
    const weekEnd = new Date("2026-03-17T23:59:59.999Z");

    expect(getThisWeek([{ id: 1, due_date: null }], todayEnd, weekEnd)).toEqual([]);
    expect(getCompletedWeekCount([{ due_date: null }], todayEnd, weekEnd)).toBe(0);
  });

  it("falls back to priority sorting when the sort key is unknown", () => {
    const tasks = [
      { id: 1, title: "B", priority: "medium" },
      { id: 2, title: "A", priority: "urgent" },
    ];

    expect(sortTasks(tasks, "mystery")).toEqual([tasks[1], tasks[0]]);
  });

  it("uses zero for missing ids in date-added sorts and falls back for unsplittable block counts", () => {
    const tasks = [
      { id: undefined, title: "Missing", priority: "medium" },
      { id: 2, title: "Present", priority: "medium" },
    ];

    expect(sortTasks(tasks, "date_added")[0].id).toBe(2);
    expect(sortTasks(tasks, "date_added_asc")[0].id).toBeUndefined();
    expect(sortTasks([{ title: "A" }, { title: "B" }], "date_added")).toHaveLength(2);
    expect(sortTasks([{ title: "A" }, { title: "B" }], "date_added_asc")).toHaveLength(2);
    expect(splitEstimatedBlocks(13)).toEqual({ sessionCount: 1, workMinutes: 325 });
  });

  it("handles list color storage failures and task lists created without ids", async () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(mergeListColors([{ id: 1, name: "Inbox" }])[0].color).toBeUndefined();

    createTaskListMock.mockResolvedValueOnce({ name: "Untitled" });
    const setLists = vi.fn();
    const createdWithoutId = await addListImpl(setLists, { name: "Untitled" });
    expect(createdWithoutId).toEqual({ name: "Untitled" });
    expect(setLists.mock.calls[0][0]([])).toEqual([{ name: "Untitled" }]);

    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    createTaskListMock.mockResolvedValueOnce({ id: 5, name: "Colourful" });
    const setListsWithColor = vi.fn();
    const createdWithColor = await addListImpl(setListsWithColor, { name: "Colourful", color: "#123456" });
    expect(createdWithColor).toEqual({ id: 5, name: "Colourful", color: "#123456" });
    expect(setListsWithColor.mock.calls[0][0]([{ id: 1, name: "Old" }])).toEqual([
      { id: 1, name: "Old" },
      { id: 5, name: "Colourful", color: "#123456" },
    ]);
  });

  it("executes quick-add cleanup and list mutation updater callbacks", async () => {
    const quickAddState = {
      saving: false,
      setSaving: vi.fn(),
      setTitle: vi.fn(),
      setModuleId: vi.fn(),
      setPageCount: vi.fn(),
      sortedLists: [{ id: 1 }],
      taskListId: "1",
      estimatedMinutes: 25,
      moduleId: null,
      defaultDueDate: null,
      pageCount: 10,
    };

    await runQuickAdd(quickAddState, vi.fn().mockResolvedValue(undefined), "Read");
    expect(quickAddState.setPageCount).toHaveBeenCalledWith(null);

    updateTaskListMock.mockResolvedValueOnce({ id: 7, color: "#f0f" });
    const setLists = vi.fn();
    const renamed = await renameListImpl(setLists, 7, { color: "#f0f" });
    expect(renamed).toEqual({ id: 7, color: "#f0f" });
    expect(updateTaskListMock).toHaveBeenCalledWith(7, { color: "#f0f" });
    expect(setLists.mock.calls[0][0]([{ id: 7, name: "Inbox" }, { id: 9, name: "Other" }])).toEqual([
      { id: 7, name: "Inbox", color: "#f0f" },
      { id: 9, name: "Other" },
    ]);

    updateTaskListMock.mockResolvedValueOnce({});
    const setListsAfterArchive = vi.fn();
    const loadArchived = vi.fn();
    await removeListImpl(setListsAfterArchive, loadArchived, 9);
    expect(setListsAfterArchive.mock.calls[0][0]([{ id: 7 }, { id: 9 }])).toEqual([{ id: 7 }]);
  });

  it("covers page handlers for undo, edits, deletes, restores, and permanent deletion", async () => {
    vi.useFakeTimers();
    const state = createState({ toastUndo: { taskId: 3, title: "Undo me" } });
    const listsApi = createListsApi();
    const tasksApi = createTasksApi();
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);

    handlers.handleUndoAddTask();
    expect(tasksApi.removeTask).toHaveBeenCalledWith(3);
    expect(state.setToastUndo).toHaveBeenCalledWith(null);

    state.toastUndo = null;
    handlers.handleUndoAddTask();
    expect(tasksApi.removeTask).toHaveBeenCalledTimes(1);

    await handlers.handleEditTask(4, { task_list: 9 }, { source: "context-menu", action: "move-list" });
    expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to Reading.");

    await handlers.handleEditTask(4, { due_date: null }, { source: "context-menu", action: "set-due-date" });
    expect(state.setToastInfo).toHaveBeenCalledWith("Task due date removed.");

    await handlers.handleEditTask(4, { due_date: "2026-03-11T10:00:00.000Z" }, { source: "context-menu", action: "set-due-date" });
    expect(state.setToastInfo).toHaveBeenCalledWith("Task due date updated.");

    tasksApi.editTask.mockResolvedValueOnce({});
    await handlers.handleEditTask(4, { task_list: 404 }, { source: "context-menu", action: "move-list" });
    expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to new list.");

    await expect(handlers.handleEditTask(4, { title: "Plain edit" })).resolves.toEqual({ id: 4, task_list: 9 });

    await handlers.handleDeleteTask(11);
    expect(state.setToastDelete).toHaveBeenCalledWith(true);
    vi.advanceTimersByTime(3500);
    expect(state.setToastDelete).toHaveBeenCalledWith(false);

    await handlers.handleUnarchiveList(21);
    expect(listsApi.restoreList).toHaveBeenCalledWith(21);
    expect(tasksApi.reload).toHaveBeenCalled();

    await handlers.handlePermanentlyDeleteList(21);
    expect(listsApi.permanentlyDeleteList).toHaveBeenCalledWith(21);
    expect(state.setToastInfo).toHaveBeenCalledWith('"Archive" permanently deleted.');

    await handlers.handleDeleteList(999);
    expect(state.setToastInfo).toHaveBeenCalledWith('"List" deleted.');

    await handlers.handlePermanentlyDeleteList(999);
    expect(state.setToastInfo).toHaveBeenCalledWith('"List" permanently deleted.');

    vi.advanceTimersByTime(3000);
    expect(state.setToastInfo).toHaveBeenCalledWith(null);
  });

  it("resets active selection when deleting the active list", async () => {
    vi.useFakeTimers();
    const state = createState({ activeListId: 7 });
    const listsApi = createListsApi();
    const handlers = buildTasksPageHandlers(state, listsApi, createTasksApi());

    await handlers.handleDeleteList(7);

    expect(listsApi.removeList).toHaveBeenCalledWith(7);
    expect(state.setActiveListId).toHaveBeenCalledWith(null);
    expect(state.setActiveFilter).toHaveBeenCalledWith("all");
    expect(state.setToastInfo).toHaveBeenCalledWith('"Inbox" deleted.');
  });

  it("builds view props that wire sidebar, feed, modal, and toast behaviour", async () => {
    vi.useFakeTimers();
    const state = createState();
    const listsApi = createListsApi({
      loading: true,
      addList: vi.fn().mockResolvedValue({}),
    });
    const tasksApi = createTasksApi({
      initialLoading: false,
      addTask: vi.fn().mockResolvedValue({ id: 41, title: "Created" }),
    });
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    const props = buildTasksPageViewProps(
      state,
      listsApi,
      tasksApi,
      handlers,
      [{ id: 1, title: "Filtered" }],
      "2026-03-11T23:59:59.999Z",
      "CS101",
    );

    expect(props.loading).toBe(true);
    expect(props.taskModalProps.defaultDueDate).toBe("2026-03-11T23:59:59.999Z");

    props.sidebarProps.onSelectList(9);
    props.sidebarProps.onSelectFilter("later");
    props.sidebarProps.onNewList();
    props.feedProps.onPlanTomorrow();
    props.feedProps.onCreateTask();
    props.feedProps.onListError("bad list");
    props.listModalProps.onClose();

    vi.advanceTimersByTime(3500);

    expect(state.setActiveListId).toHaveBeenCalledWith(9);
    expect(state.setFilterListIds).toHaveBeenCalledWith([]);
    expect(state.setActiveFilter).toHaveBeenCalledWith("later");
    expect(state.setShowListModal).toHaveBeenCalledWith(true);
    expect(state.setShowListModal).toHaveBeenCalledWith(false);
    expect(state.setShowTaskModal).toHaveBeenCalled();
    expect(state.setTaskModalDueDate).toHaveBeenCalled();
    expect(state.setToastError).toHaveBeenCalledWith("bad list");
    expect(state.setToastError).toHaveBeenCalledWith(null);

    await props.createListFromTaskProps.onSave({ name: "No id" });
    expect(state.setLastCreatedListId).not.toHaveBeenCalled();
    expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(false);

    await props.feedProps.onAddTask({ title: "Feed task" });
    await props.taskModalProps.onSave({ title: "Modal task" });

    vi.advanceTimersByTime(5000);

    expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 41, title: "Created" });
    expect(state.setToastUndo).toHaveBeenCalledWith(null);

    props.taskModalProps.onOpenCreateList();
    props.taskModalProps.onClose();
    expect(state.setShowCreateListFromTask).toHaveBeenCalledWith(true);
    expect(state.setShowTaskModal).toHaveBeenCalledWith(false);
    expect(state.setTaskModalDueDate).toHaveBeenCalledWith(null);
  });
});
