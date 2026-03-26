/**
 * Covers TaskCard rendering, menu, and modal behaviours.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import TaskCard, { EditTaskModal, TaskContextMenu } from "../../../../pages/Tasks/components/TaskCard";

const navigateMock = vi.hoisted(() => vi.fn());
const timerMock = vi.hoisted(() => ({ setActiveTaskId: vi.fn() }));
const completionMock = vi.hoisted(() => ({ showCompletionToast: vi.fn() }));
const sleepWarningHookMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (node) => node };
});

vi.mock("../../../../context/TimerContext", () => ({
  useTimerContext: () => timerMock,
}));

vi.mock("../../../../context/TaskCompletionContext", () => ({
  useTaskCompletion: () => completionMock,
}));

vi.mock("../../../../lib/completionMessages", () => ({
  getCompletionMessage: vi.fn(() => "Done"),
  isRoutineTask: vi.fn(() => false),
}));

vi.mock("../../../../api/userApi", () => ({
  getUserSettings: vi.fn().mockResolvedValue({ sleep_time: "23:00", wake_time: "07:00" }),
}));

vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: sleepWarningHookMock,
}));

vi.mock("../../../../components/common/sleep_warning_modal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ onChange }) => (
    <div>
      <button type="button" onClick={() => onChange("2026-03-10T10:00")}>
        Set date
      </button>
      <button type="button" onClick={() => onChange("")}>
        Clear date
      </button>
    </div>
  ),
}));

vi.mock("../../../../components/task_celebration/CheckBurst", () => ({
  CheckBurst: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../pages/Tasks/components/CreateTaskModal", () => ({
  default: ({ onSave, onClose }) => (
    <div data-testid="edit-modal">
      <button type="button" onClick={() => onSave({ title: "Updated" })}>
        Save
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: () => <div data-testid="info-modal" />,
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ options = [], onChange }) => (
    <div data-testid="animated-dropdown">
      <button type="button" onClick={() => onChange("__missing__")}>
        invalid option
      </button>
      {options.map((option) => (
        <button key={String(option.value)} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/utils/taskCardUtils", async () => {
  const actual = await vi.importActual("../../../../pages/Tasks/utils/taskCardUtils");
  return {
    ...actual,
    formatDueDate: vi.fn(() => ({ label: "Today", status: "today" })),
    getCompletedDueLabel: vi.fn(() => "Completed label"),
    splitEstimatedBlocks: vi.fn(() => ({ sessionCount: 1, workMinutes: 50 })),
  };
});

import { isRoutineTask } from "../../../../lib/completionMessages";
import { getUserSettings } from "../../../../api/userApi";
import { formatDueDate } from "../../../../pages/Tasks/utils/taskCardUtils";

import { createFnMap } from "../../../utils/testBuilderUtils";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const baseTask = {
  id: 1,
  title: "Read book",
  completed: false,
  task_list: 1,
  module_code: "KCL1",
  module_id: 11,
  due_date: "2026-03-09T09:00",
  priority: "urgent",
  estimated_blocks: 2,
  group_project_name: "Capstone",
};

function buildProps(overrides = {}) {
  const { task, ...rest } = overrides;
  return {
    task: { ...baseTask, ...task },
    listName: "Inbox",
    listColor: "#ccc",
    lists: [
      { id: 1, name: "Inbox", color: "#ccc" },
      { id: 2, name: "Work", color: "#eee" },
    ],
    hideDueBadge: false,
    hideListBadge: false,
    isOverdue: false,
    searchQuery: "",
    ...createFnMap(["onToggle", "onDelete", "onEdit"]),
    ...rest,
  };
}

describe("TaskCard coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRoutineTask.mockReturnValue(false);
    sessionStorage.clear();
    sleepWarningHookMock.mockReturnValue({
      sleepWarning: false,
      sleepWarningProps: {},
      checkSleepAndRun: (_dueDate, callback) => callback(),
    });
  });

  it("opens the edit modal and highlights search matches when the task is active in the timer", () => {
    sessionStorage.setItem("timerTaskId", "1");

    renderWithRouter(<TaskCard {...buildProps({ searchQuery: "book" })} />);

    expect(screen.getByText("book", { selector: "mark" })).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });



  it("covers routine and repeated completion flows and the study-now fallback color path", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const props = buildProps({ listColor: undefined, searchQuery: "zzz" });

    renderWithRouter(<TaskCard {...props} />);

    expect(screen.queryByText("zzz", { selector: "mark" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Mark complete/i));
    fireEvent.click(screen.getByLabelText(/Mark complete/i));
    fireEvent.click(screen.getByRole("button", { name: /Study now/i }));
    fireEvent.keyDown(screen.getByText("Read book").closest('[role="button"]'), { key: "Enter" });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(timerMock.setActiveTaskId).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ categoryColor: undefined, estimatedBlocks: 2 }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/timer", { state: { fromTaskPlay: true } });
    expect(screen.getByTestId("info-modal")).toBeInTheDocument();

    clearTimeoutSpy.mockRestore();
  });

  it("handles completed tasks and routine completions without showing celebration UI", () => {
    isRoutineTask.mockReturnValue(true);
    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, completed: true, priority: "low" }, isCompletedSection: true, lists: [], onEdit: undefined, listColor: undefined })} />);

    expect(screen.getByText("Completed label")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Study now/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Mark incomplete/i));
    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));

    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Move to list/i })).not.toBeInTheDocument();
    expect(completionMock.showCompletionToast).not.toHaveBeenCalled();
  });

  it("handles storage fallbacks and blocked session storage", () => {
    const original = window.sessionStorage;
    const blocked = { getItem: vi.fn(() => { throw new Error("b"); }), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };
    Object.defineProperty(window, "sessionStorage", { configurable: true, value: blocked });
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: blocked });

    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, id: 22 } })} />);
    expect(screen.getByText("Read book")).toBeInTheDocument();

    Object.defineProperty(window, "sessionStorage", { configurable: true, value: original });
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: original });
  });

  it("handles external timer task-id updates", async () => {
    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, id: 22 } })} />);
    const card = screen.getByTitle(/Right-click for more options/i);
    const initial = card.className;
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "timerTaskId", newValue: "22" }));
    });
    await waitFor(() => expect(card.className).not.toBe(initial));
  });

  it("handles burst cleanup after task completion", async () => {
    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, id: 22 } })} />);
    vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText(/Mark complete/i));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    vi.useRealTimers();
    expect(completionMock.showCompletionToast).toHaveBeenCalled();
  });

  it("handles edit-modal save and close callbacks", () => {
    const onEdit = vi.fn();
    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, id: 22 }, onEdit })} />);
    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onEdit).toHaveBeenCalledWith({ title: "Updated" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
  });

  it("covers non-matching storage events, default edit lists, link clicks, and non-enter keys", async () => {
    formatDueDate.mockReturnValueOnce({ label: "Soon", status: "mystery" });
    renderWithRouter(<TaskCard {...buildProps({ task: { ...buildProps().task, id: 22, priority: undefined, estimated_blocks: undefined }, lists: undefined })} />);
    const card = screen.getByTitle(/Right-click for more options/i);
    const initialClassName = card.className;

    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: "other-key", newValue: "22" })); });
    expect(card.className).toBe(initialClassName);

    fireEvent.keyDown(screen.getByText("Read book").closest('[role="button"]'), { key: " " });
    expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/Open KCL1 module/i));
    expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Study now/i }));
    expect(timerMock.setActiveTaskId).toHaveBeenCalledWith(22, expect.objectContaining({ estimatedBlocks: 1 }));

    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });



  it("renders the edit modal directly with its default list fallback", () => {
    render(
      <EditTaskModal
        task={buildProps().task}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });
});
