import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskPickItem } from '../../../components/timer/task_input/TaskPickItem';

vi.mock('../../../pages/timer/TimerPage.module.css', () => ({
  default: {
    taskPickItem: 'taskPickItem',
    taskPickItemHot: 'taskPickItemHot',
    taskPickItemWarm: 'taskPickItemWarm',
    taskPickItemCool: 'taskPickItemCool',
    taskPickItemSelected: 'taskPickItemSelected',
    taskPickItemRecommended: 'taskPickItemRecommended',
  },
}));

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
    const onSelect = vi.fn();
    render(<TaskPickItem task={makeTask()} selectedTaskId={null} recommendedTaskId={null} onSelect={onSelect} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('renders the duration label', () => {
    const task = makeTask({ estimated_blocks: 3 });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('3 blocks')).toBeTruthy();
  });

  it('renders the list name when no module_code', () => {
    const task = makeTask({ list_name: 'Personal' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Personal')).toBeTruthy();
  });

  it('renders module_code instead of list_name when present', () => {
    const task = makeTask({ module_code: 'CS101', list_name: 'Work' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
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
    const task = makeTask({ _urgency: 'hot' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('🔥')).toBeTruthy();
  });

  it('shows lion marker for non-hot tasks with a module_code', () => {
    const task = makeTask({ module_code: 'MA101', _urgency: 'cool' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('🦁')).toBeTruthy();
  });

  it('shows no marker for cool tasks without module_code', () => {
    const task = makeTask({ _urgency: 'cool', module_code: null });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.queryByText('🔥')).toBeNull();
    expect(screen.queryByText('🦁')).toBeNull();
  });

  it('applies the selected class when isSelected is true', () => {
    const task = makeTask({ id: 'active' });
    render(<TaskPickItem task={task} selectedTaskId="active" recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('taskPickItemSelected');
  });

  it('applies the recommended class when task is recommended', () => {
    const task = makeTask({ id: 50 });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={50} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('taskPickItemRecommended');
  });

  it('applies the hot class for hot urgency tasks', () => {
    const task = makeTask({ _urgency: 'hot' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('taskPickItemHot');
  });

  it('applies the warm class for warm urgency tasks', () => {
    const task = makeTask({ _urgency: 'warm' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('taskPickItemWarm');
  });

  it('has the title attribute set', () => {
    const task = makeTask({ title: 'Important' });
    render(<TaskPickItem task={task} selectedTaskId={null} recommendedTaskId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button').title).toBe('Important');
  });
});
