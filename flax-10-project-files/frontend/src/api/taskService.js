import { fetchApi } from './client.js';

export const fetchTaskLists = () =>
    fetchApi('/tasks/lists/');

export const createTaskList = (data) =>
    fetchApi('/tasks/lists/', { method: 'POST', body: JSON.stringify(data) });

export const updateTaskList = (id, data) =>
    fetchApi(`/tasks/lists/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTaskList = (id) =>
    fetchApi(`/tasks/lists/${id}/`, { method: 'DELETE' });

export const fetchTasks = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/tasks/${query ? '?' + query : ''}`);
};

export const createTask = (data) =>
    fetchApi('/tasks/', { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id, data) =>
    fetchApi(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTask = (id) =>
    fetchApi(`/tasks/${id}/`, { method: 'DELETE' });

export const logTaskTime = (id, minutes) =>
    fetchApi(`/tasks/${id}/log-time/`, { method: 'POST', body: JSON.stringify({ minutes }) });