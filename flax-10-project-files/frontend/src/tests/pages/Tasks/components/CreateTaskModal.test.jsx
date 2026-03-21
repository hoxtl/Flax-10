/* Tests for CreateTaskModal component rendering and user interactions */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateTaskModal from "../../../../pages/Tasks/components/CreateTaskModal";

const hookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useCreateTaskModal", () => ({
  useCreateTaskModal: hookMock,
}));

vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ onChange }) => <button data-testid="dt" onClick={() => onChange("2026-03-10T10:00")}>dt</button>,
}));
vi.mock("../../../../components/common/SleepWarningModal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

function state(overrides = {}) {
  return {
    isEditMode: false,
    onClose: vi.fn(),
    form: { title: "Task", description: "Desc", due_date: "2026-03-09T09:00", estimated_blocks: 1, task_list: "1", priority: "", module: "" },
    set: vi.fn(),
    setForm: vi.fn(),
    askFlaxInitialMessage: "ask",
    categoryOptions: [{ value: "1", label: "Inbox" }],
    selectedListColor: "#aaa",
    handleCategoryChange: vi.fn(),
    sortedModules: [{ id: 10, module_code: "KCL1" }],
    showAddToScheduleToggle: true,
    addToSchedule: false,
    setAddToSchedule: vi.fn(),
    saveError: "",
    onDeleteTask: vi.fn(),
    saving: false,
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
    sleepWarning: false,
    sleepWarningProps: {},
    ...overrides,
  };
}

describe("CreateTaskModal", () => {
  it("renders create modal and saves", () => {
    const s = state();
    hookMock.mockReturnValue(s);
    render(<CreateTaskModal />);
    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));
    expect(s.handleSave).toHaveBeenCalled();
  });

  it("renders edit mode and delete", () => {
    const s = state({ isEditMode: true });
    hookMock.mockReturnValue(s);
    render(<CreateTaskModal onDeleteTask={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Delete task/i }));
    expect(s.handleDelete).toHaveBeenCalled();
  });

  it("shows warning modal", () => {
    hookMock.mockReturnValue(state({ sleepWarning: true }));
    render(<CreateTaskModal />);
    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
  });
});
