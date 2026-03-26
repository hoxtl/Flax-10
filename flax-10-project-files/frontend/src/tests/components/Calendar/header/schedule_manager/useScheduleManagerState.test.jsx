import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { buildScheduleManagerHandlers, useScheduleManagerState } from "../../../../../components/Calendar/header/schedule_manager/useScheduleManagerState";

const getSchedules = vi.fn();
const renameSchedule = vi.fn();
const deleteSchedule = vi.fn();

vi.mock("../../../../../api/scheduleApi", () => ({
  getSchedules: (...args) => getSchedules(...args),
  renameSchedule: (...args) => renameSchedule(...args),
  deleteSchedule: (...args) => deleteSchedule(...args),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderOpenStateHook(showToast = vi.fn()) {
  return renderHook(({ open }) => useScheduleManagerState(open, showToast), {
    initialProps: { open: true },
  });
}

async function resolveAfterUnmount(pending, settle) {
  await act(async () => {
    settle();
    await pending.promise.catch(() => undefined);
  });
}

async function expectNoLateToastAfterUnmount(settle) {
  const pending = deferred();
  const showToast = vi.fn();
  getSchedules.mockReturnValueOnce(pending.promise);

  const { unmount } = renderOpenStateHook(showToast);
  unmount();

  await resolveAfterUnmount(pending, () => settle(pending));

  expect(showToast).not.toHaveBeenCalled();
}

describe("useScheduleManagerState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets edit state when the dialog closes", async () => {
    getSchedules.mockResolvedValue([{ id: 1, title: "Spring plan" }]);
    const showToast = vi.fn();
    const { result, rerender } = renderOpenStateHook(showToast);

    await waitFor(() => expect(result.current.schedules).toEqual([{ id: 1, title: "Spring plan" }]));

    act(() => {
      result.current.setEditingId(1);
      result.current.setRenameDraft("Renaming");
      result.current.setRemoveId(3);
      result.current.setIsSaving(true);
      result.current.setIsDeleting(true);
    });

    rerender({ open: false });

    expect(result.current.editingId).toBeNull();
    expect(result.current.renameDraft).toBe("");
    expect(result.current.removeId).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it.each([
    ["responses", (pending) => pending.resolve([{ id: 1, title: "Late result" }])],
    ["errors", (pending) => pending.reject(new Error("late failure"))],
  ])("ignores late schedule %s after the dialog closes", async (_label, settle) => {
    await expectNoLateToastAfterUnmount(settle);
  });
});

describe("buildScheduleManagerHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves existing allocations when rename responses omit them", async () => {
    renameSchedule.mockResolvedValueOnce({});
    const showToast = vi.fn();
    const setSchedules = vi.fn((updater) => {
      const next = updater([{ id: 1, title: "Old", event_allocations: ["keep"] }]);
      expect(next).toEqual([{ id: 1, title: "New title", event_allocations: ["keep"] }]);
    });
    const state = {
      renameDraft: " New title ",
      setIsSaving: vi.fn(),
      setSchedules,
      setEditingId: vi.fn(),
      setRenameDraft: vi.fn(),
      setRemoveId: vi.fn(),
      removeId: null,
      setIsDeleting: vi.fn(),
    };

    const handlers = buildScheduleManagerHandlers(state, showToast);
    await handlers.onRenameSave(1);

    expect(renameSchedule).toHaveBeenCalledWith(1, "New title");
    expect(state.setEditingId).toHaveBeenCalledWith(null);
    expect(state.setRenameDraft).toHaveBeenCalledWith("");
  });

  it("does nothing when delete is requested without a selected schedule", async () => {
    const state = {
      removeId: null,
      setIsDeleting: vi.fn(),
      setRemoveId: vi.fn(),
      setSchedules: vi.fn(),
      setEditingId: vi.fn(),
      setRenameDraft: vi.fn(),
    };

    const handlers = buildScheduleManagerHandlers(state, vi.fn());
    await handlers.onDelete();

    expect(deleteSchedule).not.toHaveBeenCalled();
    expect(state.setIsDeleting).not.toHaveBeenCalled();
  });
});
