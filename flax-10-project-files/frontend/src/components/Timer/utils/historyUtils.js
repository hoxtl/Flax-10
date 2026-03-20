/*
 * Timer feature file.
 */

import { fetchApi } from '../../../api/client';

export const getHistory = async () => {
    try {
        return normalizeHistoryResponse(await fetchApi('/timer/history/'));
    } catch {
        return [];
    }
};

function normalizeHistoryResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
}

const createSessionPayload = (work, brk, count, blockId, task, pause, status, distractions = 0) => ({
    start_time: new Date(Date.now() - work * 1000).toISOString(),
    end_time: new Date().toISOString(),
    duration: work,
    break_duration: brk,
    pause_duration: pause,
    session_count: count,
    study_block_id: blockId,
    task: task,
    status: status,
    distractions
});

export const saveSession = async (work, brk, count, blockId, task = '', pause = 0, status = 'Completed', distractions = 0) => {
    const payload = createSessionPayload(work, brk, count, blockId, task, pause, status, distractions);
    await fetchApi('/timer/history/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('timerHistoryUpdated'));
    }
};

export const clearHistory = async () => {
    await fetchApi('/timer/history/clear_history/', { method: 'DELETE' });
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('timerHistoryUpdated'));
    }
};
