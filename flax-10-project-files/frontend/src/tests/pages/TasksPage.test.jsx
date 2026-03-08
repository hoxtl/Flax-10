import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TasksPage from '../../pages/Tasks/TasksPage';

vi.mock('../../pages/Tasks/hooks/useTasks', () => ({
    default: vi.fn(),
}));

vi.mock('../../pages/Tasks/hooks/useTaskLists', () => ({
    default: vi.fn(),
}));

vi.mock('../../pages/Tasks/components/TaskFeed', () => ({
    default: ({ tasks, onCreateTask, onAddTask }) => (
        <div data-testid="task-feed">
            <span>Tasks: {tasks.length}</span>
            <button onClick={onCreateTask}>New Task</button>
            <button onClick={() => onAddTask({ title: 'Quick task' })}>Quick Add</button>
        </div>
    ),
}));

vi.mock('../../pages/Tasks/components/ListSidebar', () => ({
    default: ({ lists, onNewList, onSelectFilter, onSelectList }) => (
        <div data-testid="list-sidebar">
            <span>Lists: {lists.length}</span>
            <button onClick={onNewList}>Add List</button>
            <button onClick={() => onSelectFilter('today')}>Today Filter</button>
        </div>
    ),
}));

vi.mock('../../pages/Tasks/components/CreateTaskModal', () => ({
    default: ({ onClose, onSave }) => (
        <div data-testid="create-task-modal">
            <button onClick={onClose}>Close Modal</button>
            <button onClick={() => onSave({ title: 'New Task' })}>Save Task</button>
        </div>
    ),
}));

vi.mock('../../pages/Tasks/components/CreateListModal', () => ({
    default: ({ onClose, onSave }) => (
        <div data-testid="create-list-modal">
            <button onClick={onClose}>Close List Modal</button>
        </div>
    ),
}));

vi.mock('../../components/Pagination/Pagination', () => ({
    BackToTop: () => <div data-testid="back-to-top" />,
}));

import useTasks from '../../pages/Tasks/hooks/useTasks';
import useTaskLists from '../../pages/Tasks/hooks/useTaskLists';

const mockTasksHook = {
    tasks: [],
    initialLoading: false,
    addTask: vi.fn().mockResolvedValue({ id: 1, title: 'Quick task' }),
    editTask: vi.fn().mockResolvedValue({}),
    removeTask: vi.fn(),
    toggleComplete: vi.fn(),
    reload: vi.fn(),
};

const mockListsHook = {
    lists: [{ id: 1, name: 'My List' }],
    archivedLists: [],
    loading: false,
    addList: vi.fn().mockResolvedValue({ id: 2, name: 'New List' }),
    removeList: vi.fn(),
    renameList: vi.fn(),
    restoreList: vi.fn(),
    permanentlyDeleteList: vi.fn(),
};

function renderTasksPage(route = '/tasks') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <TasksPage />
        </MemoryRouter>
    );
}

describe('TasksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTasks.mockReturnValue({ ...mockTasksHook });
        useTaskLists.mockReturnValue({ ...mockListsHook });
    });

    it('renders ListSidebar', () => {
        renderTasksPage();
        expect(screen.getByTestId('list-sidebar')).toBeTruthy();
    });

    it('renders TaskFeed', () => {
        renderTasksPage();
        expect(screen.getByTestId('task-feed')).toBeTruthy();
    });

    it('shows loading when tasksInitialLoading is true', () => {
        useTasks.mockReturnValue({ ...mockTasksHook, initialLoading: true });
        renderTasksPage();
        expect(screen.getByText('Loading tasks...')).toBeTruthy();
    });

    it('shows loading when listsLoading is true', () => {
        useTaskLists.mockReturnValue({ ...mockListsHook, loading: true });
        renderTasksPage();
        expect(screen.getByText('Loading tasks...')).toBeTruthy();
    });

    it('opens CreateTaskModal when New Task is clicked', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('New Task'));
        expect(screen.getByTestId('create-task-modal')).toBeTruthy();
    });

    it('closes CreateTaskModal when Close Modal is clicked', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('New Task'));
        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('create-task-modal')).toBeNull();
    });

    it('opens CreateListModal when Add List is clicked', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Add List'));
        expect(screen.getByTestId('create-list-modal')).toBeTruthy();
    });

    it('closes CreateListModal when Close List Modal is clicked', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Add List'));
        fireEvent.click(screen.getByText('Close List Modal'));
        expect(screen.queryByTestId('create-list-modal')).toBeNull();
    });

    it('shows toast when quick add task succeeds', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Quick Add'));
        await waitFor(() => {
            expect(screen.getByText('Task added.')).toBeTruthy();
        });
    });

    it('shows Undo button in toast', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Quick Add'));
        await waitFor(() => {
            expect(screen.getByText('Undo')).toBeTruthy();
        });
    });

    it('dismisses toast when close button clicked', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Quick Add'));
        await waitFor(() => {
            expect(screen.getByText('Task added.')).toBeTruthy();
        });
        fireEvent.click(screen.getByText('✕'));
        expect(screen.queryByText('Task added.')).toBeNull();
    });

    it('renders BackToTop', () => {
        renderTasksPage();
        expect(screen.getByTestId('back-to-top')).toBeTruthy();
    });

    it('initializes with lists from hook', () => {
        renderTasksPage();
        expect(screen.getByText('Lists: 1')).toBeTruthy();
    });

    it('passes tasks to TaskFeed', () => {
        useTasks.mockReturnValue({
            ...mockTasksHook,
            tasks: [
                { id: 1, title: 'Task 1', task_list: 1 },
                { id: 2, title: 'Task 2', task_list: 1 },
            ],
        });
        renderTasksPage();
        expect(screen.getByText('Tasks: 2')).toBeTruthy();
    });
});
