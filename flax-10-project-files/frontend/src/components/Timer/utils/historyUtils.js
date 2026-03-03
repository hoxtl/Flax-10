import { fetchApi } from '../../../api/client';

export const getHistory = async () => {
    try {
        return await fetchApi('/timer/history/');
    } catch {
        return [];
    }
};

const createSessionPayload = (work, brk, count, blockId, task, pause) => ({
    start_time: new Date(Date.now() - work * 1000).toISOString(),
    end_time: new Date().toISOString(),
    duration: work,
    break_duration: brk,
    pause_duration: pause,
    session_count: count,
    study_block_id: blockId,
    task: task,
    status: 'Completed'
});

export const saveSession = async (work, brk, count, blockId, task = '', pause = 0) => {
    const payload = createSessionPayload(work, brk, count, blockId, task, pause);
    await fetchApi('/timer/history/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const clearHistory = async () => {
    await fetchApi('/timer/history/clear_history/', { method: 'DELETE' });
};
