import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: () => ({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: (_d, cb) => cb() }),
}));

vi.mock("../../../../api/userService", () => ({ getUserSettings: vi.fn() }));
vi.mock("../../../../pages/Tasks/utils/createTaskModalUtils", () => ({ runCreateTaskSave: vi.fn() }));

import { useCreateTaskModal } from "../../../../pages/Tasks/hooks/useCreateTaskModal";
import { getUserSettings } from "../../../../api/userService";
import { runCreateTaskSave } from "../../../../pages/Tasks/utils/createTaskModalUtils";

function makeProps(overrides = {}) {
  return {
    lists: [{ id: 1, name: "Inbox" }],
    modules: [{ id: 11, module_code: "KCL1" }],
    defaultListId: "1",
    defaultDueDate: "2026-03-08T12:00",
    mode: "create",
    showAddToScheduleToggle: true,
    onSave: vi.fn().mockResolvedValue({ id: 9 }),
    onClose: vi.fn(),
    onOpenCreateList: vi.fn(),
    onDeleteTask: vi.fn().mockResolvedValue(),
    ...overrides,
  };
}

describe("useCreateTaskModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserSettings.mockResolvedValue({ sleep_time: "23:00", wake_time: "07:00" });
    runCreateTaskSave.mockResolvedValue(undefined);
  });

  it("builds initial form and category options", async () => {
    const { result } = renderHook(() => useCreateTaskModal(makeProps()));
    await waitFor(() => expect(getUserSettings).toHaveBeenCalled());
    expect(result.current.form.task_list).toBe("1");
    expect(result.current.categoryOptions.length).toBe(2);
  });

  it("handles category change to new list", () => {
    const props = makeProps();
    const { result } = renderHook(() => useCreateTaskModal(props));
    act(() => result.current.handleCategoryChange("__new_list__"));
    expect(props.onOpenCreateList).toHaveBeenCalled();
  });

  it("saves and deletes through handlers", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useCreateTaskModal(props));
    await act(async () => result.current.doSave());
    await act(async () => result.current.handleDelete());
    expect(runCreateTaskSave).toHaveBeenCalled();
    expect(props.onDeleteTask).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });
});
