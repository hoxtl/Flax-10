/* Tests for the CreateTaskBar quick-add component. */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTaskBar from '../../../pages/Tasks/components/CreateTaskBar';

vi.mock('../../../api/moduleApi', () => ({
    getModules: vi.fn().mockResolvedValue([]),
    getEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../components/Modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn().mockReturnValue(false),
}));

vi.mock('../../../api/userApi', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' }),
}));

vi.mock('../../../components/Settings/hooks/useSleepWarning', () => ({
    useSleepWarning: vi.fn(() => ({
        sleepWarning: false,
        checkSleepAndRun: (_date, fn) => fn(),
        sleepWarningProps: {},
    })),
}));

vi.mock('../../../components/common/SleepWarningModal', () => ({
    SleepWarningModal: () => <div data-testid="sleep-warning-modal" />,
}));

vi.mock('../../../components/common/AnimatedDropdown', () => ({
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

const defaultLists = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Personal' },
];

describe('CreateTaskBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders quick add input', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        expect(screen.getByPlaceholderText('Quick add: what needs to be done?')).toBeTruthy();
    });

    it('does not show Add button when input is empty', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        expect(screen.queryByLabelText('Add task')).toBeNull();
    });

    it('shows Add button when input has text', async () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        const input = screen.getByPlaceholderText('Quick add: what needs to be done?');
        fireEvent.change(input, { target: { value: 'My task' } });
        expect(screen.getByLabelText('Add task')).toBeTruthy();
    });

    it('calls onAddTask on form submit', async () => {
        const onAddTask = vi.fn().mockResolvedValue({ id: 1, title: 'My task' });
        const { container } = render(<CreateTaskBar lists={defaultLists} onAddTask={onAddTask} />);
        const input = screen.getByPlaceholderText('Quick add: what needs to be done?');
        fireEvent.change(input, { target: { value: 'My task' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => {
            expect(onAddTask).toHaveBeenCalledWith(expect.objectContaining({
                title: 'My task',
                priority: 'medium',
            }));
        });
    });

    it('does not call onAddTask if title is empty', async () => {
        const onAddTask = vi.fn();
        const { container } = render(<CreateTaskBar lists={defaultLists} onAddTask={onAddTask} />);
        fireEvent.submit(container.querySelector('form'));
        expect(onAddTask).not.toHaveBeenCalled();
    });

    it('clears input after submit', async () => {
        const onAddTask = vi.fn().mockResolvedValue({ id: 1, title: 'My task' });
        const { container } = render(<CreateTaskBar lists={defaultLists} onAddTask={onAddTask} />);
        const input = screen.getByPlaceholderText('Quick add: what needs to be done?');
        fireEvent.change(input, { target: { value: 'My task' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => {
            expect(input.value).toBe('');
        });
    });

    it('renders duration buttons', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        expect(screen.getByLabelText('25 minutes (1 Pomodoro block)')).toBeTruthy();
        expect(screen.getByLabelText('50 minutes (2 Pomodoro blocks)')).toBeTruthy();
    });

    it('25m button is pressed by default', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        const btn25 = screen.getByLabelText('25 minutes (1 Pomodoro block)');
        expect(btn25.getAttribute('aria-pressed')).toBe('true');
    });

    it('clicking 50m button sets it as active', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        const btn50 = screen.getByLabelText('50 minutes (2 Pomodoro blocks)');
        fireEvent.click(btn50);
        expect(btn50.getAttribute('aria-pressed')).toBe('true');
    });

    it('passes estimated_blocks to onAddTask', async () => {
        const onAddTask = vi.fn().mockResolvedValue({ id: 1, title: 'Task' });
        const { container } = render(<CreateTaskBar lists={defaultLists} onAddTask={onAddTask} />);
        fireEvent.click(screen.getByLabelText('50 minutes (2 Pomodoro blocks)'));
        const input = screen.getByPlaceholderText('Quick add: what needs to be done?');
        fireEvent.change(input, { target: { value: 'Task' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => {
            expect(onAddTask).toHaveBeenCalledWith(expect.objectContaining({ estimated_blocks: 2 }));
        });
    });

    it('renders list dropdown', () => {
        render(<CreateTaskBar lists={defaultLists} onAddTask={vi.fn()} />);
        expect(screen.getByLabelText('Select list')).toBeTruthy();
    });

    it('passes task_list to onAddTask', async () => {
        const onAddTask = vi.fn().mockResolvedValue({ id: 1, title: 'Task' });
        const { container } = render(<CreateTaskBar lists={defaultLists} onAddTask={onAddTask} defaultListId={2} />);
        const input = screen.getByPlaceholderText('Quick add: what needs to be done?');
        fireEvent.change(input, { target: { value: 'Task' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => {
            expect(onAddTask).toHaveBeenCalledWith(expect.objectContaining({ task_list: 2 }));
        });
    });

    it('renders with empty lists without crashing', () => {
        render(<CreateTaskBar lists={[]} onAddTask={vi.fn()} />);
        expect(screen.getByPlaceholderText('Quick add: what needs to be done?')).toBeTruthy();
    });
});
