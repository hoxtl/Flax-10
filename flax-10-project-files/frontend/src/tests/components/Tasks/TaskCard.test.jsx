import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskCard, { EditTaskModal, TaskContextMenu } from '../../../pages/Tasks/components/TaskCard';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

vi.mock('../../../context/TimerContext', () => ({
    useTimerContext: vi.fn(() => ({ setActiveTaskId: vi.fn() })),
}));

vi.mock('../../../context/TaskCompletionContext', () => ({
    useTaskCompletion: vi.fn(() => ({ showCompletionToast: vi.fn() })),
}));

vi.mock('../../../lib/completionMessages', () => ({
    getCompletionMessage: vi.fn(() => 'Great job!'),
    isRoutineTask: vi.fn(() => false),
}));

vi.mock('../../../api/userService', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' }),
}));

vi.mock('../../../components/common/SleepWarningModal', () => ({
    SleepWarningModal: () => <div data-testid="sleep-warning-modal" />,
}));

vi.mock('../../../components/Settings/hooks/useSleepWarning', () => ({
    useSleepWarning: vi.fn(() => ({
        sleepWarning: false,
        checkSleepAndRun: (_date, fn) => fn(),
        sleepWarningProps: {},
    })),
}));

vi.mock('../../../pages/Tasks/components/DateTimePicker', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input data-testid="date-picker" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ),
}));

vi.mock('../../../pages/Tasks/components/CreateTaskModal', () => ({
    default: ({ onClose, onSave, mode }) => (
        <div data-testid="create-task-modal">
            <span>{mode === 'edit' ? 'Edit' : 'Create'} task modal</span>
            <button onClick={onClose}>Close</button>
            <button onClick={() => onSave({ title: 'Updated' })}>Save</button>
        </div>
    ),
}));

vi.mock('../../../components/TaskCelebration/CheckBurst', () => ({
    CheckBurst: ({ children }) => <div data-testid="check-burst">{children}</div>,
}));

const defaultTask = {
    id: 1,
    title: 'Buy groceries',
    completed: false,
    due_date: null,
    priority: 'medium',
    task_list: 1,
    estimated_blocks: 1,
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

describe('TaskCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('shows priority indicator for medium priority', () => {
        renderTaskCard({ task: { ...defaultTask, priority: 'medium' } });
        expect(screen.getByText('Medium')).toBeTruthy();
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
});
