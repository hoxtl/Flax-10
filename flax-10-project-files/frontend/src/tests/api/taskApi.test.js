import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/tasks/taskApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('taskService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchTaskLists with no params', async () => {
        await api.fetchTaskLists();
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/');
    });

    it('fetchTaskLists with params builds query', async () => {
        await api.fetchTaskLists({ archived: 'false' });
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/?archived=false');
    });

    it('fetchArchivedTaskLists', async () => {
        await api.fetchArchivedTaskLists();
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/?archived=true');
    });

    it('createTaskList sends POST', async () => {
        const data = { title: 'My List' };
        await api.createTaskList(data);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    });

    it('updateTaskList sends PATCH', async () => {
        const data = { title: 'Updated' };
        await api.updateTaskList(1, data);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/1/', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    });

    it('deleteTaskList sends DELETE', async () => {
        await api.deleteTaskList(1);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/lists/1/', { method: 'DELETE' });
    });

    it('fetchTasks with no params', async () => {
        await api.fetchTasks();
        expect(fetchApi).toHaveBeenCalledWith('/tasks/');
    });

    it('fetchTasks with params', async () => {
        await api.fetchTasks({ list: '3' });
        expect(fetchApi).toHaveBeenCalledWith('/tasks/?list=3');
    });

    it('getTask', async () => {
        await api.getTask(5);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/5/');
    });

    it('createTask sends POST', async () => {
        const data = { title: 'New Task' };
        await api.createTask(data);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    });

    it('updateTask sends PATCH', async () => {
        const data = { completed: true };
        await api.updateTask(5, data);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/5/', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    });

    it('deleteTask sends DELETE', async () => {
        await api.deleteTask(5);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/5/', { method: 'DELETE' });
    });

    it('logTaskTime sends POST with minutes', async () => {
        await api.logTaskTime(5, 30);
        expect(fetchApi).toHaveBeenCalledWith('/tasks/5/log-time/', {
            method: 'POST',
            body: JSON.stringify({ minutes: 30 }),
        });
    });
});
