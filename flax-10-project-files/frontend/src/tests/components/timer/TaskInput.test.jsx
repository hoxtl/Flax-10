import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearTask, openPicker, pickRecommendedTask, selectTask } from "../../../components/timer/TaskInput";

const taskPickerState = {
  open: false,
  loadTasks: vi.fn(),
  setOpen: vi.fn(),
  setSelectedTaskId: vi.fn(),
  setRecommendedTaskId: vi.fn(),
  recommendedTask: null,
};

vi.mock("../../../components/timer/task_input/useTaskPickerData", () => ({
  useTaskPickerData: vi.fn(() => ({
    ref: { current: null },
    filterWrapRef: { current: null },
    ...taskPickerState,
  })),
}));

vi.mock("../../../components/timer/task_input/TaskPickerModal", () => ({
  TaskPickerModal: ({ onSelect, onPickForMe }) => (
    <div>
      <button onClick={() => onSelect({ id: 7, title: "Deep Work" })}>Pick task</button>
      <button onClick={onPickForMe}>Smart Pick</button>
    </div>
  ),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import { TaskInput } from "../../../components/timer/TaskInput";

describe("TaskInput coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    taskPickerState.open = false;
    taskPickerState.recommendedTask = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the picker lazily, selects tasks, and clears the current value", () => {
    const onChange = vi.fn();
    const onClearTask = vi.fn();
    const onTaskSelect = vi.fn();

    render(<TaskInput value="Essay" onChange={onChange} onClearTask={onClearTask} onTaskSelect={onTaskSelect} onOpenFocus={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear task" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(onClearTask).toHaveBeenCalled();
    expect(taskPickerState.setSelectedTaskId).toHaveBeenCalledWith(null);
    expect(taskPickerState.setRecommendedTaskId).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "Change task" }));
    expect(taskPickerState.loadTasks).toHaveBeenCalledTimes(1);
    expect(taskPickerState.setOpen).toHaveBeenCalledWith(expect.any(Function));

    fireEvent.click(screen.getByText("Pick task"));
    expect(onChange).toHaveBeenCalledWith("Deep Work");
    expect(onTaskSelect).toHaveBeenCalledWith({ id: 7, title: "Deep Work" });
  });

  it("runs the recommended-task path when a recommendation is available", async () => {
    const onChange = vi.fn();
    const onTaskSelect = vi.fn();
    taskPickerState.recommendedTask = { id: 9, title: "Recommended" };

    render(<TaskInput value="" onChange={onChange} onTaskSelect={onTaskSelect} />);

    fireEvent.click(screen.getByText("Smart Pick"));
    expect(taskPickerState.setRecommendedTaskId).toHaveBeenCalledWith(9);

    await act(async () => {
      vi.advanceTimersByTime(140);
    });

    expect(onChange).toHaveBeenCalledWith("Recommended");
    expect(onTaskSelect).toHaveBeenCalledWith({ id: 9, title: "Recommended" });
  });

  it("opens the picker only when not already open", () => {
    const s = { ...taskPickerState };
    openPicker(s);
    expect(s.loadTasks).toHaveBeenCalledTimes(1);
    s.open = true;
    openPicker(s);
    expect(s.loadTasks).toHaveBeenCalledTimes(1);
  });
  it("clears the current task and resets state", () => {
    const s = { ...taskPickerState }, onChange = vi.fn(), onClear = vi.fn();
    clearTask(s, onChange, onClear);
    expect(s.setSelectedTaskId).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalled();
  });
  it("selects a task and triggers onChange", () => {
    const s = { ...taskPickerState }, onChange = vi.fn(), onSelect = vi.fn();
    selectTask({ id: 11, title: "Essay" }, s, onChange, onSelect);
    expect(onChange).toHaveBeenCalledWith("Essay");
    expect(onSelect).toHaveBeenCalledWith({ id: 11, title: "Essay" });
  });
  it("does nothing in pickRecommendedTask when no recommendation exists", async () => {
    const s = { ...taskPickerState }, onChange = vi.fn(), onSelect = vi.fn();
    pickRecommendedTask(s, onChange, onSelect);
    await act(async () => { vi.advanceTimersByTime(150); });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
