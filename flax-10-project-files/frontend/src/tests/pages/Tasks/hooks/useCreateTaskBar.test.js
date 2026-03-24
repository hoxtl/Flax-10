/* Tests for useCreateTaskBar hook quick-add logic and module loading */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const checkSleepAndRunMock = vi.hoisted(() => vi.fn((_dueDate, callback) => callback()));

vi.mock("../../../../api/moduleApi", () => ({ getModules: vi.fn(), getEnrollments: vi.fn() }));
vi.mock("../../../../api/userApi", () => ({ getUserSettings: vi.fn() }));
vi.mock("../../../../components/Modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => true) }));
vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: () => ({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: checkSleepAndRunMock }),
}));
vi.mock("../../../../pages/Tasks/utils/createTaskBarUtils", () => ({ runQuickAdd: vi.fn() }));

import useCreateTaskBar from "../../../../pages/Tasks/hooks/useCreateTaskBar";
import { getModules, getEnrollments } from "../../../../api/moduleApi";
import { getUserSettings } from "../../../../api/userApi";
import { runQuickAdd } from "../../../../pages/Tasks/utils/createTaskBarUtils";

describe("useCreateTaskBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkSleepAndRunMock.mockImplementation((_dueDate, callback) => callback());
    getModules.mockResolvedValue([{ id: 1, module_code: "KCL1", module_name: "Test" }]);
    getEnrollments.mockResolvedValue([{ id: 20, module: 1 }]);
    getUserSettings.mockResolvedValue({ sleep_time: "23:00", wake_time: "07:00" });
  });

  it("loads module and list options", async () => {
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));
    await waitFor(() => expect(result.current.moduleOptions.length).toBeGreaterThan(1));
    expect(result.current.listOptions[0].value).toBe("9");
  });

  it("submits quick add", async () => {
    const onAddTask = vi.fn();
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask, defaultDueDate: "2026-03-09T10:00" }));
    act(() => result.current.setTitle("Read"));
    await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));
    expect(checkSleepAndRunMock).toHaveBeenCalledWith("2026-03-09T10:00", expect.any(Function));
    expect(runQuickAdd).toHaveBeenCalled();
  });

  it("handles escape key to blur input state", () => {
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));
    const blur = vi.fn();
    act(() => result.current.handleInputKeyDown({ key: "Escape", preventDefault: vi.fn(), currentTarget: { blur } }));
    expect(blur).toHaveBeenCalled();
  });

  it("falls back when module or sleep settings requests fail", async () => {
    getModules.mockRejectedValueOnce(new Error("modules down"));
    getEnrollments.mockRejectedValueOnce(new Error("enrollments down"));
    getUserSettings.mockRejectedValueOnce(new Error("settings down"));

    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 11, name: "Reading List - History" }], onAddTask: vi.fn() }));

    await waitFor(() => expect(result.current.moduleOptions).toEqual([{ value: "", label: "None" }]));
    await waitFor(() => expect(result.current.sleepSettings).toEqual({ sleep_time: "23:00", wake_time: "07:00" }));
  });

  it("syncs default list ids and ignores invalid submits", async () => {
    const onAddTask = vi.fn();
    const lists = [{ id: 2, name: "Reading List - History" }, { id: 9, name: "Inbox" }];
    const { result, rerender } = renderHook(
      ({ defaultListId }) => useCreateTaskBar({
        lists,
        defaultListId,
        onAddTask,
      }),
      { initialProps: { defaultListId: 9 } },
    );

    await waitFor(() => expect(result.current.listOptions).toHaveLength(2));
    expect(result.current.taskListId).toBe(9);

    rerender({ defaultListId: 2 });
    await waitFor(() => expect(result.current.taskListId).toBe(2));

    await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));
    expect(runQuickAdd).not.toHaveBeenCalled();
    expect(result.current.taskListId).toBe(2);
  });

  it("closes on outside clicks and blurs the external input ref", () => {
    const externalInputRef = { current: { blur: vi.fn() } };
    const { result } = renderHook(() =>
      useCreateTaskBar({
        lists: [{ id: 9, name: "Inbox" }],
        onAddTask: vi.fn(),
        inputRef: externalInputRef,
      }),
    );

    const insideNode = document.createElement("div");
    const outsideNode = document.createElement("button");
    document.body.appendChild(insideNode);
    document.body.appendChild(outsideNode);

    act(() => {
      result.current.cardRef.current = { contains: (node) => node === insideNode };
      result.current.setInputFocused(true);
    });

    act(() => {
      insideNode.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(result.current.showOptions).toBe(true);

    act(() => {
      outsideNode.dispatchEvent(new Event("touchstart", { bubbles: true }));
    });

    expect(result.current.showOptions).toBe(false);
    expect(externalInputRef.current.blur).toHaveBeenCalled();

    insideNode.remove();
    outsideNode.remove();
  });

  it("blurs from the input blur handler when focus leaves the card", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));

    const outsideNode = document.createElement("button");
    outsideNode.closest = vi.fn(() => null);

    act(() => {
      result.current.setInputFocused(true);
    });

    act(() => {
      Object.defineProperty(document, "activeElement", { configurable: true, get: () => outsideNode });
      result.current.handleInputBlur();
      vi.runAllTimers();
    });

    expect(result.current.showOptions).toBe(false);
    vi.useRealTimers();
  });
});
