import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskInput } from '../../../components/Timer/TimerComponents';

// Keep dropdowns testable (native controls)
vi.mock('../../../components/Common/AnimatedDropdown', () => ({
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
}));

import { fetchApi } from '../../../api/client.js';

const tasks = [
  { id: 1, title: 'Urgent task', completed: false, priority: 'urgent', task_list: 1, due_date: '2026-03-10T10:00:00Z', estimated_blocks: 1, module_code: 'CS101' },
  { id: 2, title: 'Low task', completed: false, priority: 'low', task_list: 2, due_date: null, estimated_blocks: 4, module_code: 'MA102' },
  { id: 3, title: 'High task', completed: false, priority: 'high', task_list: 1, due_date: '2026-03-09T10:00:00Z', estimated_blocks: 2, module_code: 'CS101' },
  { id: 4, title: 'Done task', completed: true, priority: 'medium', task_list: 1, due_date: null, estimated_blocks: 1, module_code: null },
];

const lists = [
  { id: 1, name: 'Work', color: '#111111' },
  { id: 2, name: 'Personal', color: '#222222' },
];

function renderTaskInput(props = {}) {
  const value = props.value ?? '';
  const onChange = props.onChange ?? vi.fn();
  const onTaskSelect = props.onTaskSelect ?? vi.fn();
  return render(<TaskInput value={value} onChange={onChange} onTaskSelect={onTaskSelect} />);
}

describe('TaskInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchApi.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.startsWith('/tasks/lists/')) return lists;
      if (typeof url === 'string' && url.startsWith('/tasks/')) return tasks;
      return null;
    });
  });

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

    fireEvent.click(screen.getByText('Urgent task'));
    expect(onChange).toHaveBeenCalledWith('Urgent task');
    expect(onTaskSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
