import api from './axios';

export const fetchTaskLists = () =>
    api.get('/tasks/lists/').then(r => r.data);

export const createTaskList = (data) =>
    api.post('/tasks/lists/', data).then(r => r.data);

export const updateTaskList = (id, data) =>
    api.patch(`/tasks/lists/${id}/`, data).then(r => r.data);

export const deleteTaskList = (id) =>
    api.delete(`/tasks/lists/${id}/`);

export const fetchTasks = (params = {}) =>
    api.get('/tasks/', { params }).then(r => r.data);

export const createTask = (data) =>
    api.post('/tasks/', data).then(r => r.data);

export const updateTask = (id, data) =>
    api.patch(`/tasks/${id}/`, data).then(r => r.data);

export const deleteTask = (id) =>
    api.delete(`/tasks/${id}/`);

export const logTaskTime = (id, minutes) =>
    api.post(`/tasks/${id}/log-time/`, { minutes }).then(r => r.data);