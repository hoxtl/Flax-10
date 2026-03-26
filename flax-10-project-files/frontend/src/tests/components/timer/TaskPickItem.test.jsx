import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskPickItem } from '../../../components/timer/task_input/TaskPickItem';

vi.mock('../../../pages/timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../components/timer/task_input/taskInputUtils', () => ({
  getTaskDurationLabel: (task) => `${task.estimated_blocks ?? 0} blocks`,
  getTaskUrgencyTone: (task) => task._urgency ?? 'cool',
}));

const makeTask = (overrides = {}) => ({
  id: 1,
  title: 'Test Task',
  module_code: null,
  list_name: 'Work',
  estimated_blocks: 2,
  ...overrides,
});

describe('TaskPickItem', () => {
  it('renders the task title', () => {
    render(<TaskPickItem task={makeTask()} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('renders the duration label', () => {
    render(<TaskPickItem task={makeTask({ estimated_blocks: 3 })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('3 blocks')).toBeTruthy();
  });

  it('renders the list name when no module_code', () => {
    render(<TaskPickItem task={makeTask({ list_name: 'Personal' })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Personal')).toBeTruthy();
  });

  it('renders module_code instead of list_name when present', () => {
    render(<TaskPickItem task={makeTask({ module_code: 'CS101', list_name: 'Work' })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('CS101')).toBeTruthy();
    expect(screen.queryByText('Work')).toBeNull();
  });

  it('calls onSelect with the task when clicked', () => {
    const onSelect = vi.fn();
    const task = makeTask();
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(task);
  });

  it('shows fire marker for hot urgency tasks', () => {
    render(<TaskPickItem task={makeTask({ _urgency: 'hot' })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('🔥')).toBeTruthy();
  });

  it('shows lion marker for non-hot tasks with a module_code', () => {
    render(<TaskPickItem task={makeTask({ module_code: 'MA101', _urgency: 'cool' })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('🦁')).toBeTruthy();
  });

  it('shows no marker for cool tasks without module_code', () => {
    render(<TaskPickItem task={makeTask({ _urgency: 'cool', module_code: null })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.queryByText('🔥')).toBeNull();
    expect(screen.queryByText('🦁')).toBeNull();
  });

  it('has the title attribute set', () => {
    render(<TaskPickItem task={makeTask({ title: 'Important' })} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').title).toBe('Important');
  });
});
