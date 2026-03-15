import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    taskDurationMins,
    getTasksThatFitGap,
    isRoutineOrEventTask,
    calculateSeedsByCategory,
    isAutoPassedTask,
} from '../../pages/Homepage/utils/taskUtils';

describe('taskDurationMins', () => {
    it('returns estimated_blocks * 25', () => {
        expect(taskDurationMins({ estimated_blocks: 2 })).toBe(50);
    });

    it('defaults to 1 block when estimated_blocks is missing', () => {
        expect(taskDurationMins({})).toBe(25);
    });
});

describe('getTasksThatFitGap', () => {
    it('returns null and empty top3 when no tasks', () => {
        expect(getTasksThatFitGap([], 60)).toEqual({ suggested: null, top3: [] });
    });

    it('returns null when gap is too small', () => {
        const tasks = [{ estimated_blocks: 1 }];
        expect(getTasksThatFitGap(tasks, 20)).toEqual({ suggested: null, top3: [] });
    });

    it('returns task that fits gap', () => {
        const task = { id: 1, estimated_blocks: 1 };
        const result = getTasksThatFitGap([task], 60);
        expect(result.suggested).toEqual(task);
        expect(result.top3).toHaveLength(1);
    });

    it('excludes tasks that are too long', () => {
        const shortTask = { id: 1, estimated_blocks: 1 }; // 25 min
        const longTask = { id: 2, estimated_blocks: 4 }; // 100 min
        const result = getTasksThatFitGap([shortTask, longTask], 50);
        expect(result.top3).toHaveLength(1);
        expect(result.suggested?.id).toBe(1);
    });

    it('prioritizes tasks due within 48h', () => {
        const now = new Date();
        const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const taskSoon = { id: 1, estimated_blocks: 1, due_date: soon };
        const taskLater = { id: 2, estimated_blocks: 1, due_date: later };
        const result = getTasksThatFitGap([taskLater, taskSoon], 60);
        expect(result.suggested?.id).toBe(1);
    });

    it('sorts by due date when neither is in 48h', () => {
        const now = new Date();
        const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const day5 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
        const task3 = { id: 1, estimated_blocks: 1, due_date: day3 };
        const task5 = { id: 2, estimated_blocks: 1, due_date: day5 };
        const result = getTasksThatFitGap([task5, task3], 60);
        expect(result.suggested?.id).toBe(1);
    });

    it('sorts by priority when no due dates', () => {
        const urgent = { id: 1, estimated_blocks: 1, priority: 'urgent' };
        const low = { id: 2, estimated_blocks: 1, priority: 'low' };
        const result = getTasksThatFitGap([low, urgent], 60);
        expect(result.suggested?.id).toBe(1);
    });
});

describe('isRoutineOrEventTask', () => {
    it('returns false for null task', () => {
        expect(isRoutineOrEventTask(null)).toBe(false);
    });

    it('returns true for routine tag', () => {
        expect(isRoutineOrEventTask({ title: 'Custom', tag_name: 'routine' })).toBe(true);
    });

    it('returns true for breakfast in title', () => {
        expect(isRoutineOrEventTask({ title: 'Morning breakfast' })).toBe(true);
    });

    it('returns true for lecture in title', () => {
        expect(isRoutineOrEventTask({ title: 'CS Lecture 3' })).toBe(true);
    });

    it('returns false for regular task', () => {
        expect(isRoutineOrEventTask({ title: 'Write report' })).toBe(false);
    });

    it('uses getTag function to get tag label', () => {
        const getTag = vi.fn().mockReturnValue({ label: 'wellness' });
        expect(isRoutineOrEventTask({ title: 'Custom', tag: 1 }, getTag)).toBe(true);
        expect(getTag).toHaveBeenCalledWith(1);
    });
});

describe('calculateSeedsByCategory', () => {
    it('returns 0 for both when no completed tasks', () => {
        const tasks = [{ completed: false, title: 'Task' }];
        const result = calculateSeedsByCategory(tasks);
        expect(result).toEqual({ academic: 0, personal: 0 });
    });

    it('counts academic tasks correctly', () => {
        const tasks = [
            { completed: true, tag_name: 'academic', title: 'Study', tag: null },
            { completed: true, tag_name: 'personal', title: 'Exercise', tag: null },
        ];
        const result = calculateSeedsByCategory(tasks);
        expect(result.academic).toBe(1);
        expect(result.personal).toBe(1);
    });

    it('excludes routine tasks', () => {
        const tasks = [
            { completed: true, title: 'Breakfast', tag_name: '' },
        ];
        const result = calculateSeedsByCategory(tasks);
        expect(result.academic).toBe(0);
        expect(result.personal).toBe(0);
    });
});

describe('isAutoPassedTask', () => {
    it('returns false for non-routine task', () => {
        const task = { title: 'Study', due_date: '2020-01-01T00:00:00' };
        expect(isAutoPassedTask(task, new Date())).toBe(false);
    });

    it('returns true for routine task with past due date', () => {
        const task = { title: 'Breakfast', due_date: '2020-01-01T00:00:00' };
        expect(isAutoPassedTask(task, new Date())).toBe(true);
    });

    it('returns false for routine task with future due date', () => {
        const task = { title: 'Breakfast', due_date: '2099-01-01T00:00:00' };
        expect(isAutoPassedTask(task, new Date())).toBe(false);
    });

    it('returns false for routine task without due_date', () => {
        const task = { title: 'Breakfast' };
        expect(isAutoPassedTask(task, new Date())).toBe(false);
    });
});
