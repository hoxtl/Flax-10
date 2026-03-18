import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
    ChevronDown: () => <svg data-testid="chevron-icon" />,
    Search: () => <svg data-testid="search-icon" />,
    X: () => <svg data-testid="x-icon" />,
    Plus: () => <svg data-testid="plus-icon" />,
    Filter: () => <svg data-testid="filter-icon" />,
}));

vi.mock('../../../components/ui/EstTimeHelpBanner', () => ({
    default: () => <div data-testid="est-time-banner" />,
}));

vi.mock('../../../pages/Tasks/components/TaskCard', () => ({
    default: ({ task, onToggle, onDelete }) => (
        <div data-testid={`task-card-${task.id}`}>
            <span>{task.title}</span>
            <button onClick={onToggle}>Toggle</button>
            <button onClick={onDelete}>Delete</button>
        </div>
    ),
}));

vi.mock('../../../pages/Tasks/components/CreateTaskBar', () => ({
    default: () => <div data-testid="create-task-bar" />,
}));

vi.mock('../../../components/common/AnimatedDropdown', () => ({
    default: ({ value, onChange, options }) => (
        <select value={value} onChange={e => onChange(e.target.value)} data-testid="sort-dropdown">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    ),
}));

vi.mock('../../../pages/Tasks/components/AllTasksCompleteCard', () => ({
    default: ({ message, sub, ctaLabel, onCtaClick }) => (
        <div data-testid="all-complete-card">
            <p>{message}</p>
            {sub && <p>{sub}</p>}
            {ctaLabel && <button onClick={onCtaClick}>{ctaLabel}</button>}
        </div>
    ),
}));

vi.mock('../../../lib/allTasksCompleteMessages', () => ({
    getClearMessage: vi.fn(() => 'All tasks done!'),
}));

const mockStore = {};
vi.stubGlobal('localStorage', {
    setItem: (key, val) => { mockStore[key] = val.toString(); },
    getItem: (key) => mockStore[key] || null,
    removeItem: (key) => { delete mockStore[key]; },
});
mockStore['user'] = JSON.stringify({ first_name: 'John', username: 'jdoe' });

import TaskFeed from '../../../pages/Tasks/components/TaskFeed';

const now = new Date();
const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 8);

const baseTasks = [
    { id: 1, title: 'Overdue Task', completed: false, due_date: yesterday.toISOString(), priority: 'high', task_list: 1 },
    { id: 2, title: 'Today Task', completed: false, due_date: new Date().toISOString(), priority: 'medium', task_list: 1 },
    { id: 3, title: 'Future Task', completed: false, due_date: nextWeek.toISOString(), priority: 'low', task_list: 1 },
    { id: 4, title: 'Completed Task', completed: true, due_date: yesterday.toISOString(), priority: 'low', task_list: 1 },
];

const baseLists = [
    { id: 1, name: 'Work', color: '#3b82f6' },
];

function renderFeed(props = {}) {
    return render(
        <TaskFeed
            tasks={baseTasks}
            lists={baseLists}
            activeFilter="all"
            activeListId={null}
            activeModuleCode={null}
            defaultDueDateForNewTask={null}
            onPlanTomorrow={vi.fn()}
            onToggleComplete={vi.fn()}
            onDeleteTask={vi.fn()}
            onEditTask={vi.fn()}
            onCreateTask={vi.fn()}
            onAddTask={vi.fn()}
            filterListIds={[]}
            onFilterByList={vi.fn()}
            {...props}
        />
    );
}

