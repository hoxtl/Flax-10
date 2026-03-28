import { describe, it, expect, vi } from "vitest";
import { buildTasksPageHandlers } from "../../../../pages/tasks/utils/tasksPageUtils";

describe("tasksPageHandlers", () => {
  it("returns object with all handlers", () => {
    const state = { toastUndo: null, setToastUndo: vi.fn(), activeListId: null, setActiveListId: vi.fn(), setActiveFilter: vi.fn() };
    const listsApi = { removeList: vi.fn(), lists: [] };
    const tasksApi = { removeTask: vi.fn(), editTask: vi.fn(), reload: vi.fn(), restoreList: vi.fn(), permanentlyDeleteList: vi.fn() };
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    expect(handlers).toHaveProperty("handleUndoAddTask");
    expect(handlers).toHaveProperty("handleDeleteTask");
    expect(handlers).toHaveProperty("handleEditTask");
  });

  it("handleUndoAddTask removes task and clears toast when toastUndo set", () => {
    const state = { toastUndo: { taskId: 5 }, setToastUndo: vi.fn() };
    const tasksApi = { removeTask: vi.fn() };
    const handlers = buildTasksPageHandlers(state, {}, tasksApi);
    handlers.handleUndoAddTask();
    expect(tasksApi.removeTask).toHaveBeenCalledWith(5);
    expect(state.setToastUndo).toHaveBeenCalledWith(null);
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
    const state = { activeListId: "1", setActiveListId: vi.fn(), setActiveFilter: vi.fn(), setToastInfo: vi.fn() };
    const listsApi = { removeList: vi.fn(), lists: [{ id: "1", name: "University" }] };
    const handlers = buildTasksPageHandlers(state, listsApi, {});
    await handlers.handleDeleteList("1");
    expect(state.setActiveListId).toHaveBeenCalledWith(null);
    expect(state.setToastInfo).toHaveBeenCalledWith('"University" deleted.');
  });

  it("handlePermanentlyDeleteList shows a delete toast", async () => {
    const state = { setToastInfo: vi.fn() };
    const listsApi = { permanentlyDeleteList: vi.fn(), archivedLists: [{ id: 9, name: "Old List" }] };
    const handlers = buildTasksPageHandlers(state, listsApi, {});
    await handlers.handlePermanentlyDeleteList(9);
    expect(listsApi.permanentlyDeleteList).toHaveBeenCalledWith(9);
    expect(state.setToastInfo).toHaveBeenCalledWith('"Old List" permanently deleted.');
  });

  it("handleEditTask shows move-list and due-date info toasts", async () => {
    const state = { setToastInfo: vi.fn() };
    const listsApi = { lists: [{ id: 3, name: "Coursework" }] };
    const tasksApi = { editTask: vi.fn().mockResolvedValue({ id: 11, task_list: 3 }) };
    const handlers = buildTasksPageHandlers(state, listsApi, tasksApi);
    await handlers.handleEditTask(11, { task_list: 3 }, { source: "context-menu", action: "move-list" });
    expect(state.setToastInfo).toHaveBeenCalledWith("Task moved to Coursework.");
  });
});
