/*
 * Tests for homepage modal flows and callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HomepageModals } from '@/pages/homepage/components/HomepageModals';

vi.mock('@/components/calendar/utils/eventUtils', () => ({
  extractBaseEventId: vi.fn((id) => (typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id)),
}));
vi.mock('@/components/calendar/utils/dateUtils', () => ({
  isToday: vi.fn(() => true),
}));
vi.mock('@/pages/homepage/components/PlanReadDetailModal', () => ({
  PlanReadDetailModal: (props) => (
    <div data-testid="mock-modal">
      <button onClick={() => props.onEditEvent({ id: 'evt-1' })}>Edit Event</button>
      <button onClick={() => props.onDeleteEvent({ id: 'evt-1' })}>Delete Event</button>
      <button onClick={() => props.onEditTask({ id: 'task-1' })}>Edit Task</button>
      <button onClick={() => props.onDeleteTask({ id: 'task-1' })}>Delete Task</button>
      <button onClick={props.onClose}>Close</button>
    </div>
  ),
}));
vi.mock('@/pages/tasks/components/CreateTaskModal', () => ({
  default: (props) => (
    <div data-testid="task-modal">
      <button onClick={() => props.onSave({ title: 'T' }, { addToSchedule: false })}>Save</button>
      <button onClick={() => props.onSave({}, { addToSchedule: false })}>Save No Title</button>
      <button onClick={() => props.onSave({ title: 'Breakfast' }, { addToSchedule: true })}>Save Scheduled</button>
      <button onClick={() => props.onSave({ title: 'Breakfast', estimated_blocks: 2, description: 'desc' }, { addToSchedule: true })}>Save With Blocks</button>
      <button onClick={props.onOpenCreateList}>CreateList</button>
      <button onClick={props.onClose}>Close Task</button>
    </div>
  ),
}));
vi.mock('@/pages/tasks/components/CreateListModal', () => ({
  default: (props) => (
    <div data-testid="list-modal">
      <button onClick={() => props.onSave({ name: 'L' })}>Save</button>
      <button onClick={props.onClose}>Close List</button>
    </div>
  ),
}));
vi.mock('@/pages/tasks/components/TaskCard', () => ({
  EditTaskModal: (props) => (
    <div data-testid="edit-modal">
      <button onClick={() => props.onSave({ title: 'E' })}>Save</button>
      <button onClick={props.onDelete}>Delete</button>
      <button onClick={props.onClose}>Close Edit</button>
    </div>
  ),
}));

function createModalActionMocks() {
  return {
    addEvent: vi.fn().mockResolvedValue({}),
    createTask: vi.fn().mockResolvedValue({ id: 1, title: 'T' }),
    createTaskList: vi.fn().mockResolvedValue({ id: 2 }),
    deleteTask: vi.fn().mockResolvedValue({}),
    fetchTaskLists: vi.fn().mockResolvedValue([]),
    handleTimelineDelete: vi.fn().mockResolvedValue({}),
    openModal: vi.fn(),
    refetchTasks: vi.fn(),
    setLastCreatedListId: vi.fn(),
    setPlanTimelineReadItem: vi.fn(),
    setRescheduleTask: vi.fn(),
    setShowCreateListFromTask: vi.fn(),
    setShowCreateTaskModal: vi.fn(),
    setTaskLists: vi.fn(),
    showToast: vi.fn(),
    updateTask: vi.fn().mockResolvedValue({}),
  };
}

function buildProps(overrides = {}) {
  return {
    ...createModalActionMocks(),
    selectedDate: new Date(),
    ...overrides,
  };
}

describe('HomepageModals', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls createTask when CreateTaskSheet is saved', async () => {
    const props = buildProps({ showCreateTaskModal: true });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.createTask).toHaveBeenCalled();
  });

  it('calls setShowCreateListFromTask when CreateList is clicked', () => {
    const props = buildProps({ showCreateTaskModal: true });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('CreateList'));
    expect(props.setShowCreateListFromTask).toHaveBeenCalledWith(true);
  });

  it('calls createTaskList and closes when CreateListSheet is saved', async () => {
    const props = buildProps({ showCreateListFromTask: true });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.createTaskList).toHaveBeenCalled();
    expect(props.setShowCreateListFromTask).toHaveBeenCalledWith(false);
  });

  it('calls updateTask when EditTaskSheet is saved', async () => {
    const props = buildProps({ rescheduleTask: { id: 1 } });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.updateTask).toHaveBeenCalledWith(1, { title: 'E' });
  });

  it('calls deleteTask when EditTaskSheet delete is clicked', async () => {
    const props = buildProps({ rescheduleTask: { id: 1 } });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Delete')); });
    expect(props.deleteTask).toHaveBeenCalledWith(1);
  });

  it('calls openModal when PlanReadSheet edit event is clicked', () => {
    const props = buildProps({ planTimelineReadItem: { event: { id: 'evt-1' } } });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Edit Event'));
    expect(props.openModal).toHaveBeenCalled();
  });

  it('calls handleTimelineDelete when PlanReadSheet delete event is clicked', async () => {
    const props = buildProps({ planTimelineReadItem: { event: { id: 'evt-1' } } });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Delete Event')); });
    expect(props.handleTimelineDelete).toHaveBeenCalled();
  });

  it('calls setPlanTimelineReadItem(null) when PlanReadSheet is closed', () => {
    const props = buildProps({ planTimelineReadItem: { event: { id: 'evt-1' } } });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Close'));
    expect(props.setPlanTimelineReadItem).toHaveBeenCalledWith(null);
  });

  it('closes CreateTaskSheet without saving', () => {
    const props = buildProps({ showCreateTaskModal: true });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Close Task'));
    expect(props.setShowCreateTaskModal).toHaveBeenCalledWith(false);
    expect(props.setLastCreatedListId).toHaveBeenCalledWith(null);
  });

  it('shows error toast when createTask throws', async () => {
    const props = buildProps({
      showCreateTaskModal: true,
      createTask: vi.fn().mockRejectedValue(new Error('fail')),
    });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.showToast).toHaveBeenCalledWith("Couldn't add task. Try again.");
  });

  it('assigns routine tag and schedules when title matches', async () => {
    const props = buildProps({ showCreateTaskModal: true, tags: [{ label: 'Routine', id: 99 }] });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save Scheduled')); });
    expect(props.createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 99 }));
    expect(props.addEvent).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith(expect.stringContaining('added to today'));
  });

  it('handles routine title with no tags', async () => {
    const props = buildProps({ showCreateTaskModal: true });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save Scheduled')); });
    expect(props.createTask).toHaveBeenCalledWith({ title: 'Breakfast' });
    expect(props.addEvent).toHaveBeenCalled();
  });

  it('uses tag.name when tag has no label', async () => {
    const props = buildProps({ showCreateTaskModal: true, tags: [{ name: 'Routine', id: 77 }] });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save Scheduled')); });
    expect(props.createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 77 }));
  });

  it('does not call addEvent when createTask returns null', async () => {
    const props = buildProps({
      showCreateTaskModal: true,
      createTask: vi.fn().mockResolvedValue(null),
    });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save Scheduled')); });
    expect(props.addEvent).not.toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith('Task added');
  });

  it('uses estimated_blocks and description when scheduling', async () => {
    const createTask = vi.fn().mockResolvedValue({ id: 1, title: 'Breakfast', description: 'My desc' });
    const props = buildProps({ showCreateTaskModal: true, tags: [{ label: 'Routine', id: 99 }], createTask });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save With Blocks')); });
    expect(props.addEvent).toHaveBeenCalledWith(expect.objectContaining({ description: 'My desc' }));
  });

  it('closes CreateListSheet without saving', () => {
    const props = buildProps({ showCreateListFromTask: true });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Close List'));
    expect(props.setShowCreateListFromTask).toHaveBeenCalledWith(false);
  });

  it('handles createTaskList returning no id', async () => {
    const props = buildProps({ showCreateListFromTask: true, createTaskList: vi.fn().mockResolvedValue({}) });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.setLastCreatedListId).not.toHaveBeenCalled();
  });

  it('handles fetchTaskLists returning non-array', async () => {
    const props = buildProps({ showCreateListFromTask: true, fetchTaskLists: vi.fn().mockResolvedValue(null) });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(props.setTaskLists).toHaveBeenCalledWith([]);
  });

  it('calls setRescheduleTask(null) when EditTaskSheet is closed', () => {
    const props = buildProps({ rescheduleTask: { id: 1 } });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Close Edit'));
    expect(props.setRescheduleTask).toHaveBeenCalledWith(null);
  });

  it('calls setRescheduleTask when PlanReadSheet edit task is clicked', () => {
    const props = buildProps({ planTimelineReadItem: { event: { id: 'evt-1' } } });
    render(<HomepageModals {...props} />);
    fireEvent.click(screen.getByText('Edit Task'));
    expect(props.setRescheduleTask).toHaveBeenCalledWith({ id: 'task-1' });
  });

  it('calls deleteTask when PlanReadSheet delete task is clicked', async () => {
    const props = buildProps({ planTimelineReadItem: { event: { id: 'evt-1' } } });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Delete Task')); });
    expect(props.deleteTask).toHaveBeenCalledWith('task-1');
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it('handles undefined title without throwing', async () => {
    const props = buildProps({ showCreateTaskModal: true });
    render(<HomepageModals {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('Save No Title')); });
    expect(props.createTask).toHaveBeenCalled();
  });
});
