import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTaskMock = vi.fn();
const deleteTaskMock = vi.fn();

vi.mock("../../../../api/taskApi", () => ({
  updateTask: (...args) => updateTaskMock(...args),
  deleteTask: (...args) => deleteTaskMock(...args),
}));

import { useHomepageActions } from "../../../../pages/homepage/hooks/useHomepageActions";

function buildActionsProps(overrides = {}) {
  return {
    openPopup: vi.fn(),
    refetchTasks: vi.fn().mockResolvedValue([]),
    removePendingTask: vi.fn(),
    showCompletionToast: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  };
}

describe("useHomepageActions extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.AudioContext = undefined;
    window.webkitAudioContext = vi.fn(function () {
      return {
        currentTime: 0,
        destination: {},
        createOscillator: () => ({
          connect: vi.fn(),
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: () => ({
          connect: vi.fn(),
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        }),
      };
    });
  });

  it("falls back to webkitAudioContext when AudioContext is undefined", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: "task-20", title: "Non-routine task", completed: false });
    });

    expect(window.webkitAudioContext).toHaveBeenCalled();
  });

  it("does not call sound or removePendingTask when toggling to incomplete", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 5, title: "Some task", completed: true });
    });

    expect(props.removePendingTask).not.toHaveBeenCalled();
    expect(props.showCompletionToast).not.toHaveBeenCalled();
  });

  it("notifies completion and refetches when completing", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskToggle({ id: 99, title: "Review slides" }, true);
    });

    expect(props.showCompletionToast).toHaveBeenCalled();
    expect(updateTaskMock).toHaveBeenCalledWith(99, { completed: true });
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it("deleteTaskAndRefresh accepts a plain task id (non-object)", async () => {
    deleteTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.deleteTaskAndRefresh(77);
    });

    expect(deleteTaskMock).toHaveBeenCalledWith(77);
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it("does not show toast when refreshed tasks appear completed", async () => {
    updateTaskMock.mockRejectedValueOnce(new Error("fail"));
    const props = buildActionsProps({
      refetchTasks: vi.fn().mockResolvedValue([{ id: 5, completed: true }]),
    });
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 5, title: "Essay", completed: false });
    });

    expect(props.showToast).not.toHaveBeenCalled();
  });

  it("handles a numeric id successfully extracting the int", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 42, title: "Plain id task", completed: false });
    });

    expect(updateTaskMock).toHaveBeenCalledWith(42, { completed: true });
  });

  it("handles a string id directly mapped without any task prefixes", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: "abc-123", title: "String id", completed: false });
    });

    expect(updateTaskMock).toHaveBeenCalledWith("abc-123", { completed: true });
  });

  it("handles an undefined refetch result after an update failure without showing a toast", async () => {
    updateTaskMock.mockRejectedValueOnce(new Error("fail"));
    const props = buildActionsProps({
      refetchTasks: vi.fn().mockResolvedValue(undefined),
    });
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 18, title: "Essay", completed: false });
    });

    expect(props.showToast).not.toHaveBeenCalled();
  });
});
