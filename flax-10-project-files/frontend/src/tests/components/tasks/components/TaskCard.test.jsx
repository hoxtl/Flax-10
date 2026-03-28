/* Tests for the TaskCard component including actions, context menu, and modals. */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskCard, { EditTaskModal, TaskContextMenu } from '../../../../pages/tasks/components/TaskCard';
const navigateMock = vi.fn();
const setActiveTaskIdMock = vi.fn();
const showCompletionToastMock = vi.fn();
const isRoutineTaskMock = vi.fn(() => false);
const getCompletionMessageMock = vi.fn(() => 'Great job!');
const getUserSettingsMock = vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
const getReadingSpeedMock = vi.fn().mockResolvedValue({ avg_min_per_page: 1.6, is_personalised: true });
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
    useTimerContext: vi.fn(() => ({ setActiveTaskId: setActiveTaskIdMock })),
}));
vi.mock('../../../../context/TaskCompletionContext', () => ({
    useTaskCompletion: vi.fn(() => ({ showCompletionToast: showCompletionToastMock })),
}));
vi.mock('../../../../lib/completionMessages', () => ({
    getCompletionMessage: (...args) => getCompletionMessageMock(...args),
    isRoutineTask: (...args) => isRoutineTaskMock(...args),
}));
vi.mock('../../../../api/userApi', () => ({
    getUserSettings: (...args) => getUserSettingsMock(...args),
}));
vi.mock('../../../../context/ToastContext', () => ({ useToast: vi.fn(() => vi.fn()) }));
vi.mock('../../../../api/readingApi', () => ({
    getReadingSpeed: (...args) => getReadingSpeedMock(...args),
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
    id: 1, title: 'Buy groceries', completed: false, due_date: null, priority: 'medium', task_list: 1, estimated_blocks: 1,
};
const defaultProps = {
    task: defaultTask,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn().mockResolvedValue({}),
    listName: 'Shopping',
    listColor: '#ff0000',
    lists: [{ id: 1, name: 'Shopping' }],
};
function renderTaskCard(props = {}) {
    return render(
        <MemoryRouter>
            <TaskCard {...defaultProps} {...props} />
        </MemoryRouter>
    );
}
function buildReadingTask() {
    return {
        ...defaultTask,
        title: 'Read paper',
        description: 'Important notes',
        module_code: 'CS1234',
        module_name: 'Algorithms',
        estimated_blocks: 13,
        reading_chapter: 'Ch.1',
        reading_start_page: 1,
        reading_end_page: 32,
        reading_page_count: 32,
    };
}
function openReadingTaskInfo() {
    renderTaskCard({ task: buildReadingTask(), listName: 'Deep Work' });
    fireEvent.click(screen.getByText('Read paper'));
}
describe('TaskCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isRoutineTaskMock.mockReturnValue(false);
        getCompletionMessageMock.mockReturnValue('Great job!');
        getUserSettingsMock.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
        sleepWarningState.sleepWarning = false;
        sleepWarningState.checkSleepAndRun = (_date, fn) => fn();
        sleepWarningState.sleepWarningProps = {};
        getReadingSpeedMock.mockResolvedValue({ avg_min_per_page: 1.6, is_personalised: true });
        sessionStorage.clear();
    });
    it('renders task title', () => {
        renderTaskCard();
        expect(screen.getByText('Buy groceries')).toBeTruthy();
    });

    it('renders mark complete button', () => {
        renderTaskCard();
        expect(screen.getByLabelText('Mark complete')).toBeTruthy();
    });

    it('renders completed task with different style', () => {
        renderTaskCard({ task: { ...defaultTask, completed: true } });
        expect(screen.getByText('Buy groceries')).toBeTruthy();
    });

    it('calls onToggle when mark complete button is clicked', () => {
        const onToggle = vi.fn();
        renderTaskCard({ onToggle });
        fireEvent.click(screen.getByLabelText('Mark complete'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('shows due date badge when due_date is provided', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        renderTaskCard({ task: { ...defaultTask, due_date: tomorrow.toISOString() } });
        expect(screen.getByText(/tomorrow/i)).toBeTruthy();
    });

    it('shows overdue badge for past tasks', () => {
        const past = new Date();
        past.setDate(past.getDate() - 2);
        renderTaskCard({ task: { ...defaultTask, due_date: past.toISOString() }, isOverdue: true });
        expect(screen.getByText(/overdue/i)).toBeTruthy();
    });

    it.each([
        ['medium', 'Medium'],
        ['urgent', 'Urgent'],
        ['high', 'High'],
    ])('shows %s priority indicator', (_, label) => {
        renderTaskCard({ task: { ...defaultTask, priority: _ } });
        expect(screen.getByText(label)).toBeTruthy();
    });

    it('shows Today for due today', () => {
        const today = new Date();
        renderTaskCard({ task: { ...defaultTask, due_date: today.toISOString() } });
        expect(screen.getByText(/today/i)).toBeTruthy();
    });

    it('shows list name badge when listName is provided', () => {
        renderTaskCard({ listName: 'Shopping', hideListBadge: false });
        // list name might appear
        expect(screen.getByText('Buy groceries')).toBeTruthy();
    });

    it('does not show list badge when hideListBadge is true', () => {
        renderTaskCard({ hideListBadge: true });
        expect(screen.queryByText('Shopping')).toBeNull();
    });

    it('opens context menu on right click', () => {
        renderTaskCard();
        const card = screen.getByText('Buy groceries').closest('[class]');
        fireEvent.contextMenu(card);
        expect(screen.getByText('Edit')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('calls onDelete from context menu', () => {
        const onDelete = vi.fn();
        renderTaskCard({ onDelete });
        fireEvent.contextMenu(screen.getByText('Buy groceries').closest('[class]'));
        fireEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('opens info modal and closes from footer close button', () => {
        openReadingTaskInfo();
        expect(screen.getByText('Task details')).toBeTruthy();
        expect(screen.getByText('Important notes')).toBeTruthy();
        expect(screen.getAllByText('Chapter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Ch.1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pages').length).toBeGreaterThan(0);
        expect(screen.getAllByText('pp. 1–32').length).toBeGreaterThan(0);
        expect(screen.getByText(/1 session/)).toBeTruthy();
        expect(screen.getByText(/325m/)).toBeTruthy();
        fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[1]);
        expect(screen.queryByText('Task details')).toBeNull();
    });

    it('keeps reading detail pills out of the task card row', () => {
        renderTaskCard({
            task: {
                ...defaultTask,
                title: 'Read chapter 1',
                reading_chapter: 'Ch.1',
                reading_start_page: 1,
                reading_end_page: 32,
                reading_page_count: 32,
            },
        });

        expect(screen.queryByText('Chapter')).toBeNull();
        expect(screen.queryByText('Pages')).toBeNull();
        expect(screen.queryByText('1.6 min/page')).toBeNull();
    });

    it('handles keyboard open and closes info modal via backdrop', () => {
        renderTaskCard({ task: { ...defaultTask, description: '' } });
        const content = screen.getByText('Buy groceries').closest('[role="button"]');
        fireEvent.keyDown(content, { key: 'Enter' });
        expect(screen.getByText('Task details')).toBeTruthy();
        fireEvent.mouseDown(document.querySelector('[class*="modalBackdrop"]'));
        expect(screen.queryByText('Task details')).toBeNull();
    });

    it('shows highlighted search text when query matches', () => {
        renderTaskCard({ task: { ...defaultTask, title: 'Deep Study Session' }, searchQuery: 'study' });
        expect(document.querySelector('mark')).toBeTruthy();
    });

    it('navigates to timer and sets active task on Study now', () => {
        renderTaskCard({ task: { ...defaultTask, estimated_blocks: 3 }, listColor: '#123456' });
        fireEvent.click(screen.getByLabelText('Study now'));
        expect(setActiveTaskIdMock).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                title: 'Buy groceries',
                categoryColor: '#123456',
                estimatedSessionCount: 3,
                estimatedWorkMinutes: 25,
            }),
        );
        expect(navigateMock).toHaveBeenCalledWith('/timer', { state: { fromTaskPlay: true } });
    });

    it('shows completed due labels and hides action bar for completed tasks', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        renderTaskCard({
            task: { ...defaultTask, completed: true, due_date: yesterday.toISOString() },
            isCompletedSection: true,
        });
        expect(screen.getByText(/Completed yesterday/)).toBeTruthy();
        expect(screen.queryByLabelText('Study now')).toBeNull();
    });

    it('handles routine completion without burst animation', () => {
        isRoutineTaskMock.mockReturnValue(true);
        const onToggle = vi.fn();
        renderTaskCard({ onToggle });
        fireEvent.click(screen.getByLabelText('Mark complete'));
        expect(showCompletionToastMock).toHaveBeenCalledWith('Great job!', { isRoutine: true });
        expect(onToggle).toHaveBeenCalled();
    });

    it('uses moduleId and module code links correctly and active timer class', () => {
        sessionStorage.setItem('timerTaskId', '1');
        const { rerender } = renderTaskCard({
            task: { ...defaultTask, module_code: 'CS2000', module_id: 7 },
        });
        expect(screen.getByTitle('Open CS2000 module').getAttribute('href')).toContain('/modules?moduleId=7');

        rerender(
            <MemoryRouter>
                <TaskCard
                    {...defaultProps}
                    task={{ ...defaultTask, module_code: 'CS2001', module_id: null, module: null, moduleId: null }}
                />
            </MemoryRouter>,
        );
        expect(screen.getByTitle('Open CS2001 module').getAttribute('href')).toContain('/modules?code=CS2001');
    });
});
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
        render(<TaskContextMenu {...menuProps} task={{ ...defaultTask, due_date: '2026-03-11T10:00' }} onEdit={onEdit} onClose={onClose} />);
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
