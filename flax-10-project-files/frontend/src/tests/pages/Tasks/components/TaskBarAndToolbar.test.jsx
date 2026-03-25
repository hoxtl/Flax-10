import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

const taskBarHookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useCreateTaskBar", () => ({
  default: taskBarHookMock,
}));

vi.mock("../../../../components/common/SleepWarningModal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, pill, variant, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/AnimatedDropdown", () => ({
  default: ({ value, onChange, options = [], placeholder }) => (
    <select aria-label={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">empty</option>
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../../../components/common/SearchBar", () => ({
  default: ({ value, onChange, onKeyDown, inputClassName, ...props }) => (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
    />
  ),
}));

import CreateTaskBar from "../../../../pages/Tasks/components/CreateTaskBar";
import {
  ToolbarSearch,
  ToolbarViewLists,
} from "../../../../pages/Tasks/components/TaskFeedToolbarParts";
import useTaskFeedResponsive from "../../../../pages/Tasks/components/useTaskFeedResponsive";

function buildTaskBarState(overrides = {}) {
  return {
    cardRef: { current: null },
    handleSubmit: vi.fn((event) => event.preventDefault()),
    handleInputBlur: vi.fn(),
    handleInputKeyDown: vi.fn(),
    inputRef: { current: null },
    sleepWarning: true,
    sleepWarningProps: {},
    title: "Read chapter",
    setTitle: vi.fn(),
    saving: false,
    setInputFocused: vi.fn(),
    showOptions: true,
    estimatedBlocks: 1,
    setEstimatedBlocks: vi.fn(),
    moduleId: "11",
    setModuleId: vi.fn(),
    taskListId: "2",
    setTaskListId: vi.fn(),
    sortedLists: [{ id: "1", name: "Inbox" }],
    moduleOptions: [{ value: "11", label: "KCL1" }],
    listOptions: [{ value: "2", label: "Coursework" }],
    isReadingList: true,
    pageCount: 12,
    setPageCount: vi.fn(),
    ...overrides,
  };
}

describe("Task bar and toolbar coverage", () => {
  it("covers reading-list fields, dropdown fallbacks, and sleep warnings", () => {
    const state = buildTaskBarState();
    taskBarHookMock.mockReturnValue(state);
    const externalInputRef = { current: null };

    render(<CreateTaskBar inputRef={externalInputRef} />);

    fireEvent.focus(screen.getByLabelText(/Quick add task/i));
    fireEvent.change(screen.getByLabelText(/Quick add task/i), { target: { value: "Write notes" } });
    fireEvent.blur(screen.getByLabelText(/Quick add task/i));
    fireEvent.keyDown(screen.getByLabelText(/Quick add task/i), { key: "Enter" });

    fireEvent.change(screen.getByLabelText("Page count"), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText("Page count"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Select list"), { target: { value: "" } });

    expect(state.setInputFocused).toHaveBeenCalledWith(true);
    expect(state.setTitle).toHaveBeenCalledWith("Write notes");
    expect(state.handleInputBlur).toHaveBeenCalled();
    expect(state.handleInputKeyDown).toHaveBeenCalled();
    expect(state.setPageCount).toHaveBeenCalledWith(24);
    expect(state.setPageCount).toHaveBeenCalledWith(null);
    expect(state.setModuleId).toHaveBeenCalledWith(null);
    expect(state.setTaskListId).toHaveBeenCalledWith("1");
    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
  });

  it("renders blank page counts and keeps selected module values when they are present", () => {
    const state = buildTaskBarState({
      pageCount: null,
      moduleId: "",
      moduleOptions: [
        { value: "11", label: "KCL1" },
        { value: "22", label: "KCL2" },
      ],
    });
    taskBarHookMock.mockReturnValue(state);

    render(<CreateTaskBar />);

    expect(screen.getByLabelText("Page count").value).toBe("");
    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "22" } });
    expect(state.setModuleId).toHaveBeenCalledWith("22");
  });

  it("clears search on escape, blurs the field, and opens the view-lists button", () => {
    const onSearchChange = vi.fn();
    const blur = vi.fn();

    render(
      <>
        <ToolbarSearch search="Essay" onSearchChange={onSearchChange} searchInputRef={{ current: null }} />
        <ToolbarViewLists onOpenLists={blur} />
      </>,
    );

    const input = screen.getByLabelText("Search tasks");
    input.blur = blur;
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.click(screen.getByText("View lists").closest("button"));

    expect(onSearchChange).toHaveBeenCalledWith("");
    expect(blur).toHaveBeenCalled();
  });

  it("tracks mobile viewport changes on resize", () => {
    let matches = false;
    window.matchMedia = vi.fn(() => ({ matches }));

    const { result } = renderHook(() => useTaskFeedResponsive());

    expect(result.current.isMobile).toBe(false);

    act(() => {
      matches = true;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.isMobile).toBe(true);
  });
});
