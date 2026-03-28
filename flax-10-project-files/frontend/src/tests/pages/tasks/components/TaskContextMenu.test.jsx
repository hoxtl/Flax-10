/* Tests for TaskContextMenu */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskContextMenu, useDueViewHandlers, useTaskContextMenuEffects, useTaskContextMenuState } from "../../../../pages/tasks/components/TaskCard";
import { createRejectablePromise } from "../hooks/taskHookTestUtils";

const sleepWarningHookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../api/userApi", () => ({ getUserSettings: vi.fn().mockResolvedValue({ sleep_time: "23:00", wake_time: "07:00" }) }));
vi.mock("../../../../context/ToastContext", () => ({ useToast: vi.fn(() => vi.fn()) }));
vi.mock("../../../../components/settings/hooks/useSleepWarning", () => ({ useSleepWarning: sleepWarningHookMock }));
vi.mock("../../../../components/common/sleep_warning_modal", () => ({ SleepWarningModal: () => <div data-testid="sleep-warning" /> }));
vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ onChange }) => (<div><button onClick={() => onChange("2026-03-10T10:00")}>Set date</button><button onClick={() => onChange("")}>Clear date</button></div>)
}));
vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ options = [], onChange }) => (<div><button onClick={() => onChange("__missing__")}>invalid option</button>{options.map((o) => (<button key={String(o.value)} onClick={() => onChange(o.value)}>{o.label}</button>))}</div>)
}));

import { getUserSettings } from "../../../../api/userApi";

const defaultTask = { id: 1, title: "T1", module_code: "KCL1", due_date: "2026-03-09T09:00", priority: "urgent" };
const defaultLists = [{ id: 1, name: "Inbox", color: "#ccc" }, { id: 2, name: "Work", color: "#eee" }];
function renderWithRouter(ui) { return render(<MemoryRouter>{ui}</MemoryRouter>); }

function renderTaskContextMenu(props = {}) {
  return renderWithRouter(
    <TaskContextMenu
      task={defaultTask}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
      lists={defaultLists}
      pos={{ x: 10, y: 20 }}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

function openMoveListMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Move to list/i }));
}

function resetAndOpenDueDateMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Back/i }));
  fireEvent.click(screen.getByRole("button", { name: /Set due date/i }));
}

describe("TaskContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepWarningHookMock.mockReturnValue({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: (_d, cb) => cb() });
  });

  it("covers menu back buttons, invalid moves, due removal, sleep warnings, and outside clicks", async () => {
    getUserSettings.mockRejectedValueOnce(new Error("offline"));
    sleepWarningHookMock.mockReturnValue({ sleepWarning: true, sleepWarningProps: {}, checkSleepAndRun: (_d, cb) => cb() });
    const onClose = vi.fn();
    const onEdit = vi.fn();
    renderTaskContextMenu({ onClose, onEdit });

    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("button", { name: /Set due date/i }));
    expect(onClose).not.toHaveBeenCalled();

    openMoveListMenu();
    fireEvent.click(screen.getByRole("button", { name: /invalid option/i }));
    expect(onEdit).not.toHaveBeenCalled();

    resetAndOpenDueDateMenu();
    resetAndOpenDueDateMenu();
    fireEvent.click(screen.getByRole("button", { name: /Clear date/i }));

    expect(onEdit).toHaveBeenCalledWith({ due_date: null }, { source: "context-menu", action: "set-due-date", dueDate: null });
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(getUserSettings).toHaveBeenCalled());
  });

  it("covers empty move values and missing source list names in the context menu", async () => {
    const onEdit = vi.fn();
    renderTaskContextMenu({ task: { ...defaultTask, task_list: null }, onEdit, lists: [{ id: 2, name: "Work" }] });

    act(() => openMoveListMenu());
    fireEvent.click(await screen.findByRole("button", { name: /Work/i }));
    expect(onEdit).toHaveBeenCalledWith({ task_list: 2 }, expect.objectContaining({ fromListName: undefined }));
  });

  it("handles missing sleep settings and ignores late failures after unmount", async () => {
    getUserSettings.mockResolvedValueOnce({});
    const m1 = renderTaskContextMenu();
    await waitFor(() => expect(getUserSettings).toHaveBeenCalled());
    m1.unmount();

    const { promise, rejectPromise } = createRejectablePromise();
    getUserSettings.mockReturnValueOnce(promise);
    const m2 = renderTaskContextMenu();
    m2.unmount();
    await act(async () => { rejectPromise(new Error("late failure")); });
  });

  it("covers delete actions and confirmed due-date updates", async () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onClose = vi.fn();
    const checkSleepAndRun = vi.fn((_date, callback) => callback());
    sleepWarningHookMock.mockReturnValue({
      sleepWarning: false,
      sleepWarningProps: {},
      checkSleepAndRun,
    });

    renderTaskContextMenu({ onDelete, onEdit, onClose });

    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    const dueView = renderTaskContextMenu({ onEdit, onClose });
    fireEvent.click(screen.getAllByRole("button", { name: /Set due date/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Set date/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Set date/i })[1]);

    expect(checkSleepAndRun).toHaveBeenCalledWith("2026-03-10T10:00", expect.any(Function));
    expect(onEdit).toHaveBeenCalledWith(
      { due_date: "2026-03-10T10:00" },
      { source: "context-menu", action: "set-due-date", dueDate: "2026-03-10T10:00" },
    );
    dueView.unmount();
  });

  it("covers hook-only fallback branches for empty due values and missing initial due dates", () => {
    const { result: stateResult } = renderHook(() => useTaskContextMenuState({}));
    expect(stateResult.current.dueValue).toBe("");

    const setDueValue = vi.fn();
    const onEdit = vi.fn();
    const onClose = vi.fn();
    const checkSleepAndRun = vi.fn();
    const { result } = renderHook(() =>
      useDueViewHandlers({ dueValue: "", setDueValue, onEdit, onClose, checkSleepAndRun }),
    );

    act(() => {
      result.current.onConfirm();
    });

    expect(checkSleepAndRun).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores inside-menu document clicks in the context-menu effects hook", async () => {
    getUserSettings.mockResolvedValueOnce({ sleep_time: "22:30", wake_time: "06:45" });
    const onClose = vi.fn();
    const setSleepSettings = vi.fn();
    const menuNode = document.createElement("div");
    const child = document.createElement("button");
    menuNode.appendChild(child);
    document.body.appendChild(menuNode);
    const menuRef = { current: menuNode };

    const { unmount } = renderHook(() => useTaskContextMenuEffects(menuRef, onClose, setSleepSettings));

    child.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(setSleepSettings).toHaveBeenCalledWith({ sleep_time: "22:30", wake_time: "06:45" }),
    );

    unmount();
    menuNode.remove();
  });
});