describe('TaskFeed', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders "All tasks" header by default', () => {
        renderFeed();
        expect(screen.getByRole('heading', { name: 'All tasks' })).toBeTruthy();
    });

    it('renders "Today" header for today filter', () => {
        renderFeed({ activeFilter: 'today' });
        expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
    });

    it('renders "This Week" header for this_week filter', () => {
        renderFeed({ activeFilter: 'this_week' });
        expect(screen.getByRole('heading', { name: 'This Week' })).toBeTruthy();
    });

    it('renders "Later" header for later filter', () => {
        renderFeed({ activeFilter: 'later' });
        expect(screen.getByRole('heading', { name: 'Later' })).toBeTruthy();
    });

    it('renders "Overdue" header for overdue filter', () => {
        renderFeed({ activeFilter: 'overdue' });
        expect(screen.getByRole('heading', { name: 'Overdue' })).toBeTruthy();
    });

    it('shows active list name as header when activeListId provided', () => {
        renderFeed({ activeListId: '1' });
        expect(screen.getByText('Work')).toBeTruthy();
    });

    it('does not render EstTimeHelpBanner', () => {
        renderFeed();
        expect(screen.queryByTestId('est-time-banner')).toBeNull();
    });

    it('renders CreateTaskBar when onAddTask provided', () => {
        renderFeed();
        expect(screen.getByTestId('create-task-bar')).toBeTruthy();
    });

    it('renders Full Planning button when onCreateTask provided', () => {
        renderFeed();
        expect(screen.getByText('Full Planning')).toBeTruthy();
    });

    it('renders sort dropdown', () => {
        renderFeed();
        expect(screen.getByTestId('sort-dropdown')).toBeTruthy();
    });

    it('renders Filter button', () => {
        renderFeed();
        expect(screen.getByText('Filter')).toBeTruthy();
    });

    it('shows search input', () => {
        renderFeed();
        expect(screen.getByPlaceholderText(/search by list or task/i)).toBeTruthy();
    });

    it('searches tasks by title', () => {
        renderFeed();
        const input = screen.getByPlaceholderText(/search by list or task/i);
        fireEvent.change(input, { target: { value: 'Overdue' } });
        expect(screen.getByTestId('task-card-1')).toBeTruthy();
        expect(screen.queryByTestId('task-card-3')).toBeNull();
    });

    it('shows no tasks message for no-match search', () => {
        renderFeed();
        const input = screen.getByPlaceholderText(/search by list or task/i);
        fireEvent.change(input, { target: { value: 'zzz_nonexistent_zzz' } });
        expect(screen.getByText(/No tasks match/)).toBeTruthy();
    });

    it('clears search when clear button clicked', () => {
        renderFeed();
        const input = screen.getByPlaceholderText(/search by list or task/i);
        fireEvent.change(input, { target: { value: 'test' } });
        // There are two "Clear search" controls; either is fine for clearing.
        fireEvent.click(screen.getAllByLabelText('Clear search')[0]);
        expect(input.value).toBe('');
    });

    it('opens filter panel when Filter button clicked', () => {
        renderFeed();
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('shows Lists and Modules tabs in filter panel', () => {
        renderFeed();
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.getByText('Lists')).toBeTruthy();
        expect(screen.getByText('Modules')).toBeTruthy();
    });

    it('switches to Modules tab in filter panel', () => {
        renderFeed();
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Modules'));
        expect(screen.getByText('No modules found')).toBeTruthy();
    });

    it('renders completed task count', () => {
        renderFeed();
        expect(screen.getByText('1')).toBeTruthy(); // completed count
    });

    it('shows completed section', () => {
        renderFeed();
        expect(screen.getByText('Completed')).toBeTruthy();
    });

    it('calls onToggleComplete when task Toggle clicked', () => {
        const onToggleComplete = vi.fn();
        renderFeed({ onToggleComplete });
        fireEvent.click(screen.getAllByText('Toggle')[0]);
        expect(onToggleComplete).toHaveBeenCalled();
    });

    it('calls onDeleteTask when Delete button clicked', () => {
        const onDeleteTask = vi.fn();
        renderFeed({ onDeleteTask });
        fireEvent.click(screen.getAllByText('Delete')[0]);
        expect(onDeleteTask).toHaveBeenCalled();
    });

    it('renders nothing extra without onCreateTask', () => {
        renderFeed({ onCreateTask: undefined });
        expect(screen.queryByText('Full Planning')).toBeNull();
    });

    it('renders All Tasks Complete card when today filter and no tasks today', () => {
        const noTodayTasks = [
            { id: 10, title: 'Future Only', completed: false, due_date: nextWeek.toISOString(), priority: 'low', task_list: 1 },
        ];
        renderFeed({ tasks: noTodayTasks, activeFilter: 'today' });
        expect(screen.getByTestId('all-complete-card')).toBeTruthy();
    });

    it('shows list name in header when activeListId and list found', () => {
        renderFeed({ activeListId: '1', lists: [{ id: 1, name: 'My Work List' }] });
        expect(screen.getByText('My Work List')).toBeTruthy();
    });

    it('sorts tasks by sort dropdown change', () => {
        renderFeed();
        const dropdown = screen.getByTestId('sort-dropdown');
        fireEvent.change(dropdown, { target: { value: 'alpha' } });
        expect(dropdown.value).toBe('alpha');
    });

    it('filters list checkboxes and calls onFilterByList', () => {
        const onFilterByList = vi.fn();
        renderFeed({ onFilterByList, filterListIds: [] });
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Work'));
        expect(onFilterByList).toHaveBeenCalledWith(['1']);
    });

    it('filters modules and shows active filter count, then clears all', () => {
        renderFeed({
            tasks: [
                { ...baseTasks[0], module_code: 'CS101' },
                { ...baseTasks[1], module_code: 'MA202' },
            ],
            filterListIds: ['1'],
        });
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Modules'));
        fireEvent.click(screen.getByText('CS101'));
        expect(screen.getByText('2')).toBeTruthy();
        fireEvent.click(screen.getByText('Clear all'));
        expect(screen.getByText('Filter')).toBeTruthy();
    });

    it('groups modules by prefix and shows search empty states in filter tabs', () => {
        renderFeed({
            tasks: [
                { ...baseTasks[0], module_code: 'CS100' },
                { ...baseTasks[1], module_code: 'MA200' },
            ],
            lists: [{ id: 1, name: 'Work', color: '#3b82f6' }],
        });
        fireEvent.click(screen.getByText('Filter'));
        fireEvent.click(screen.getByText('Modules'));
        expect(screen.getByText('CS')).toBeTruthy();
        expect(screen.getByText('MA')).toBeTruthy();
        fireEvent.change(screen.getByPlaceholderText('Search modules...'), { target: { value: 'zzz' } });
        expect(screen.getByText('No modules found')).toBeTruthy();
        fireEvent.click(screen.getByText('Lists'));
        fireEvent.change(screen.getByPlaceholderText('Search lists...'), { target: { value: 'zzz' } });
        expect(screen.getByText('No lists found')).toBeTruthy();
    });

    it('closes filter dialog on outside mousedown', () => {
        renderFeed();
        fireEvent.click(screen.getByText('Filter'));
        expect(screen.getByRole('dialog')).toBeTruthy();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('supports keyboard shortcuts for search focus, quick add focus, and escape clear', async () => {
        const quickInput = document.createElement('input');
        quickInput.setAttribute('aria-label', 'Task name');
        document.body.appendChild(quickInput);
        Object.defineProperty(quickInput, 'offsetParent', { value: {}, configurable: true });

        renderFeed();
        const search = screen.getByPlaceholderText(/search by list or task/i);
        Object.defineProperty(search, 'offsetParent', { value: {}, configurable: true });

        fireEvent.keyDown(document, { key: '/', bubbles: true, cancelable: true });
        await waitFor(() => expect(document.activeElement).toBe(search));

        fireEvent.keyDown(document, { key: 'n', bubbles: true, cancelable: true });
        await waitFor(() => expect(document.activeElement).toBe(quickInput));

        fireEvent.change(search, { target: { value: 'abc' } });
        fireEvent.keyDown(search, { key: 'Escape' });
        await waitFor(() => expect(search.value).toBe(''));

        document.body.removeChild(quickInput);
    });

    it('shows all/less control for long all-tasks section', () => {
        const manyTasks = Array.from({ length: 10 }, (_, i) => ({
            id: i + 100,
            title: `Task ${i + 1}`,
            completed: false,
            due_date: null,
            priority: 'medium',
            task_list: 1,
        }));
        renderFeed({ tasks: manyTasks, activeFilter: 'all' });
        expect(screen.getByText('Show all 10 →')).toBeTruthy();
        fireEvent.click(screen.getByText('Show all 10 →'));
        expect(screen.getByText('Show less ↑')).toBeTruthy();
    });

    it('handles active module code in header and invalid user JSON safely', () => {
        mockStore['user'] = '{invalid';
        renderFeed({ activeListId: '1', activeModuleCode: 'CS9999' });
        expect(screen.getByText('Work: CS9999')).toBeTruthy();
        mockStore['user'] = JSON.stringify({ first_name: 'John', username: 'jdoe' });
    });
});
