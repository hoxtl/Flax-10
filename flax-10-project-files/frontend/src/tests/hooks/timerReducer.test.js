import { describe, it, expect } from 'vitest';
import { timerReducer, initialState } from '../hooks/timerReducer';

describe('timerReducer', () => {
    it('returns initial state correctly', () => {
        const state = initialState(25, 5, 4);
        expect(state).toEqual({
            workTime: 25, breakTime: 5, targetSessions: 4, completedSessions: 0,
            timeLeft: 1500, totalWork: 0, totalBreak: 0, isActive: false, mode: 'work'
        });
    });

    it('TICK action updates time and totals', () => {
        const startState = { ...initialState(25, 5), isActive: true };
        const nextState = timerReducer(startState, { type: 'TICK' });
        expect(nextState.timeLeft).toBe(1499);
        expect(nextState.totalWork).toBe(1);
        expect(nextState.totalBreak).toBe(0);

        const breakState = { ...startState, mode: 'break' };
        const nextBreakState = timerReducer(breakState, { type: 'TICK' });
        expect(nextBreakState.totalBreak).toBe(1);
    });

    it('RESET action restores initial state', () => {
        const modifiedState = { ...initialState(25, 5), timeLeft: 100, completedSessions: 2 };
        const resetState = timerReducer(modifiedState, { type: 'RESET' });
        expect(resetState).toEqual(initialState(25, 5));
    });

    it('UPDATE_SETTINGS action updates state', () => {
        const state = initialState(25, 5);
        const newState = timerReducer(state, { type: 'UPDATE_SETTINGS', payload: { workTime: 30 } });
        expect(newState.workTime).toBe(30);
    });

    it('handles SET actions correctly', () => {
        const state = initialState(25, 5);
        expect(timerReducer(state, { type: 'SET_MODE', payload: 'break' }).mode).toBe('break');
        expect(timerReducer(state, { type: 'SET_ACTIVE', payload: true }).isActive).toBe(true);
        expect(timerReducer(state, { type: 'SET_TIME_LEFT', payload: 100 }).timeLeft).toBe(100);
        expect(timerReducer(state, { type: 'SET_COMPLETED', payload: 5 }).completedSessions).toBe(5);
    });

    it('returns current state for unknown action', () => {
        const state = initialState(25, 5);
        expect(timerReducer(state, { type: 'UNKNOWN' })).toBe(state);
    });
});
