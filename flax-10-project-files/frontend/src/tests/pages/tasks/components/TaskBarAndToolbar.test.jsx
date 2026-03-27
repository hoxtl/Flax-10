/**
 * Covers Task bar and toolbar rendering paths.
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

import { createFnMap } from "../../../utils/testBuilderUtils";

const taskBarHookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/tasks/hooks/useCreateTaskBar", () => ({
  default: taskBarHookMock,
}));

vi.mock("../../../../components/common/sleep_warning_modal", () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning" />,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, pill, variant, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
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

vi.mock("../../../../components/common/search_bar", () => ({
  default: ({ value, onChange, onKeyDown, inputClassName, ...props }) => (
    <input
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
    />
  ),
}));

import CreateTaskBar from "../../../../pages/tasks/components/CreateTaskBar";
import {
  ToolbarSearch,
  ToolbarViewLists,
} from "../../../../pages/tasks/components/TaskFeedToolbarParts";
import useTaskFeedResponsive from "../../../../pages/tasks/components/useTaskFeedResponsive";

const taskBarDefaults = {
  title: "",
  saving: false,
  showOptions: true,
  estimatedMinutes: 25,
  moduleId: "",
  taskListId: "",
  sortedLists: [{ id: "1", name: "Inbox" }],
  moduleOptions: [{ value: "", label: "None" }],
  listOptions: [{ value: "1", label: "Inbox" }],
  sleepWarning: false,
  sleepWarningProps: {},
};

function buildTaskBarState(overrides = {}) {
  return {
    handleSubmit: vi.fn((event) => event.preventDefault()),
    cardRef: { current: null },
    inputRef: { current: null },
    isReadingList: false,
    pageCount: 12,
    ...taskBarDefaults,
    ...createFnMap(["handleInputBlur", "handleInputKeyDown", "setTitle", "setInputFocused", "setEstimatedMinutes", "setModuleId", "setTaskListId", "setPageCount"]),
    ...overrides,
  };
}

describe("Task bar and toolbar coverage", () => {
  it("covers reading-list fields, dropdown fallbacks, and sleep warnings", () => {
    const state = buildTaskBarState({ isReadingList: true, sleepWarning: true }); taskBarHookMock.mockReturnValue(state);
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
    expect(state.setPageCount).toHaveBeenCalledWith(24);
    expect(state.setTaskListId).toHaveBeenCalledWith("1");
    expect(screen.getByTestId("sleep-warning")).toBeInTheDocument();
  });

  it("renders blank page counts and keeps selected module values when they are present", () => {
    const state = buildTaskBarState({
      isReadingList: true,
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
