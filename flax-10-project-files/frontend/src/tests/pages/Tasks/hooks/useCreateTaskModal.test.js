/**
 * Covers create-task modal defaults, async loading, and save guards.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sleepWarningHookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: sleepWarningHookMock,
}));

vi.mock("../../../../api/userApi", () => ({
  getUserSettings: vi.fn(),
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: vi.fn(),
  getEnrollments: vi.fn(),
}));

vi.mock("../../../../pages/Tasks/utils/createTaskModalUtils", () => ({
  runCreateTaskSave: vi.fn(),
}));

import { useCreateTaskModal } from "../../../../pages/Tasks/hooks/useCreateTaskModal";
import { getEnrollments, getModules } from "../../../../api/moduleApi";
import { getUserSettings } from "../../../../api/userApi";
import { runCreateTaskSave } from "../../../../pages/Tasks/utils/createTaskModalUtils";

const defaultLists = [
  { id: 1, name: "Inbox" },
  { id: 2, name: "CS101 - Systems" },
];

const defaultModules = [
  { id: 22, module_code: "KCL2", module_name: "Beta" },
  { id: 11, module_code: "KCL1", module_name: "Alpha" },
];

const baseModalProps = {
  lists: defaultLists,
  modules: defaultModules,
  defaultListId: "1",
  defaultDueDate: "2026-03-08T12:00",
  mode: "create",
  showAddToScheduleToggle: true,
};

function buildProps(overrides = {}) {
  return {
    ...baseModalProps,
    onSave: vi.fn().mockResolvedValue({ id: 9 }),
    onClose: vi.fn(),
    onOpenCreateList: vi.fn(),
    onDeleteTask: vi.fn().mockResolvedValue(),
    ...overrides,
  };
}

describe("useCreateTaskModal coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepWarningHookMock.mockReturnValue({
      sleepWarning: false,
      sleepWarningProps: {},
      checkSleepAndRun: (_dueDate, callback) => callback(),
    });
    getUserSettings.mockResolvedValue({ sleep_time: "23:15", wake_time: "07:30" });
    getModules.mockResolvedValue([]);
    getEnrollments.mockResolvedValue([]);
    runCreateTaskSave.mockResolvedValue(undefined);
  });

  it("normalizes initial task data and derives reading-list details", async () => {
    const initialTask = {
      title: "Review notes", description: "Focus on week 4", priority: "low",
      due_date: "2026-03-10T10:45:00Z", task_list: 2, estimated_blocks: 3, moduleId: 44, page_count: 30,
    };
    const { result } = renderHook(() => useCreateTaskModal(buildProps({ initialTask })));
    await waitFor(() => expect(getUserSettings).toHaveBeenCalled());

    expect(result.current.form).toMatchObject({
      title: "Review notes", description: "Focus on week 4", priority: "", due_date: "2026-03-10T10:45",
      task_list: "2", module: "44", estimated_blocks: 3, page_count: 30,
    });
    expect(result.current.isReadingList).toBe(true);
    expect(result.current.estimatedReadingMinutes).toBe(60);
    expect(result.current.selectedListColor).toBeTruthy();
    expect(result.current.sortedModules.map((m) => m.module_code)).toEqual(["KCL1", "KCL2"]);
  });

  it("applies a newly created list id on the next microtask", async () => {
    const { result } = renderHook(() =>
      useCreateTaskModal(buildProps({ newListIdCreated: 99 })),
    );

    await waitFor(() => expect(result.current.form.task_list).toBe("99"));
  });

  it("falls back when settings or module loading fail", async () => {
    getUserSettings.mockRejectedValueOnce(new Error("offline"));
    getModules.mockRejectedValueOnce(new Error("no modules"));
    getEnrollments.mockRejectedValueOnce(new Error("no enrollments"));

    const { result } = renderHook(() =>
      useCreateTaskModal(buildProps({ modules: undefined })),
    );

    await waitFor(() =>
      expect(result.current.sleepSettings).toEqual({ sleep_time: "23:00", wake_time: "07:00" }),
    );
    await waitFor(() => expect(result.current.sortedModules).toEqual([]));
  });

  it("guards saves, handles escape, supports normal category changes, and skips delete when absent", async () => {
    const props = buildProps({ onDeleteTask: undefined });
    const { result } = renderHook(() => useCreateTaskModal({ ...props, initialTask: { title: "A", due_date: "2026-03-10T10:00:00Z" } }));

    act(() => result.current.handleSave());
    expect(runCreateTaskSave).toHaveBeenCalledTimes(1);

    act(() => result.current.set("title", "Changed title"));
    expect(result.current.form.title).toBe("Changed title");

    act(() => result.current.handleCategoryChange("2"));
    expect(result.current.form.task_list).toBe("2");

    act(() => result.current.handleKey({ key: "Enter" }));
    expect(props.onClose).not.toHaveBeenCalled();

    act(() => result.current.handleKey({ key: "Escape" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.handleDelete(); });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("refuses to save invalid forms and routes new-list selection through the callback", async () => {
    const props = buildProps({ defaultDueDate: "" });
    const { result } = renderHook(() =>
      useCreateTaskModal({
        ...props,
        initialTask: { title: "   ", due_date: "" },
      }),
    );

    act(() => result.current.handleSave());
    expect(runCreateTaskSave).not.toHaveBeenCalled();

    act(() => result.current.handleCategoryChange("__new_list__"));
    expect(props.onOpenCreateList).toHaveBeenCalled();
  });

  it("uses sorted-list defaults, keeps allowed priorities, and deletes existing tasks", async () => {
    const props = buildProps({
      lists: [{ id: 3, name: "Zeta" }, { id: 2, name: "Reading List - Physics" }],
      defaultListId: undefined, defaultDueDate: undefined, onOpenCreateList: undefined,
      initialTask: { title: "Read paper", priority: "high", module: 77 },
    });
    const { result } = renderHook(() => useCreateTaskModal(props));

    await waitFor(() => expect(result.current.form.task_list).toBe("2"));
    expect(result.current.form.priority).toBe("high");
    expect(result.current.form.module).toBe("77");
    expect(result.current.categoryOptions.some((o) => o.value === "__new_list__")).toBe(false);
    expect(result.current.isReadingList).toBe(true);
    expect(result.current.estimatedReadingMinutes).toBe(null);

    await act(async () => { await result.current.handleDelete(); });
    expect(props.onDeleteTask).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("ignores async module and sleep-setting results after unmount", async () => {
    let rSettings, rMods, rEnrolls;
    getUserSettings.mockReturnValueOnce(new Promise((r) => { rSettings = r; }));
    getModules.mockReturnValueOnce(new Promise((r) => { rMods = r; }));
    getEnrollments.mockReturnValueOnce(new Promise((r) => { rEnrolls = r; }));

    const { unmount } = renderHook(() => useCreateTaskModal(buildProps({ modules: undefined })));
    unmount();

    await act(async () => {
      rSettings({ sleep_time: "22:00", wake_time: "06:00" });
      rMods([{ id: 4, module_code: "AB1", module_name: "Async" }]);
      rEnrolls([{ module: 4 }]);
      await Promise.resolve();
    });
  });

  it("falls back to an empty list id when no defaults exist and sleep data is partial", async () => {
    getUserSettings.mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useCreateTaskModal(buildProps({
        lists: undefined,
        defaultListId: undefined,
        defaultDueDate: undefined,
        modules: [
          { id: 9, module_name: "No Code" },
          { id: 7, module_name: "Also No Code" },
          { id: 8, module_code: "AB1", module_name: "Alpha" },
        ],
      })),
    );

    await waitFor(() => expect(result.current.form.task_list).toBe(""));
    expect(result.current.sortedModules.map((module) => module.id)).toEqual([9, 7, 8]);
    await waitFor(() =>
      expect(result.current.sleepSettings).toEqual({ sleep_time: "23:00", wake_time: "07:00" }),
    );
  });

  it("sorts lists with missing names and tolerates undefined loaded module payloads", async () => {
    getModules.mockResolvedValueOnce([{ id: 4, module_code: "ZZ1", module_name: "Loaded" }]);
    getEnrollments.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useCreateTaskModal(buildProps({
        lists: [{ id: 3, name: "Zeta" }, { id: 2 }, { id: 1, name: "Inbox" }],
        modules: undefined,
      })),
    );

    await waitFor(() =>
      expect(result.current.sortedLists.map((list) => String(list.id))).toEqual(["2", "1", "3"]),
    );
    await waitFor(() => expect(result.current.sortedModules).toEqual([]));
  });

  it("falls back to an empty enrolled-module list when the module payload is undefined", async () => {
    getModules.mockResolvedValueOnce(undefined);
    getEnrollments.mockResolvedValueOnce([{ module: 4 }]);

    const { result } = renderHook(() =>
      useCreateTaskModal(buildProps({ modules: undefined })),
    );

    await waitFor(() => expect(result.current.sortedModules).toEqual([]));
  });

  it("ignores rejected sleep-setting results after unmount", async () => {
    let rejectSettings;
    getUserSettings.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectSettings = reject;
      }),
    );

    const { unmount } = renderHook(() =>
      useCreateTaskModal(buildProps()),
    );

    unmount();

    await act(async () => {
      rejectSettings(new Error("late settings failure"));
      await Promise.resolve();
    });
  });

  it("ignores rejected module-loading results after unmount", async () => {
    let rejMods, rejEnrolls;
    getModules.mockReturnValueOnce(new Promise((_, r) => { rejMods = r; }));
    getEnrollments.mockReturnValueOnce(new Promise((_, r) => { rejEnrolls = r; }));

    const { unmount } = renderHook(() => useCreateTaskModal(buildProps({ modules: undefined })));
    unmount();

    await act(async () => {
      rejMods(new Error("late module failure"));
      rejEnrolls(new Error("late enrollment failure"));
      await Promise.resolve();
    });
  });
});
