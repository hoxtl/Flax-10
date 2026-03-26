/* Tests for CreateTaskBar component rendering and user interactions */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateTaskBar from "../../../../pages/Tasks/components/CreateTaskBar";
import { createFnMap } from "../../../utils/factoryUtils";

const hookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useCreateTaskBar", () => ({
  default: hookMock,
}));

vi.mock("../../../../components/common/SleepWarningModal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/AnimatedDropdown", () => ({
  default: ({ value, onChange, options, placeholder }) => (
    <select aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
}));

const taskBarActionNames = [
  "setTitle",
  "setInputFocused",
  "handleInputBlur",
  "handleInputKeyDown",
  "setEstimatedMinutes",
  "setModuleId",
  "setTaskListId",
];

const baseTaskBarState = {
  cardRef: { current: null },
  title: "",
  saving: false,
  inputRef: { current: null },
  showOptions: true,
  estimatedMinutes: 25,
  moduleId: "",
  taskListId: "",
  sortedLists: [{ id: 1, name: "Inbox" }],
  moduleOptions: [{ value: "", label: "None" }],
  listOptions: [{ value: "1", label: "Inbox" }],
  sleepWarning: false,
  sleepWarningProps: {},
};

function state(overrides = {}) {
  return {
    ...baseTaskBarState,
    ...createFnMap(taskBarActionNames),
    handleSubmit: vi.fn((e) => e?.preventDefault?.()),
    ...overrides,
  };
}

describe("CreateTaskBar", () => {
  it("renders input and options", () => {
    hookMock.mockReturnValue(state());
    render(<CreateTaskBar inputRef={{ current: null }} />);
    expect(screen.getByLabelText(/Quick add task/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Estimated duration/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Custom estimated minutes/i)).toBeInTheDocument();
  });

  it("submits and changes values", () => {
    const s = state();
    hookMock.mockReturnValue(s);
    const { container } = render(<CreateTaskBar inputRef={{ current: null }} />);
    fireEvent.change(screen.getByLabelText(/Quick add task/i), { target: { value: "Read" } });
    fireEvent.submit(container.querySelector("[data-create-task-bar-card]"));
    expect(s.setTitle).toHaveBeenCalledWith("Read");
    expect(s.handleSubmit).toHaveBeenCalled();
  });

  it("renders sleep warning modal", () => {
    hookMock.mockReturnValue(state({ sleepWarning: true }));
    render(<CreateTaskBar inputRef={{ current: null }} />);
    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
  });

  it("shows page options for reading lists", () => {
    const s = state({ isReadingList: true, moduleOptions: [], listOptions: [] });
    hookMock.mockReturnValue(s);
    render(<CreateTaskBar inputRef={{ current: null }} />);
    expect(screen.queryByRole("group", { name: /Estimated duration/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Page count")).toBeInTheDocument();
  });

  it("normalizes empty module and list values on change", () => {
    const s = state({
      setModuleId: vi.fn(),
      setTaskListId: vi.fn(),
      sortedLists: [{ id: 1, name: "Inbox" }],
      moduleOptions: [{ value: "", label: "A" }],
      listOptions: [{ value: "", label: "B" }],
    });
    hookMock.mockReturnValue(s);
    render(<CreateTaskBar inputRef={{ current: null }} />);
    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Select list"), { target: { value: "" } });
    expect(s.setModuleId).toHaveBeenCalledWith(null);
    expect(s.setTaskListId).toHaveBeenCalledWith(1);
  });
});
