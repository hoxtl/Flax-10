import { describe, it, expect, vi } from "vitest";
import { buildTasksPageHandlers, buildTasksPageViewProps } from "../../../pages/tasks/utils/tasksPageUtils";

function buildTasksState(overrides = {}) {
  return {
    activeListId: null, activeFilter: "all", setActiveListId: vi.fn(), setActiveFilter: vi.fn(),
    setFilterListIds: vi.fn(), setShowListModal: vi.fn(), setShowTaskModal: vi.fn(), setTaskModalDueDate: vi.fn(),
    showTaskModal: false, taskModalDueDate: null, toastUndo: null, toastDelete: false, toastInfo: null,
    setToastUndo: vi.fn(), setToastDelete: vi.fn(), setToastInfo: vi.fn(), showListModal: false,
    showCreateListFromTask: false, setShowCreateListFromTask: vi.fn(), lastCreatedListId: null, setLastCreatedListId: vi.fn(),
    ...overrides,
  };
}

function buildListsApi(overrides = {}) {
  return { lists: [], loading: false, addList: vi.fn(), renameList: vi.fn(), removeList: vi.fn(), restoreList: vi.fn(), permanentlyDeleteList: vi.fn(), ...overrides };
}

function buildTasksApi(overrides = {}) {
  return { tasks: [], initialLoading: false, addTask: vi.fn(), removeTask: vi.fn(), editTask: vi.fn(), toggleComplete: vi.fn(), reload: vi.fn(), ...overrides };
}

describe("tasksPageViewProps", () => {
  it("returns layout and modal props", () => {
    const state = buildTasksState();
    const listsApi = buildListsApi();
    const tasksApi = buildTasksApi();
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    const result = buildTasksPageViewProps(state, listsApi, tasksApi, handlers, [], null, null);
    expect(result).toHaveProperty("sidebarProps");
    expect(result).toHaveProperty("feedProps");
    expect(result).toHaveProperty("taskModalProps");
  });

  it("selects a list via sidebar", () => {
    const state = buildTasksState();
    const handlers = buildTasksPageHandlers(state, buildListsApi(), buildTasksApi());
    const result = buildTasksPageViewProps(state, buildListsApi(), buildTasksApi(), handlers, [], null, null);
    result.sidebarProps.onSelectList(1);
    expect(state.setActiveListId).toHaveBeenCalledWith(1);
    expect(state.setFilterListIds).toHaveBeenCalledWith([]);
  });

  it("plans tomorrow via feed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 8));
    const state = buildTasksState();
    const handlers = buildTasksPageHandlers(state, buildListsApi(), buildTasksApi());
    const result = buildTasksPageViewProps(state, buildListsApi(), buildTasksApi(), handlers, [], null, null);
    result.feedProps.onPlanTomorrow();
    expect(state.setShowTaskModal).toHaveBeenCalledWith(true);
    vi.useRealTimers();
  });

  it("adds a task via feed and stores undo", async () => {
    vi.useFakeTimers();
    const state = buildTasksState();
    const tasksApi = buildTasksApi({ addTask: vi.fn().mockResolvedValue({ id: 99, title: "T1" }) });
    const handlers = buildTasksPageHandlers(state, buildListsApi(), tasksApi);
    const result = buildTasksPageViewProps(state, buildListsApi(), tasksApi, handlers, [], null, null);
    await result.feedProps.onAddTask({ title: "T1" });
    expect(tasksApi.addTask).toHaveBeenCalledWith({ title: "T1" });
    expect(state.setToastUndo).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
