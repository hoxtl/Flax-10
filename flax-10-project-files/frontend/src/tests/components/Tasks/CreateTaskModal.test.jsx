/* Tests for the CreateTaskModal create and edit flows. */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTaskModal from '../../../pages/tasks/components/CreateTaskModal';

vi.mock('../../../pages/tasks/components/DateTimePicker', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input
            data-testid={`date-picker-${placeholder}`}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

<<<<<<< HEAD
vi.mock('../../../components/common/animated_dropdown', () => ({
=======
vi.mock('../../../components/common/AnimatedDropdown', () => ({
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    default: ({ value, onChange, options, placeholder }) => (
        <select
            aria-label={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    ),
}));

vi.mock('../../../components/ui/est_time_help_banner', () => ({
    default: () => <div data-testid="est-time-help" />,
}));

vi.mock('../../../components/common/sleep_warning_modal', () => ({
    SleepWarningModal: () => <div data-testid="sleep-warning-modal" />,
}));

vi.mock('../../../components/settings/hooks/useSleepWarning', () => ({
    useSleepWarning: vi.fn(() => ({
        sleepWarning: false,
        checkSleepAndRun: (_date, fn) => fn(),
        sleepWarningProps: {},
    })),
}));

vi.mock('../../../api/userApi', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' }),
}));

vi.mock('../../../pages/tasks/constants/focusBlockColours', () => ({
    FOCUS_BLOCK_COLOURS_HEX: ['#ff0000', '#00ff00'],
}));

const defaultLists = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Personal' },
];

const defaultProps = {
    lists: defaultLists,
    defaultListId: 1,
    defaultDueDate: '2025-06-15T12:00',
    onSave: vi.fn().mockResolvedValue(),
    onClose: vi.fn(),
};

describe('CreateTaskModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        defaultProps.onSave = vi.fn().mockResolvedValue();
        defaultProps.onClose = vi.fn();
    });

    it('renders "New task" title in create mode', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByText('New task')).toBeTruthy();
    });

    it('renders "Edit task" title in edit mode', () => {
        render(<CreateTaskModal {...defaultProps} mode="edit" initialTask={{ title: 'Old Task', due_date: '2025-06-15T12:00' }} />);
        expect(screen.getByText('Edit task')).toBeTruthy();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<CreateTaskModal {...defaultProps} onClose={onClose} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape is pressed on overlay', () => {
        const onClose = vi.fn();
        render(<CreateTaskModal {...defaultProps} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
    });

    it('renders task title input', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByLabelText(/Task name/)).toBeTruthy();
    });

    it('renders description input', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByPlaceholderText(/add a description/i)).toBeTruthy();
    });

    it('renders priority chips', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByText('Medium')).toBeTruthy();
        expect(screen.getByText('High')).toBeTruthy();
        expect(screen.getByText('Urgent')).toBeTruthy();
    });

    it('renders list selector with lists', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Personal')).toBeTruthy();
    });

    it('calls onSave with form data when save button clicked', async () => {
        const onSave = vi.fn().mockResolvedValue();
        render(<CreateTaskModal {...defaultProps} onSave={onSave} />);
        // Fill title
        const titleInput = screen.getByLabelText(/Task name/);
        fireEvent.change(titleInput, { target: { value: 'My new task' } });
        // Click "Add task" button
        const saveBtn = screen.getByText('Add task');
        fireEvent.click(saveBtn);
        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
                title: 'My new task',
                priority: 'medium',
            }));
        });
    });

    it('save button is disabled when title is empty', () => {
        render(<CreateTaskModal {...defaultProps} />);
        const saveBtn = screen.getByText('Add task');
        expect(saveBtn).toBeDisabled();
    });

    it('save button is enabled when title and due_date are set', () => {
        render(<CreateTaskModal {...defaultProps} />);
        const titleInput = screen.getByLabelText(/Task name/);
        fireEvent.change(titleInput, { target: { value: 'Task' } });
        const saveBtn = screen.getByText('Add task');
        expect(saveBtn).not.toBeDisabled();
    });

    it('shows "+ New List" option when onOpenCreateList is provided', () => {
        render(<CreateTaskModal {...defaultProps} onOpenCreateList={vi.fn()} />);
        expect(screen.getByText('+ New List')).toBeTruthy();
    });

    it('initializes form with initialTask data in edit mode', () => {
        render(<CreateTaskModal
            {...defaultProps}
            mode="edit"
            initialTask={{ title: 'Existing Task', description: 'Desc', priority: 'high', due_date: '2025-06-15T12:00', task_list: 1, estimated_blocks: 2 }}
        />);
        expect(screen.getByDisplayValue('Existing Task')).toBeTruthy();
    });

    it('shows study block options', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByText('25m')).toBeTruthy();
        expect(screen.getByText('50m')).toBeTruthy();
    });

    it('shows delete button in edit mode when onDeleteTask provided', () => {
        render(<CreateTaskModal {...defaultProps} mode="edit" initialTask={{ title: 'Task', due_date: '2025-06-15T12:00' }} onDeleteTask={vi.fn()} />);
        expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy();
    });
});
