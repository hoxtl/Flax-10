/**
 * Covers CreateTaskModal field and mode behaviour.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { createFnMap } from "../../../utils/testBuilderUtils";

import CreateTaskModal from "../../../../pages/tasks/components/CreateTaskModal";

const hookMock = vi.hoisted(() => vi.fn());
const createTaskModalDefaults = {
  categoryOptions: [{ value: "1", label: "Inbox" }],
  selectedListColor: "#aaa",
  sortedModules: [{ id: 10, module_code: "KCL1", module_name: "Alpha" }],
  showAddToScheduleToggle: true,
  addToSchedule: false,
  saveError: "",
  saving: false,
  sleepWarning: false,
  sleepWarningProps: {},
  isReadingList: false,
};

vi.mock("../../../../pages/tasks/hooks/useCreateTaskModal", () => ({
  useCreateTaskModal: hookMock,
}));

vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange }) => (
    <div>
      <span data-testid="date-value">{value || "empty"}</span>
      <button type="button" onClick={() => onChange("2026-03-10T10:00")}>
        Set due
      </button>
    </div>
  ),
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ options = [], onChange, placeholder }) => (
    <div data-testid={placeholder}>
      {options.map((option) => (
        <button key={String(option.value)} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/common/sleep_warning_modal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, pill, variant, size, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children }) => <div data-testid="modal-shell">{children}</div>,
}));

vi.mock("../../../../components/common/text_input/TextInput", () => ({
  default: ({ multiline, inputClassName, ...props }) =>
    multiline ? <textarea {...props} /> : <input {...props} />,
}));

function buildForm(overrides = {}) {
  return {
    title: "Task",
    description: "Desc",
    due_date: "2026-03-09T09:00",
    estimated_blocks: 1,
    task_list: "1",
    priority: "",
    module: "",
    ...overrides,
  };
}

function buildState(overrides = {}) {
  const { form, ...rest } = overrides;
  const nextForm = buildForm(form);
  return {
    isEditMode: false,
    form: nextForm,
    ...createFnMap(["onClose", "set", "handleCategoryChange", "setAddToSchedule", "handleSave", "handleDelete"]),
    setForm: vi.fn((updater) => (typeof updater === "function" ? updater(nextForm) : updater)),
    ...createTaskModalDefaults,
    ...rest,
  };
}

describe("CreateTaskModal coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the create-mode field interactions", () => {
    const state = buildState(); hookMock.mockReturnValue(state);
    render(<CreateTaskModal addToScheduleLabel="Add to plan" />);
    fireEvent.change(screen.getByLabelText(/Task name/i), { target: { value: "Updated title" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Updated description" } });
    fireEvent.click(screen.getByRole("button", { name: "Set due" }));
    fireEvent.click(screen.getByRole("button", { name: "50 minutes (2 Pomodoro blocks)" }));
    fireEvent.click(screen.getByRole("button", { name: "Inbox" }));
    fireEvent.click(screen.getByRole("button", { name: "KCL1 – Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Medium" }));
    fireEvent.click(screen.getByLabelText(/Add to plan/i));
    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));

    expect(state.set).toHaveBeenCalledWith("title", "Updated title");
    expect(state.set).toHaveBeenCalledWith("description", "Updated description");
    expect(state.set).toHaveBeenCalledWith("due_date", "2026-03-10T10:00");
    expect(state.set).toHaveBeenCalledWith("module", "10");
    expect(state.set).toHaveBeenCalledWith("priority", "medium");
    expect(state.setForm).toHaveBeenCalled();
    expect(state.handleCategoryChange).toHaveBeenCalledWith("1");
    expect(state.setAddToSchedule).toHaveBeenCalledWith(true);
    expect(state.handleSave).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Delete task/i })).not.toBeInTheDocument();
  });

  it("covers edit-mode labels, validation messaging, and clearing an active priority", () => {
    const state = buildState({
      isEditMode: true, saveError: "Unable to save",
      form: { title: "Task", description: "Desc", due_date: "2026-03-09T09:00", estimated_blocks: 1, task_list: "1", priority: "medium", module: "10" }
    });
    hookMock.mockReturnValue(state);
    render(<CreateTaskModal onDeleteTask={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Medium" }));
    fireEvent.click(screen.getByRole("button", { name: /Delete task/i }));

    expect(state.set).toHaveBeenCalledWith("priority", "");
    expect(state.handleDelete).toHaveBeenCalled();
    expect(screen.queryByLabelText(/Add to today's schedule/i)).not.toBeInTheDocument();
  });

  it("shows the saving state and disables save when required fields are missing", () => {
    hookMock.mockReturnValue(
      buildState({
        saving: true,
        form: {
          title: "   ",
          description: "",
          due_date: "",
          estimated_blocks: 1,
          task_list: "",
          priority: "",
          module: "",
        },
      }),
    );

    render(<CreateTaskModal />);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("hides duration and module controls for reading lists without modules", () => {
    hookMock.mockReturnValue(
      buildState({
        isReadingList: true,
        selectedListColor: null,
        sortedModules: [],
        showAddToScheduleToggle: false,
      }),
    );

    render(<CreateTaskModal />);

    expect(screen.queryByText(/Est\. time/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Module")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Add to today's schedule/i)).not.toBeInTheDocument();
  });

  it("renders the sleep warning when the hook requests it", () => {
    hookMock.mockReturnValue(buildState({ sleepWarning: true }));

    render(<CreateTaskModal />);

    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
  });
});
