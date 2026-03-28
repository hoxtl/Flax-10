/*
 * Tests for TaskCard sub-components: EditTaskModal and TaskContextMenu.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EditTaskModal, TaskContextMenu } from '../../../../pages/tasks/components/TaskCard';

const navigateMock = vi.fn();
const getUserSettingsMock = vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
const sleepWarningState = {
  sleepWarning: false,
  checkSleepAndRun: (_date, fn) => fn(),
  sleepWarningProps: {},
};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: vi.fn(() => navigateMock) };
});
vi.mock('../../../../context/TimerContext', () => ({
  useTimerContext: vi.fn(() => ({ setActiveTaskId: vi.fn() })),
}));
vi.mock('../../../../context/TaskCompletionContext', () => ({
  useTaskCompletion: vi.fn(() => ({ showCompletionToast: vi.fn() })),
}));
vi.mock('../../../../lib/completionMessages', () => ({
  getCompletionMessage: vi.fn(() => 'Great job!'),
  isRoutineTask: vi.fn(() => false),
}));
vi.mock('../../../../api/userApi', () => ({
  getUserSettings: (...args) => getUserSettingsMock(...args),
}));
vi.mock('../../../../context/ToastContext', () => ({ useToast: vi.fn(() => vi.fn()) }));
vi.mock('../../../../api/readingApi', () => ({
  getReadingSpeed: vi.fn().mockResolvedValue({ avg_min_per_page: 1.6, is_personalised: true }),
}));
vi.mock('../../../../components/common/sleep_warning_modal', () => ({
  SleepWarningModal: () => <div data-testid="sleep-warning-modal" />,
}));
vi.mock('../../../../components/settings/hooks/useSleepWarning', () => ({
  useSleepWarning: vi.fn(() => sleepWarningState),
}));
vi.mock('../../../../components/common/inputs/DateTimePicker', () => ({
  default: ({ value, onChange, placeholder }) => (
    <input data-testid="date-picker" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  ),
}));
vi.mock('../../../../pages/tasks/components/CreateTaskModal', () => ({
  default: ({ onClose, onSave, mode }) => (
    <div data-testid="create-task-modal">
      <span>{mode === 'edit' ? 'Edit' : 'Create'} task modal</span>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSave({ title: 'Updated' })}>Save</button>
    </div>
  ),
}));
vi.mock('../../../../components/task_celebration/CheckBurst', () => ({
  CheckBurst: ({ children }) => <div data-testid="check-burst">{children}</div>,
}));
vi.mock('../../../../components/common/animated_dropdown/AnimatedDropdown', () => ({
  default: ({ value, onChange, options }) => (
    <div data-testid="animated-dropdown">
      {(options || []).map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  ),
}));

const defaultTask = {
  id: 1, title: 'Buy groceries', completed: false, due_date: null,
  priority: 'medium', task_list: 1, estimated_blocks: 1,
};

describe('EditTaskModal', () => {
  it('renders the CreateTaskModal in edit mode', () => {
    render(
      <MemoryRouter>
        <EditTaskModal
          task={defaultTask}
          onSave={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
          lists={[{ id: 1, name: 'Shopping' }]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Edit task modal')).toBeTruthy();
  });
});

describe('TaskContextMenu', () => {
  const menuProps = {
    task: defaultTask,
    onEditOpen: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn().mockResolvedValue({}),
    lists: [{ id: 1, name: 'Shopping' }, { id: 2, name: 'Work' }],
    pos: { x: 100, y: 100 },
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sleepWarningState.sleepWarning = false;
    sleepWarningState.checkSleepAndRun = (_date, fn) => fn();
    sleepWarningState.sleepWarningProps = {};
    getUserSettingsMock.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
  });

  it('renders Edit option', () => {
    render(<TaskContextMenu {...menuProps} />);
    expect(screen.getByText('Edit')).toBeTruthy();
  });

  it('renders Delete option', () => {
    render(<TaskContextMenu {...menuProps} />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('calls onEditOpen when Edit is clicked', () => {
    const onEditOpen = vi.fn();
    render(<TaskContextMenu {...menuProps} onEditOpen={onEditOpen} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEditOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when Delete is clicked', () => {
    const onDelete = vi.fn();
    render(<TaskContextMenu {...menuProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows Move to list when lists provided', () => {
    render(<TaskContextMenu {...menuProps} />);
    expect(screen.getByText('Move to list')).toBeTruthy();
  });

  it('shows move view when Move to list is clicked', () => {
    render(<TaskContextMenu {...menuProps} />);
    fireEvent.click(screen.getByText('Move to list'));
    expect(screen.getByText('Shopping')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
  });

  it('calls onClose when clicking outside', () => {
    const onClose = vi.fn();
    render(<TaskContextMenu {...menuProps} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when moving to different list', async () => {
    const onEdit = vi.fn().mockResolvedValue({});
    render(<TaskContextMenu {...menuProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Move to list'));
    fireEvent.click(screen.getByText('Work'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('supports due date view and clearing due date', async () => {
    const onEdit = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();
    render(
      <TaskContextMenu
        {...menuProps}
        task={{ ...defaultTask, due_date: '2026-03-11T10:00' }}
        onEdit={onEdit}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Set due date'));
    fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '' } });
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(
      { due_date: null },
      { source: 'context-menu', action: 'set-due-date', dueDate: null },
    ));
    expect(onClose).toHaveBeenCalled();
  });

  it('supports due date set with sleep warning check callback', async () => {
    const onEdit = vi.fn().mockResolvedValue({});
    sleepWarningState.checkSleepAndRun = (date, fn) => {
      expect(date).toBe('2026-03-12T09:00');
      fn();
    };
    render(<TaskContextMenu {...menuProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Set due date'));
    fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '2026-03-12T09:00' } });
    fireEvent.click(screen.getByText('Set date'));
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(
      { due_date: '2026-03-12T09:00' },
      { source: 'context-menu', action: 'set-due-date', dueDate: '2026-03-12T09:00' },
    ));
  });

  it('shows sleep warning modal when hook indicates warning', () => {
    sleepWarningState.sleepWarning = true;
    sleepWarningState.sleepWarningProps = { test: true };
    render(<TaskContextMenu {...menuProps} />);
    expect(screen.getByTestId('sleep-warning-modal')).toBeTruthy();
  });

  it('uses fallback sleep settings when user settings request fails', async () => {
    getUserSettingsMock.mockRejectedValueOnce(new Error('settings fail'));
    render(<TaskContextMenu {...menuProps} />);
    await waitFor(() => expect(getUserSettingsMock).toHaveBeenCalled());
  });

  it('does not render move option when lists are empty', () => {
    render(<TaskContextMenu {...menuProps} lists={[]} />);
    expect(screen.queryByText('Move to list')).toBeNull();
  });
});
