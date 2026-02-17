import { fetchApi } from '../api/client';

export const getHistory = async () => {
    try {
        return await fetchApi('/timer/history/');
    } catch {
        return [];
    }
};

const createSessionPayload = (work, brk, count, blockId, task) => ({
    start_time: new Date(Date.now() - work * 60000).toISOString(),
    end_time: new Date().toISOString(),
    duration: work, break_duration: brk,
    session_count: count, study_block_id: blockId,
    task: task, status: 'Completed'
});

export const saveSession = async (work, brk, count, blockId, task = '') => {
    const payload = createSessionPayload(work, brk, count, blockId, task);
    await fetchApi('/timer/history/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const clearHistory = async () => {
    await fetchApi('/timer/history/', { method: 'DELETE' });
};
