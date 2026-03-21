/* Tests for useCreateTaskBar hook quick-add logic and module loading */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../../../api/moduleApi", () => ({ getModules: vi.fn(), getEnrollments: vi.fn() }));
vi.mock("../../../../api/userService", () => ({ getUserSettings: vi.fn() }));
vi.mock("../../../../components/Modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => true) }));
vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: () => ({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: (_d, cb) => cb() }),
}));
vi.mock("../../../../pages/Tasks/utils/createTaskBarUtils", () => ({ runQuickAdd: vi.fn() }));

import useCreateTaskBar from "../../../../pages/Tasks/hooks/useCreateTaskBar";
import { getModules, getEnrollments } from "../../../../api/moduleApi";
import { getUserSettings } from "../../../../api/userService";
import { runQuickAdd } from "../../../../pages/Tasks/utils/createTaskBarUtils";

describe("useCreateTaskBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(runQuickAdd).toHaveBeenCalled();
  });

  it("handles escape key to blur input state", () => {
    const { result } = renderHook(() => useCreateTaskBar({ lists: [{ id: 9, name: "Inbox" }], onAddTask: vi.fn() }));
    const blur = vi.fn();
    act(() => result.current.handleInputKeyDown({ key: "Escape", preventDefault: vi.fn(), currentTarget: { blur } }));
    expect(blur).toHaveBeenCalled();
  });
});
