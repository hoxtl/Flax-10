import { describe, it, expect, vi } from 'vitest';
import { getCompletionMessage, isRoutineTask } from '../../lib/completionMessages';

describe('isRoutineTask', () => {
    it('returns false for null/non-object', () => {
        expect(isRoutineTask(null)).toBe(false);
        expect(isRoutineTask(undefined)).toBe(false);
        expect(isRoutineTask('lunch')).toBe(false);
    });

    it('returns true for routine keywords in title', () => {
        expect(isRoutineTask({ title: 'Breakfast' })).toBe(true);
        expect(isRoutineTask({ title: 'Lunch break' })).toBe(true);
        expect(isRoutineTask({ title: 'Sleep time' })).toBe(true);
        expect(isRoutineTask({ title: 'Morning coffee' })).toBe(true);
        expect(isRoutineTask({ title: 'Dinner' })).toBe(true);
    });

    it('returns false for non-routine tasks', () => {
        expect(isRoutineTask({ title: 'Study Maths' })).toBe(false);
        expect(isRoutineTask({ title: 'Read chapter 2' })).toBe(false);
    });

    it('returns false when the task object has no title', () => {
        expect(isRoutineTask({})).toBe(false);
        expect(isRoutineTask({ title: '' })).toBe(false);
    });
});

describe('getCompletionMessage', () => {
    it('returns a string for null task', () => {
        const msg = getCompletionMessage(null);
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });

    it('returns a string for non-object task', () => {
        const msg = getCompletionMessage('some string');
        expect(typeof msg).toBe('string');
    });

    it('returns "Nourished. ☕" for routine task', () => {
        expect(getCompletionMessage({ title: 'Breakfast' })).toBe('Nourished. ☕');
        expect(getCompletionMessage({ title: 'Lunch with friends' })).toBe('Nourished. ☕');
    });

    it('returns an overdue message when isOverdue is true', () => {
        const msg = getCompletionMessage({ title: 'Assignment' }, { isOverdue: true });
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });

    it('returns a due-today message when dueStatus is "today"', () => {
        const msg = getCompletionMessage({ title: 'Assignment' }, { dueStatus: 'today' });
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });

    it('returns an overdue message when dueStatus is "overdue"', () => {
        const msg = getCompletionMessage({ title: 'Assignment' }, { dueStatus: 'overdue' });
        expect(typeof msg).toBe('string');
    });

    it('returns a generic message for regular task with no context', () => {
        const msg = getCompletionMessage({ title: 'Study algebra' }, {});
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });

    it('can return a reflective message when calm selection lands in the middle band', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.8)
            .mockReturnValueOnce(0);
        const msg = getCompletionMessage({ title: 'Study algebra' }, {});
        const reflectiveMessages = [
            'Quiet progress. The path clears.',
            'Ground under your feet. Clarity ahead.',
            'Well composed. Onward.',
            'Precision pays off. Next.',
        ];
        expect(reflectiveMessages).toContain(msg);
        randomSpy.mockRestore();
    });

    it('can return a generic message when calm selection lands in the default band', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.2)
            .mockReturnValueOnce(0);
        const msg = getCompletionMessage({ title: 'Study algebra' }, {});
        const genericMessages = [
            'Focus maintained. One step closer.',
            'Nicely done. Take a deep breath.',
            'Momentum is on your side.',
            'One step closer. Well done.',
            'Steady progress. Keep going.',
            'Cleared. Breathe. Continue.',
        ];
        expect(genericMessages).toContain(msg);
        randomSpy.mockRestore();
    });

    it('can return Lenny message when pickCalmCleverMessage gets r >= 0.9', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.95)
            .mockReturnValueOnce(0);
        const msg = getCompletionMessage(null);
        const lennyMessages = [
            'Lenny the campus cat sends a slow blink of approval.',
            'Even Lenny approves of that one.',
        ];
        expect(lennyMessages).toContain(msg);
        randomSpy.mockRestore();
    });
});
