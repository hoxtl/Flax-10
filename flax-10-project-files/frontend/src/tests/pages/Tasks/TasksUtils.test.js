/**
 * Covers task utility fallbacks and handler wiring branches.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getListColor } from "../../../pages/Tasks/utils/listColorUtils";
import { getCompletedDueLabel, splitEstimatedBlocks } from "../../../pages/Tasks/utils/taskCardUtils";
import { getFilterHandlers, getCompletedWeekCount } from "../../../pages/Tasks/utils/taskFeedDataUtils";
import { getHeaderTitle } from "../../../pages/Tasks/utils/taskFeedUtils";
import {
  getReadingListLabel,
  matchesReadingList,
} from "../../../pages/Tasks/utils/readingListUtils";
import { sortTasks } from "../../../pages/Tasks/utils/taskSortUtils";
import {
  addListImpl,
  mergeListColors,
} from "../../../pages/Tasks/utils/useTaskListsUtils";
import {
  buildTasksPageHandlers,
  buildTasksPageViewProps,
} from "../../../pages/Tasks/utils/tasksPageUtils";

vi.mock("../../../api/taskApi", () => ({
  createTaskList: vi.fn(),
  updateTaskList: vi.fn(),
  deleteTaskList: vi.fn(),
}));

import { createTaskList } from "../../../api/taskApi";

describe("Tasks utility coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "window", { value: {}, writable: true });
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  it("handles local-storage failures and list-color fallbacks", () => {
    globalThis.localStorage.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getListColor({ id: 1, name: "Inbox" }, 2)).toBeTruthy();
    expect(mergeListColors([{ id: 1, name: "Inbox" }])[0].color).toBeUndefined();
  });

  it("covers reading-list fallbacks when readings cannot be matched by code or name", () => {
    expect(
      matchesReadingList(
        { module_code: "", module_name: "" },
        { name: "Reading List - Operating Systems" },
      ),
    ).toBe(false);
    expect(getReadingListLabel({ name: "Reading List - Operating Systems" })).toBe("Operating Systems");
  });

  it("stores new list colors when possible and still returns created lists without ids", async () => {
    createTaskList
      .mockResolvedValueOnce({ id: 7, name: "New list" })
      .mockResolvedValueOnce({ id: 8, name: "Fallback color list" })
      .mockResolvedValueOnce({ name: "Unsaved list" });

    const setLists = vi.fn((updater) => (typeof updater === "function" ? updater([]) : updater));
    const coloured = await addListImpl(setLists, { name: "New list", color: "#123456" });
    globalThis.localStorage.setItem.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    const fallbackColour = await addListImpl(setLists, { name: "Fallback color list", color: "#abcdef" });
    const withoutId = await addListImpl(setLists, { name: "Unsaved list" });

    expect(coloured.color).toBe("#123456");
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("listColor:7", "#123456");
    expect(fallbackColour.color).toBe("#abcdef");
    expect(withoutId).toEqual({ name: "Unsaved list" });
  });

  it("formats older completion dates and block splits that do not divide evenly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10));

    expect(getCompletedDueLabel(new Date(2026, 1, 1, 12, 0).toISOString())).toMatch(/Completed/);
    expect(splitEstimatedBlocks(5)).toEqual({ sessionCount: 5, workMinutes: 25 });

    vi.useRealTimers();
  });

  it("covers remaining task-feed filter edge cases", () => {
    const setFilterModuleCodes = vi.fn();
    const handlers = getFilterHandlers(["1"], vi.fn(), setFilterModuleCodes, vi.fn());

    handlers.toggleModuleFilter("A");
    expect(setFilterModuleCodes).toHaveBeenCalled();

    const count = getCompletedWeekCount(
      [{ due_date: null }, { due_date: "2026-03-12T10:00:00" }],
      new Date(2026, 2, 10, 23, 59, 59),
      new Date(2026, 2, 17, 23, 59, 59),
    );
    expect(count).toBe(1);
  });

  it("falls back to a generic active-list title and default sorting ids", () => {
    expect(getHeaderTitle("all", {}, null)).toBe("List");

    const desc = sortTasks([{ id: null, title: "A" }, { title: "B" }], "date_added", {});
    const asc = sortTasks([{ id: null, title: "A" }, { title: "B" }], "date_added_asc", {});

    expect(desc).toHaveLength(2);
    expect(asc).toHaveLength(2);
  });

  const buildStateMocks = () => ({
    activeListId: null, activeFilter: "all", filterListIds: [], taskModalDueDate: null,
    showTaskModal: false, toastUndo: null, toastDelete: false, toastInfo: null,
    showListModal: false, showCreateListFromTask: false, lastCreatedListId: null,
    setActiveListId: vi.fn(), setActiveFilter: vi.fn(), setFilterListIds: vi.fn(),
    setShowListModal: vi.fn(), setShowTaskModal: vi.fn(), setTaskModalDueDate: vi.fn(),
    setToastUndo: vi.fn(), setToastDelete: vi.fn(), setToastInfo: vi.fn(),
    setShowCreateListFromTask: vi.fn(), setLastCreatedListId: vi.fn(),
  });

  const buildListsApiMocks = () => ({
    lists: [{ id: 2, name: "Coursework" }], archivedLists: [], loading: false,
    addList: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 9, name: "Reading list" }),
    renameList: vi.fn(), removeList: vi.fn(), restoreList: vi.fn(), permanentlyDeleteList: vi.fn(),
  });

  const buildTasksApiMocks = () => ({
    tasks: [], initialLoading: false,
    addTask: vi.fn().mockResolvedValueOnce({ id: 5, title: "Essay draft" }).mockResolvedValueOnce({ id: 6, title: "Follow up" }),
    removeTask: vi.fn(), toggleComplete: vi.fn(), reload: vi.fn(),
    editTask: vi.fn().mockResolvedValueOnce({ id: 7, task_list: 77 }).mockResolvedValueOnce({ id: 8, task_list: null }),
  });

  const makeMocks = () => ({
    state: buildStateMocks(),
    listsApi: buildListsApiMocks(),
    tasksApi: buildTasksApiMocks(),
  });

  it("covers move-list toast naming fallbacks", async () => {
    vi.useFakeTimers();
    const { state, listsApi, tasksApi } = makeMocks();
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    await handlers.handleEditTask(7, { task_list: 2 }, { source: "context-menu", action: "move-list", listName: "Pinned" });
    await handlers.handleEditTask(8, { task_list: 999 }, { source: "context-menu", action: "move-list" });
    vi.runAllTimers();
    expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to Pinned.");
    expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to new list.");
    vi.useRealTimers();
  });

  it("covers task-page modal callbacks", async () => {
    vi.useFakeTimers();
    const { state, listsApi, tasksApi } = makeMocks();
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    const viewProps = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], null, null);
    viewProps.sidebarProps.onSelectList(2);
    await viewProps.feedProps.onAddTask({ title: "Essay draft" });
    await viewProps.taskModalProps.onSave({ title: "Skipped" });
    await viewProps.createListFromTaskProps.onSave({ name: "Draft list" });
    await viewProps.createListFromTaskProps.onSave({ name: "Reading list" });
    viewProps.taskModalProps.onClose();
    vi.runAllTimers();
    expect(state.setToastUndo).toHaveBeenCalledWith({ taskId: 5, title: "Essay draft" });
    expect(state.setLastCreatedListId).toHaveBeenCalledWith(9);
    vi.useRealTimers();
  });
});
