import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTasks from '../../pages/tasks/hooks/useTasks';

vi.mock('../../api/taskApi', () => ({
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
}));

import { fetchTasks, createTask, updateTask, deleteTask } from '../../api/taskApi';

describe('useTasks', () => {
    beforeEach(() => {
        fetchTasks.mockResolvedValue([
            { id: 1, title: 'Task A', completed: false, task_list: 1 },
            { id: 2, title: 'Task B', completed: true, task_list: 1 },
        ]);
        createTask.mockResolvedValue({ id: 3, title: 'New Task', completed: false, task_list: 1 });
        updateTask.mockResolvedValue({ id: 1, title: 'Task A', completed: true, task_list: 1 });
        deleteTask.mockResolvedValue();
    });

    it('loads tasks on mount', async () => {
        const { result } = renderHook(() => useTasks());
        expect(result.current.loading).toBe(true);
        await act(async () => {});
        expect(result.current.loading).toBe(false);
        expect(result.current.tasks).toHaveLength(2);
        expect(result.current.initialLoading).toBe(false);
    });

    it('handles fetch error gracefully', async () => {
        fetchTasks.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        expect(result.current.loading).toBe(false);
        expect(result.current.tasks).toEqual([]);
    });

    it('addTask prepends new task to list', async () => {
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        await act(async () => {
            await result.current.addTask({ title: 'New Task', task_list: 1 });
        });
        expect(result.current.tasks[0].id).toBe(3);
        expect(result.current.tasks[0].title).toBe('New Task');
    });

    it('addTask merges task_list from data when not on response', async () => {
        createTask.mockResolvedValueOnce({ id: 4, title: 'Test', completed: false });
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        let added;
        await act(async () => {
            added = await result.current.addTask({ title: 'Test', task_list: 99 });
        });
        expect(added.task_list).toBe(99);
    });

    it('editTask updates task in list', async () => {
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        await act(async () => {
            await result.current.editTask(1, { completed: true });
        });
        const updated = result.current.tasks.find(t => t.id === 1);
        expect(updated.completed).toBe(true);
    });

    it('removeTask removes task from list', async () => {
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        await act(async () => {
            await result.current.removeTask(1);
        });
        expect(result.current.tasks.find(t => t.id === 1)).toBeUndefined();
        expect(result.current.tasks).toHaveLength(1);
    });

    it('toggleComplete calls editTask with negated completed', async () => {
        updateTask.mockResolvedValueOnce({ id: 1, title: 'Task A', completed: true, task_list: 1 });
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        await act(async () => {
            await result.current.toggleComplete(1, false);
        });
        expect(updateTask).toHaveBeenCalledWith(1, { completed: true });
    });

    it('reload re-fetches tasks', async () => {
        const { result } = renderHook(() => useTasks());
        await act(async () => {});
        fetchTasks.mockResolvedValueOnce([{ id: 5, title: 'Reloaded', completed: false, task_list: 1 }]);
        await act(async () => {
            await result.current.reload();
        });
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].id).toBe(5);
    });

    it('passes filters to fetchTasks', async () => {
        renderHook(() => useTasks({ task_list: 2 }));
        await act(async () => {});
        expect(fetchTasks).toHaveBeenCalledWith({ task_list: 2 });
    });
});
