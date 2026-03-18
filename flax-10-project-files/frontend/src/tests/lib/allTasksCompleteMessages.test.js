import { describe, it, expect } from 'vitest';
import {
    CLEAR_MESSAGES,
    CLEAR_CTAS,
    getClearMessage,
    getClearCtaLabel,
    areAllTasksCompleted,
} from '../../lib/allTasksCompleteMessages';

describe('CLEAR_MESSAGES', () => {
    it('is a non-empty array of strings', () => {
        expect(Array.isArray(CLEAR_MESSAGES)).toBe(true);
        expect(CLEAR_MESSAGES.length).toBeGreaterThan(0);
        CLEAR_MESSAGES.forEach(m => expect(typeof m).toBe('string'));
    });
});

describe('CLEAR_CTAS', () => {
    it('is a non-empty array of strings', () => {
        expect(Array.isArray(CLEAR_CTAS)).toBe(true);
        expect(CLEAR_CTAS.length).toBeGreaterThan(0);
    });
});

describe('getClearMessage', () => {
    it('returns a string from CLEAR_MESSAGES', () => {
        const msg = getClearMessage();
        expect(typeof msg).toBe('string');
        expect(CLEAR_MESSAGES).toContain(msg);
    });
});

describe('getClearCtaLabel', () => {
    it('returns a string from CLEAR_CTAS', () => {
        const cta = getClearCtaLabel();
        expect(typeof cta).toBe('string');
        expect(CLEAR_CTAS).toContain(cta);
    });
});

describe('areAllTasksCompleted', () => {
    it('returns false for empty array', () => {
        expect(areAllTasksCompleted([])).toBe(false);
    });

    it('returns false for null/non-array', () => {
        expect(areAllTasksCompleted(null)).toBe(false);
        expect(areAllTasksCompleted(undefined)).toBe(false);
    });

    it('returns false when some tasks are incomplete', () => {
        const tasks = [{ completed: true }, { completed: false }];
        expect(areAllTasksCompleted(tasks)).toBe(false);
    });

    it('returns true when all tasks are completed', () => {
        const tasks = [{ completed: true }, { completed: true }];
        expect(areAllTasksCompleted(tasks)).toBe(true);
    });

    it('returns false when completed is falsy (0, null)', () => {
        const tasks = [{ completed: 0 }, { completed: null }];
        expect(areAllTasksCompleted(tasks)).toBe(false);
    });
});
