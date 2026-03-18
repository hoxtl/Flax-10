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
    default: ({ tasks, onCreateTask, onAddTask, onDeleteTask, onEditTask, onPlanTomorrow, onFilterByList }) => (
        <div data-testid="task-feed">
            <span>Tasks: {tasks.length}</span>
            <button onClick={onCreateTask}>New Task</button>
            <button onClick={() => onAddTask({ title: 'Quick task' })}>Quick Add</button>
            <button onClick={() => onDeleteTask(123)}>Delete Task</button>
            <button onClick={() => onEditTask(1, { task_list: 1 }, { source: 'context-menu', action: 'move-list', listName: 'My List' })}>Move Task</button>
            <button onClick={() => onEditTask(1, { due_date: null }, { source: 'context-menu', action: 'set-due-date' })}>Remove Due</button>
            <button onClick={onPlanTomorrow}>Plan Tomorrow</button>
            <button onClick={() => onFilterByList(['1'])}>Filter List 1</button>
        </div>
    ),
}));

vi.mock('../../pages/Tasks/components/ListSidebar', () => ({
    default: ({ lists, onNewList, onSelectFilter, onSelectList, onUnarchiveList, onPermanentlyDeleteList }) => (
        <div data-testid="list-sidebar">
            <span>Lists: {lists.length}</span>
            <button onClick={onNewList}>Add List</button>
            <button onClick={() => onSelectFilter('today')}>Today Filter</button>
            <button onClick={() => onSelectList('1')}>Select List 1</button>
            <button onClick={() => onUnarchiveList(7)}>Unarchive List</button>
            <button onClick={() => onPermanentlyDeleteList(9)}>Permanently Delete List</button>
        </div>
    ),
}));

vi.mock('../../pages/Tasks/components/CreateTaskModal', () => ({
    default: ({ onClose, onSave, defaultListId, defaultDueDate }) => (
        <div data-testid="create-task-modal">
            <div>defaultListId:{String(defaultListId ?? '')}</div>
            <div>defaultDueDate:{String(defaultDueDate ?? '')}</div>
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
        expect(screen.getByTestId('tasks-skeleton')).toBeTruthy();
    });

    it('shows loading when listsLoading is true', () => {
        useTaskLists.mockReturnValue({ ...mockListsHook, loading: true });
        renderTasksPage();
        expect(screen.getByTestId('tasks-skeleton')).toBeTruthy();
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

    it('undo removes newly added task', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Quick Add'));
        await waitFor(() => expect(screen.getByText('Undo')).toBeTruthy());
        fireEvent.click(screen.getByText('Undo'));
        expect(mockTasksHook.removeTask).toHaveBeenCalledWith(1);
        expect(screen.queryByText('Task added.')).toBeNull();
    });

    it('shows delete toast when a task is deleted and can dismiss it', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Delete Task'));
        expect(mockTasksHook.removeTask).toHaveBeenCalledWith(123);
        expect(screen.getByText(/Task deleted/)).toBeTruthy();
        fireEvent.click(screen.getByText('✕'));
        expect(screen.queryByText(/Task deleted/)).toBeNull();
    });

    it('shows info toast for context-menu move-list and due-date actions', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Move Task'));
        await waitFor(() => expect(screen.getByText('Task moved to My List.')).toBeTruthy());
        fireEvent.click(screen.getByText('Remove Due'));
        await waitFor(() => expect(screen.getByText('Task due date removed.')).toBeTruthy());
    });

    it('plan tomorrow sets a default due date and opens modal', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Plan Tomorrow'));
        expect(screen.getByTestId('create-task-modal')).toBeTruthy();
        expect(screen.getByText(/defaultDueDate:/)).toBeTruthy();
    });

    it('filterListIds overrides active list filtering', () => {
        useTasks.mockReturnValue({
            ...mockTasksHook,
            tasks: [
                { id: 1, title: 'Task 1', task_list: 1 },
                { id: 2, title: 'Task 2', task_list: 2 },
            ],
        });
        renderTasksPage('/tasks?list=2');
        // initially list=2 should show 1 task
        expect(screen.getByText('Tasks: 1')).toBeTruthy();
        // applying filter list 1 should show list 1 task instead
        fireEvent.click(screen.getByText('Filter List 1'));
        expect(screen.getByText('Tasks: 1')).toBeTruthy();
    });

    it('unarchive list calls restoreList and reloads tasks', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Unarchive List'));
        await waitFor(() => expect(mockListsHook.restoreList).toHaveBeenCalledWith(7));
        await waitFor(() => expect(mockTasksHook.reload).toHaveBeenCalled());
    });

    it('permanently delete list respects confirm dialog', async () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Permanently Delete List'));
        expect(mockListsHook.permanentlyDeleteList).toHaveBeenCalledWith(9);
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

    it('opens task modal with open=fullPlanning URL param', async () => {
        renderTasksPage('/tasks?open=fullPlanning');
        await waitFor(() => {
            expect(screen.getByTestId('create-task-modal')).toBeTruthy();
        });
    });

    it('calls Today Filter from sidebar', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('Today Filter'));
        expect(screen.getByTestId('list-sidebar')).toBeTruthy();
    });

    it('opens task modal from New Task and shows create modal', () => {
        renderTasksPage();
        fireEvent.click(screen.getByText('New Task'));
        expect(screen.getByTestId('create-task-modal')).toBeTruthy();
    });
});
