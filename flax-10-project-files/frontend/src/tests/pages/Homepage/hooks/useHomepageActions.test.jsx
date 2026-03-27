/**
 * Covers task completion, popup, and edit handlers for the Homepage.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTaskMock = vi.fn();
const deleteTaskMock = vi.fn();

vi.mock("../../../../api/taskApi", () => ({
  updateTask: (...args) => updateTaskMock(...args),
  deleteTask: (...args) => deleteTaskMock(...args),
}));

import { useHomepageActions } from "../../../../pages/Homepage/hooks/useHomepageActions";

function buildProps(overrides = {}) {
  return {
    openPopup: vi.fn(),
    refetchTasks: vi.fn().mockResolvedValue([]),
    removePendingTask: vi.fn(),
    showCompletionToast: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  };
}

const createAudioNode = () => ({
  connect: vi.fn(),
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  start: vi.fn(),
  stop: vi.fn(),
});

const createAudioGain = () => ({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
});

const createAudioContextApi = () => ({
  currentTime: 0,
  destination: {},
  createOscillator: createAudioNode,
  createGain: createAudioGain,
});

describe("useHomepageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.AudioContext = vi.fn(() => createAudioContextApi());
    window.webkitAudioContext = undefined;
  });

  it("completes widget tasks, removes pending items, refetches, and plays audio for non-routine tasks", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: "task-9", title: "Write essay", completed: false });
    });

    expect(props.showCompletionToast).toHaveBeenCalled();
    expect(props.removePendingTask).toHaveBeenCalledWith(9);
    expect(updateTaskMock).toHaveBeenCalledWith(9, { completed: true });
    expect(props.refetchTasks).toHaveBeenCalled();
    expect(window.AudioContext).toHaveBeenCalled();
  });

  it("skips audio for routine widget tasks and shows a toast when refetch reveals failure", async () => {
    updateTaskMock.mockRejectedValueOnce(new Error("failed"));
    const props = buildProps({
      refetchTasks: vi.fn().mockResolvedValue([{ id: 5, completed: false }]),
    });
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 5, title: "Breakfast", completed: false });
    });

    expect(props.showCompletionToast).toHaveBeenCalledWith("Nourished. ☕", { isRoutine: true });
    expect(window.AudioContext).not.toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith("Couldn't update task.");
  });

  it("toggles timeline tasks and swallows update failures", async () => {
    updateTaskMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("nope"));
    const props = buildProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskToggle({ id: 3, title: "Read notes" }, true);
      await result.current.handleTaskToggle({ id: 4, title: "Read notes" }, false);
    });

    expect(props.showCompletionToast).toHaveBeenCalledTimes(1);
    expect(updateTaskMock).toHaveBeenCalledWith(3, { completed: true });
    expect(updateTaskMock).toHaveBeenCalledWith(4, { completed: false });
    expect(props.refetchTasks).toHaveBeenCalledTimes(1);
  });

  it("opens the timeline popup with forced personal readonly settings", () => {
    const props = buildProps();
    const { result } = renderHook(() => useHomepageActions(props));

    act(() => {
      result.current.openTimelinePopup({ id: 1, title: "Lecture" }, null, { top: 10 });
      result.current.openTimelinePopup(null);
    });

    expect(props.openPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        forcePersonalPopup: true,
        timelineReadOnly: true,
      }),
      { top: 10 },
      false,
      "day",
    );
    expect(props.openPopup).toHaveBeenCalledTimes(1);
  });

  it("deletes and edits tasks, and exposes the task widget ref", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    deleteTaskMock.mockResolvedValueOnce({});
    const props = buildProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.deleteTaskAndRefresh({ id: 11 });
      await result.current.handleInlineTaskEdit({ id: 12 }, { title: "Updated" });
    });

    expect(deleteTaskMock).toHaveBeenCalledWith(11);
    expect(updateTaskMock).toHaveBeenCalledWith(12, { title: "Updated" });
    expect(props.refetchTasks).toHaveBeenCalledTimes(2);
    expect(result.current.taskWidgetRef.current).toBeNull();
  });
});
