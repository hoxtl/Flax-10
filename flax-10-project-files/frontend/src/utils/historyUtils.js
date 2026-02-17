/** LocalStorage key for persisting study sessions */
export const HISTORY_KEY = 'study_history';

export const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
};

/** Creates a completed session entry with calculated timestamps */
export const saveSession = (workDuration, breakDuration, sessionCount, studyBlockId, task = '') => {
    const history = getHistory();
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - workDuration * 60000);

    const session = {
        id: Date.now(),
        date: endTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: workDuration,
        breakDuration: breakDuration,
        sessionCount: sessionCount,
        studyBlockId: studyBlockId || Date.now(), // Fallback
        task: task,
        status: 'Completed'
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...history]));
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
