/* Tests for useCreateTaskBar hook quick-add logic and module loading */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const checkSleepAndRunMock = vi.hoisted(() => vi.fn((_dueDate, callback) => callback()));

vi.mock("../../../../api/moduleApi", () => ({ getModules: vi.fn(), getEnrollments: vi.fn() }));
vi.mock("../../../../api/userApi", () => ({ getUserSettings: vi.fn() }));
vi.mock("../../../../components/modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => true) }));
vi.mock("../../../../components/settings/hooks/useSleepWarning", () => ({
  useSleepWarning: () => ({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: checkSleepAndRunMock }),
}));
vi.mock("../../../../pages/tasks/utils/createTaskBarUtils", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, runQuickAdd: vi.fn() };
});

import useCreateTaskBar from "../../../../pages/tasks/hooks/useCreateTaskBar";
import { getModules, getEnrollments } from "../../../../api/moduleApi";
import { getUserSettings } from "../../../../api/userApi";
import { runQuickAdd } from "../../../../pages/tasks/utils/createTaskBarUtils";
import { createRejectablePromise } from "./taskHookTestUtils";

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
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], defaultListId: 9, onAddTask, defaultDueDate: "2026-03-09T10:00" }));
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
    const lists = [{ id: 2, name: "PO4505 - Public Policy Analysis" }, { id: 9, name: "Inbox" }];
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
    expect(result.current.isReadingList).toBe(true);

    await act(async () => result.current.handleSubmit({ preventDefault: vi.fn() }));
    expect(runQuickAdd).not.toHaveBeenCalled();
    expect(result.current.taskListId).toBe(2);
  });

  it("marks the list field invalid when submitting without a selected list", async () => {
    const { result } = renderHook(() =>
      useCreateTaskBar({
        lists: [],
        onAddTask: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTitle("Read chapter");
      result.current.setTaskListId("");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(result.current.listError).toBe(true);
    expect(runQuickAdd).not.toHaveBeenCalled();
  });

  it("closes on outside clicks", () => {
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));
    const insideNode = document.createElement("div");
    const outsideNode = document.createElement("button");
    document.body.appendChild(insideNode);
    document.body.appendChild(outsideNode);

    act(() => {
      result.current.cardRef.current = { contains: (node) => node === insideNode };
      result.current.setInputFocused(true);
    });

    act(() => { insideNode.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(result.current.showOptions).toBe(true);

    act(() => { outsideNode.dispatchEvent(new Event("touchstart", { bubbles: true })); });
    expect(result.current.showOptions).toBe(false);

    insideNode.remove();
    outsideNode.remove();
  });

  it("blurs the external input ref on outside click", () => {
    const externalInputRef = { current: { blur: vi.fn() } };
    const { result } = renderHook(() => useCreateTaskBar({ lists: [], onAddTask: vi.fn(), inputRef: externalInputRef }));

    act(() => {
      result.current.cardRef.current = { contains: () => false };
      result.current.setInputFocused(true);
    });

    act(() => { document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(externalInputRef.current.blur).toHaveBeenCalled();
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

  it("uses the internal input ref for blur and ignores settings results after unmount", async () => {
    let resolveSettings;
    getUserSettings.mockReturnValueOnce(new Promise((r) => { resolveSettings = r; }));
    const { result, unmount } = renderHook(() => useCreateTaskBar({ onAddTask: vi.fn() }));
    const blur = vi.fn();
    const outsideNode = document.createElement("button");
    document.body.appendChild(outsideNode);

    act(() => {
      result.current.inputRef.current = { blur };
      result.current.cardRef.current = { contains: () => false };
      result.current.setInputFocused(true);
    });
    act(() => { outsideNode.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(blur).toHaveBeenCalled();

    unmount();
    await act(async () => { resolveSettings({ sleep_time: "22:30", wake_time: "06:30" }); });
    outsideNode.remove();
  });

  it("handles unnamed lists and module names when default props are omitted", async () => {
    getModules.mockResolvedValueOnce([{ id: 5, module_code: "KCL5", module_name: "" }]);
    getEnrollments.mockResolvedValueOnce([{ module: 5 }]);

    const { result } = renderHook(() =>
      useCreateTaskBar({
        lists: [{ id: 3 }],
        onAddTask: vi.fn(),
      }),
    );

    await waitFor(() =>
      expect(result.current.moduleOptions).toContainEqual({ value: "5", label: "KCL5" }),
    );
    expect(result.current.listOptions).toEqual([{ value: "3", label: "Unnamed list" }]);
    expect(result.current.isReadingList).toBe(false);
  });

  it("sorts unnamed lists first and falls back when module and sleep payloads are empty", async () => {
    getModules.mockResolvedValueOnce([{ id: 5, module_code: "AB1", module_name: "Alpha" }]);
    getEnrollments.mockResolvedValueOnce(undefined);
    getUserSettings.mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useCreateTaskBar({
        lists: [{ id: 3, name: "Zeta" }, { id: 2 }, { id: 1, name: "Inbox" }],
        onAddTask: vi.fn(),
      }),
    );

    await waitFor(() =>
      expect(result.current.listOptions).toEqual([
        { value: "2", label: "Unnamed list" },
        { value: "1", label: "Inbox" },
        { value: "3", label: "Zeta" },
      ]),
    );
    await waitFor(() => expect(result.current.moduleOptions).toContainEqual({ value: "5", label: "AB1 — Alpha" }));
    await waitFor(() => expect(result.current.sleepSettings).toEqual({ sleep_time: "23:00", wake_time: "07:00" }));
  });

  it("falls back to an empty module list when the modules payload is undefined", async () => {
    getModules.mockResolvedValueOnce(undefined);
    getEnrollments.mockResolvedValueOnce([{ module: 5 }]);

    const { result } = renderHook(() =>
      useCreateTaskBar({
        lists: [{ id: 9, name: "Inbox" }],
        onAddTask: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.moduleOptions).toEqual([{ value: "", label: "None" }]));
  });

  it("keeps options open when the blur target is still inside the quick-add card", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));
    const insideNode = document.createElement("button");
    insideNode.closest = vi.fn(() => document.body);

    act(() => {
      result.current.setInputFocused(true);
    });

    act(() => {
      Object.defineProperty(document, "activeElement", { configurable: true, get: () => insideNode });
      result.current.handleInputBlur();
      vi.runAllTimers();
    });

    expect(result.current.showOptions).toBe(true);
    vi.useRealTimers();
  });

  it("ignores non-escape keys and supports enrolled modules with missing codes", async () => {
    getModules.mockResolvedValueOnce([{ id: 5, module_code: "", module_name: "No Code Module" }]);
    getEnrollments.mockResolvedValueOnce([{ module: 5 }]);

    const { result } = renderHook(() =>
      useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }),
    );

    const blur = vi.fn();
    act(() => {
      result.current.handleInputKeyDown({ key: "Enter", preventDefault: vi.fn(), currentTarget: { blur } });
    });
    expect(blur).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(result.current.moduleOptions).toContainEqual({ value: "5", label: " — No Code Module" }),
    );
  });

  it("ignores rejected sleep-setting results after unmount", async () => {
    const { promise, rejectPromise } = createRejectablePromise();
    getUserSettings.mockReturnValueOnce(promise);

    const { unmount } = renderHook(() =>
      useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }),
    );

    unmount();

    await act(async () => {
      rejectPromise(new Error("late settings failure"));
      await Promise.resolve();
    });
  });
});
