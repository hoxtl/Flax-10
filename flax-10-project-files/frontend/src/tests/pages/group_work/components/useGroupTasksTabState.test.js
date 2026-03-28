/*
 * Tests for useGroupTasksTabState – loading, CRUD actions, filtering, and search.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getAuthHeaders = vi.fn(() => ({ Authorization: "Token abc" }));
const calcCompletionSegments = vi.fn(() => ({ complete: 1 }));
const sortTasks = vi.fn((tasks) => [...tasks].sort((a, b) => a.id - b.id));

vi.mock("../../../../pages/group_work/hooks/groupWorkHooks", () => ({
  getAuthHeaders: (...args) => getAuthHeaders(...args),
}));

vi.mock("../../../../pages/group_work/utils/taskStatsUtils", () => ({
  calcCompletionSegments: (...args) => calcCompletionSegments(...args),
}));

vi.mock("../../../../pages/group_work/utils/taskUtils", () => ({
  sortTasks: (...args) => sortTasks(...args),
}));

import { useGroupTasksTabState } from "../../../../pages/group_work/hooks/useGroupTasksTabState";

const defaultTasksResponse = [{ id: 2, title: "B", assignees_info: [{ id: 4 }], status: "todo" }];
const mockJsonResponse = (payload) => ({ ok: true, json: async () => payload });
const mockOkResponse = () => ({ ok: true });

const renderTasksHook = async (extraResponses = []) => {
  global.fetch.mockReset?.();
  [mockJsonResponse(defaultTasksResponse), ...extraResponses].forEach((response) => {
    global.fetch.mockResolvedValueOnce(response);
  });
  const onStatsUpdate = vi.fn();
  const hook = renderHook(() => useGroupTasksTabState(9, [{ id: 4 }], onStatsUpdate));
  await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
  return { hook, onStatsUpdate };
};

describe("useGroupTasksTabState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("loads tasks and updates completion stats", async () => {
    const { hook, onStatsUpdate } = await renderTasksHook();
    expect(onStatsUpdate).toHaveBeenCalledWith({ complete: 1 });
    expect(hook.result.current.sortedTasks).toHaveLength(1);
  });

  it("performs update, delete, and add actions", async () => {
    const { hook } = await renderTasksHook([
      mockJsonResponse({ id: 2, title: "Updated", assignees_info: [{ id: 4 }], status: "todo" }),
      mockJsonResponse({ id: 3, title: "New", assignees_info: [], status: "todo" }),
      mockOkResponse(),
    ]);
    vi.useFakeTimers();
    try {
      await act(async () => {
        await hook.result.current.taskActions.updateTask(2, { completed: true });
        hook.result.current.taskActions.deleteTask(2);
        await hook.result.current.taskActions.addTask("New", { due_date: "2026-04-01", assigned_to: [4] });
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "PATCH" }));
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/", expect.objectContaining({ method: "POST" }));
      await act(async () => { vi.advanceTimersByTime(3200); await Promise.resolve(); });
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggles filters, view, and modal state", async () => {
    const { hook } = await renderTasksHook();
    act(() => {
      hook.result.current.setFilterUsers(["4"]);
      hook.result.current.setTaskView("board");
      hook.result.current.setShowAddModal(true);
    });
    expect(hook.result.current.taskView).toBe("board");
    expect(hook.result.current.showAddModal).toBe(true);
  });

  it("filters tasks by assignee when filterUsers is set", async () => {
    const { hook } = await renderTasksHook([
      mockJsonResponse([
        { id: 1, title: "A", assignees_info: [{ id: 5 }], status: "todo" },
        { id: 2, title: "B", assignees_info: [{ id: 4 }], status: "todo" },
      ]),
    ]);
    act(() => { hook.result.current.setFilterUsers(["4"]); });
    expect(hook.result.current.sortedTasks).toHaveLength(1);
  });

  it("ignores blank task titles when adding a task", async () => {
    const { hook } = await renderTasksHook();
    await act(async () => {
      await hook.result.current.taskActions.addTask("", { due_date: "2026-03-30" });
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("undoDelete restores the task and clears the pending timer", async () => {
    const { hook } = await renderTasksHook();
    vi.useFakeTimers();
    try {
      act(() => { hook.result.current.taskActions.deleteTask(2); });
      expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2)).toBeUndefined();
      act(() => { hook.result.current.taskActions.undoDelete(2); });
      expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2)).toBeDefined();
      await act(async () => { vi.advanceTimersByTime(3200); await Promise.resolve(); });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("executeStartDelete clears existing timer when deleting same task twice", async () => {
    const { hook } = await renderTasksHook();
    vi.useFakeTimers();
    try {
      act(() => {
        hook.result.current.taskActions.deleteTask(2);
        hook.result.current.taskActions.deleteTask(2);
      });
      expect(hook.result.current.taskActions.tasks).toEqual([]);
      await act(async () => { vi.advanceTimersByTime(3200); await Promise.resolve(); });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns [] from useFetchTasks when response.ok is false", async () => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValueOnce({ ok: false });
    const onStatsUpdate = vi.fn();
    const hook = renderHook(() => useGroupTasksTabState(9, [{ id: 4 }], onStatsUpdate));
    await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
    expect(hook.result.current.taskActions.tasks).toEqual([]);
  });

  it("updateTask updates tasks list when response.ok is true", async () => {
    const updatedTask = { id: 2, title: "Updated Title", assignees_info: [{ id: 4 }], status: "done" };
    const { hook } = await renderTasksHook([mockJsonResponse(updatedTask)]);
    await act(async () => { await hook.result.current.taskActions.updateTask(2, { title: "Updated Title" }); });
    expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2).title).toBe("Updated Title");
  });

  it("updateTask does nothing when response.ok is false", async () => {
    const { hook } = await renderTasksHook();
    global.fetch.mockResolvedValueOnce({ ok: false });
    await act(async () => { await hook.result.current.taskActions.updateTask(2, { title: "Nope" }); });
    expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2).title).toBe("B");
  });

  it("createTask succeeds when response.ok is true", async () => {
    const newTask = { id: 10, title: "Brand New", assignees_info: [], status: "todo" };
    const { hook } = await renderTasksHook([mockJsonResponse(newTask)]);
    await act(async () => { await hook.result.current.taskActions.addTask("Brand New", {}); });
    expect(hook.result.current.taskActions.tasks.find((t) => t.id === 10)).toBeDefined();
  });

  it("createTask does nothing when response.ok is false", async () => {
    const { hook } = await renderTasksHook();
    global.fetch.mockResolvedValueOnce({ ok: false });
    await act(async () => { await hook.result.current.taskActions.addTask("Fail", {}); });
    expect(hook.result.current.taskActions.tasks).toHaveLength(1);
  });

  it("buildTaskBody includes due_date and assigned_to when provided", async () => {
    const { hook } = await renderTasksHook([mockJsonResponse({ id: 11, title: "With Options", assignees_info: [], status: "todo" })]);
    await act(async () => {
      await hook.result.current.taskActions.addTask("With Options", { due_date: "2026-05-01", assigned_to: [1, 2], status: "in_progress" });
    });
    const body = JSON.parse(global.fetch.mock.calls.find((c) => c[1]?.method === "POST")[1].body);
    expect(body.due_date).toBe("2026-05-01");
    expect(body.assigned_to).toEqual([1, 2]);
    expect(body.status).toBe("in_progress");
  });

  it("buildTaskBody omits due_date and assigned_to when not provided", async () => {
    const { hook } = await renderTasksHook([mockJsonResponse({ id: 12, title: "Minimal", assignees_info: [], status: "todo" })]);
    await act(async () => { await hook.result.current.taskActions.addTask("Minimal", {}); });
    const body = JSON.parse(global.fetch.mock.calls.find((c) => c[1]?.method === "POST")[1].body);
    expect(body.due_date).toBeUndefined();
    expect(body.assigned_to).toBeUndefined();
    expect(body.status).toBe("todo");
  });

  it("supports addTask without an options object", async () => {
    const { hook } = await renderTasksHook([mockJsonResponse({ id: 13, title: "Default options", assignees_info: [], status: "todo" })]);
    await act(async () => { await hook.result.current.taskActions.addTask("Default options"); });
    const postCall = global.fetch.mock.calls.find((call) => call[1]?.method === "POST");
    expect(JSON.parse(postCall[1].body)).toMatchObject({ title: "Default options", group_project: 9, priority: "medium", status: "todo" });
  });

  it("ignores delete requests when the task cannot be found", async () => {
    const { hook } = await renderTasksHook();
    vi.useFakeTimers();
    try {
      act(() => { hook.result.current.taskActions.deleteTask(999); });
      await act(async () => { vi.advanceTimersByTime(3200); await Promise.resolve(); });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves non-target tasks during updates and safely filters missing assignees and titles", async () => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValueOnce(mockJsonResponse([
      { id: 1, title: undefined, assignees_info: null, status: "todo" },
      { id: 2, title: "Beta task", assignees_info: [{ id: 4 }], status: "todo" },
    ])).mockResolvedValueOnce(mockJsonResponse({ id: 2, title: "Updated Beta", assignees_info: [{ id: 4 }], status: "done" }));
    const onStatsUpdate = vi.fn();
    const hook = renderHook(() => useGroupTasksTabState(9, [{ id: 4 }], onStatsUpdate));
    await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
    act(() => { hook.result.current.setFilterUsers(["4"]); hook.result.current.setSearchTerm("updated"); });
    await act(async () => { await hook.result.current.taskActions.updateTask(2, { status: "done" }); });
    expect(hook.result.current.taskActions.tasks.find((task) => task.id === 1).title).toBeUndefined();
    expect(hook.result.current.sortedTasks).toEqual([expect.objectContaining({ id: 2, title: "Updated Beta" })]);
  });

  it("ignores undo requests for missing pending deletes and safely searches untitled tasks", async () => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValueOnce(mockJsonResponse([{ id: 1, title: undefined, assignees_info: [], status: "todo" }]));
    const onStatsUpdate = vi.fn();
    const hook = renderHook(() => useGroupTasksTabState(9, [], onStatsUpdate));
    await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
    act(() => { hook.result.current.taskActions.undoDelete(999); hook.result.current.setSearchTerm("alpha"); });
    expect(hook.result.current.sortedTasks).toEqual([]);
  });

  it("useSearchFilteredTasks filters tasks by searchTerm", async () => {
    global.fetch.mockReset();
    global.fetch.mockResolvedValueOnce(mockJsonResponse([
      { id: 1, title: "Alpha task", assignees_info: [], status: "todo" },
      { id: 2, title: "Beta work", assignees_info: [], status: "todo" },
      { id: 3, title: "ALPHA upper", assignees_info: [], status: "todo" },
    ]));
    const hook = renderHook(() => useGroupTasksTabState(9, [], vi.fn()));
    await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
    act(() => { hook.result.current.setSearchTerm("alpha"); });
    expect(hook.result.current.sortedTasks).toHaveLength(2);
    expect(hook.result.current.sortedTasks.every((t) => t.title.toLowerCase().includes("alpha"))).toBe(true);
  });

  it("onStatsUpdate callback is invoked with calcCompletionSegments result", async () => {
    const { onStatsUpdate } = await renderTasksHook();
    expect(calcCompletionSegments).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 2 })]),
      [{ id: 4 }],
    );
    expect(onStatsUpdate).toHaveBeenCalledWith({ complete: 1 });
  });
});
