import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearTask, openPicker, pickRecommendedTask, selectTask } from "../../../components/timer/TaskInput";

<<<<<<< HEAD
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
=======
// Keep dropdowns testable (native controls)
vi.mock('../../../components/common/AnimatedDropdown', () => ({
  default: ({ value, onChange, options }) => (
    <select
      role="combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

// TaskInput dynamically imports taskService, which calls fetchApi from api/client.js.
// Mocking fetchApi avoids brittle dynamic-import module-id mocking.
vi.mock('../../../api/client.js', () => ({
  fetchApi: vi.fn(),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
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
=======
  it('opens task picker and loads tasks/lists', async () => {
    renderTaskInput();
    fireEvent.click(screen.getByText('Choose a task to focus'));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalled();
    });

    expect(screen.getByText('Select a Task')).toBeTruthy();
    expect(screen.getByText('Urgent task')).toBeTruthy();
    expect(screen.getByText('High task')).toBeTruthy();
  });

  it('search filters tasks by title', async () => {
    renderTaskInput();
    fireEvent.click(screen.getByText('Choose a task to focus'));
    await waitFor(() => expect(fetchApi).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/Search tasks/i), { target: { value: 'urgent' } });
    expect(screen.getByText('Urgent task')).toBeTruthy();
    expect(screen.queryByText('Low task')).toBeNull();
  });

  it('sort by due date prioritizes tasks with due_date', async () => {
    renderTaskInput();
    fireEvent.click(screen.getByText('Choose a task to focus'));
    await waitFor(() => expect(fetchApi).toHaveBeenCalled());

    const sortSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(sortSelect, { target: { value: 'due' } });
    await waitFor(() => expect(fetchApi).toHaveBeenCalledTimes(4));
    const list = document.querySelector('[class*="taskPickList"]');
    const items = Array.from(list.querySelectorAll('button')).map((b) => b.textContent);
    expect(items[0]).toContain('High task');
  });

  it('filters by list and module', async () => {
    renderTaskInput();
    fireEvent.click(screen.getByText('Choose a task to focus'));
    await waitFor(() => expect(fetchApi).toHaveBeenCalled());

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Task filters' })).toBeTruthy());

    // Filter list: Work (id 1)
    fireEvent.click(screen.getByLabelText('Work'));
    await waitFor(() => expect(screen.queryByText('Low task')).toBeNull());
    expect(screen.getByText('Urgent task')).toBeTruthy();

    // Filter module: CS101
    fireEvent.click(screen.getByText('Modules'));
    fireEvent.click(screen.getByLabelText('CS101'));
    await waitFor(() => expect(screen.queryByText('Low task')).toBeNull());
    expect(screen.getByText('Urgent task')).toBeTruthy();
  });

  it('selecting a task updates value and calls onTaskSelect', async () => {
    const onChange = vi.fn();
    const onTaskSelect = vi.fn();
    renderTaskInput({ onChange, onTaskSelect });
    fireEvent.click(screen.getByText('Choose a task to focus'));
    await waitFor(() => expect(fetchApi).toHaveBeenCalled());
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
