/* Tests for CreateTaskBar component rendering and user interactions */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateTaskBar from "../../../../pages/tasks/components/CreateTaskBar";
import { createFnMap } from "../../../utils/testBuilderUtils";

const hookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/tasks/hooks/useCreateTaskBar", () => ({
  default: hookMock,
}));

vi.mock("../../../../components/common/sleep_warning_modal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
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
  "setListError",
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
  listError: false,
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

  it("hides the add button when the title is blank and hides options when collapsed", () => {
    hookMock.mockReturnValue(state({ title: "   ", showOptions: false }));
    render(<CreateTaskBar inputRef={{ current: null }} />);

    expect(screen.queryByRole("button", { name: /Add task/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Estimated duration/i })).not.toBeInTheDocument();
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

  it("keeps explicit list values, forwards module values, and clears page count", () => {
    const s = state({
      isReadingList: true,
      pageCount: 42,
      setPageCount: vi.fn(),
      setModuleId: vi.fn(),
      setTaskListId: vi.fn(),
      sortedLists: [],
      moduleOptions: [{ value: "12", label: "Maths" }],
      listOptions: [{ value: "7", label: "Readings" }],
    });
    hookMock.mockReturnValue(s);
    render(<CreateTaskBar inputRef={{ current: null }} />);

    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Select list"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Page count"), { target: { value: "" } });

    expect(s.setModuleId).toHaveBeenCalledWith("12");
    expect(s.setTaskListId).toHaveBeenCalledWith("7");
    expect(s.setPageCount).toHaveBeenCalledWith(null);
  });

  it("renders the list dropdown in its error state", () => {
    hookMock.mockReturnValue(state({ listError: true }));
    render(<CreateTaskBar inputRef={{ current: null }} />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByLabelText("Select list")).toBeInTheDocument();
  });

  it("disables the add button while saving and normalizes empty selections without fallbacks", () => {
    const s = state({
      title: "Write essay",
      saving: true,
      moduleId: null,
      setModuleId: vi.fn(),
      setTaskListId: vi.fn(),
      sortedLists: undefined,
      moduleOptions: [{ value: "", label: "None" }],
      listOptions: [{ value: "", label: "Empty" }],
    });
    hookMock.mockReturnValue(s);

    render(<CreateTaskBar inputRef={{ current: null }} />);

    expect(screen.getByRole("button", { name: /Add task/i })).toBeDisabled();
    expect(screen.getByLabelText("Module").value).toBe("");

    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Select list"), { target: { value: "" } });

    expect(s.setModuleId).toHaveBeenCalledWith(null);
    expect(s.setTaskListId).toHaveBeenCalledWith("");
  });

  it("covers input focus handlers and page count conversion", () => {
    const s = state({ title: "Read chapter", isReadingList: true, pageCount: 12, setPageCount: vi.fn(), sortedLists: [{ id: "1", name: "Inbox" }], listOptions: [{ value: "", label: "Select" }] });
    hookMock.mockReturnValue(s);
    render(<CreateTaskBar inputRef={{ current: null }} />);
    const input = screen.getByLabelText(/Quick add task/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Read chapter 2" } });
    fireEvent.blur(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Page count"), { target: { value: "24" } });
    expect(screen.getByRole("button", { name: /Add task/i })).toBeInTheDocument();
    expect(s.setInputFocused).toHaveBeenCalledWith(true);
    expect(s.setTitle).toHaveBeenCalledWith("Read chapter 2");
    expect(s.handleInputBlur).toHaveBeenCalled();
    expect(s.handleInputKeyDown).toHaveBeenCalled();
    expect(s.setPageCount).toHaveBeenCalledWith(24);
  });

  it("falls back to the first sorted list when the selection is cleared", () => {
    const s = state({ title: "Read chapter", sortedLists: [{ id: "1", name: "Inbox" }], listOptions: [{ value: "", label: "Select" }] });
    hookMock.mockReturnValue(s);
    render(<CreateTaskBar inputRef={{ current: null }} />);
    fireEvent.change(screen.getByLabelText("Select list"), { target: { value: "" } });
    expect(s.setTaskListId).toHaveBeenCalledWith("1");
  });

  it("uses the internal input ref and empty dropdown value when external refs and task list ids are missing", () => {
    hookMock.mockReturnValue(
      state({
        taskListId: null,
      }),
    );

    render(<CreateTaskBar />);

    expect(screen.getByLabelText(/Quick add task/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Select list")).toBeInTheDocument();
  });
});
