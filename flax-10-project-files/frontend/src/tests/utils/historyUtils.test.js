import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHistory, saveSession, clearHistory, HISTORY_KEY } from '../../utils/historyUtils';

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const testGetHistory = () => {
    // Case 1: Empty
    expect(getHistory()).toEqual([]);

    // Case 2: Data exists
    const mockData = [{ id: 1, duration: 25 }];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(mockData));
    expect(getHistory()).toEqual(mockData);

    // Case 3: Error handling (Invalid JSON)
    localStorage.setItem(HISTORY_KEY, 'invalid-json');
    expect(getHistory()).toEqual([]);
};

const testSaveNewSession = () => {
    const mockNow = new Date('2026-02-15T12:00:00Z');
    vi.setSystemTime(mockNow);
    saveSession(25, 5, 1, 12345);

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
        duration: 25, breakDuration: 5, sessionCount: 1,
        studyBlockId: 12345, status: 'Completed', endTime: mockNow.toISOString()
    });
    vi.useRealTimers();
};

const testAppendSession = () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ id: 1, duration: 25 }]));
    saveSession(50, 10, 2, 12345);

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    expect(history).toHaveLength(2);
    expect(history[0].duration).toBe(50);
    expect(history[1].duration).toBe(25);
};

const testClearHistory = () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ id: 1 }]));
    clearHistory();
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
};

describe('historyUtils', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        localStorage.clear();
        vi.useRealTimers();
    });

    it('getHistory handles various states', testGetHistory);
    it('saveSession creates new entry', testSaveNewSession);
    it('saveSession appends to history', testAppendSession);
    it('clearHistory removes data', testClearHistory);
});
