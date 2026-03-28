/*
 * Tests for getTaskUrgencyTone, urgencyRank, sortTasks, and hydrateTasks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../pages/tasks/constants/focusBlockColours', () => ({
    FOCUS_BLOCK_COLOURS_HEX: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333'],
}));

vi.mock('../../../../utils/moduleCodeUtils', () => ({
    normalizeModuleCode: vi.fn((code) => (code ? String(code).toUpperCase().trim() : null)),
    getModuleCodePrefix: vi.fn((code) => (code ? String(code).slice(0, 2) : '')),
}));

vi.mock('../../../../components/modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn((id, enrollments) => enrollments.some((e) => e.module_id === id || e === id)),
}));

vi.mock('../../../../lib/focusPlanner', () => ({
    compareTaskDue: vi.fn((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
    }),
    compareTaskEstimatedTime: vi.fn((a, b) => (a.estimated_blocks || 1) - (b.estimated_blocks || 1)),
    compareTaskPriority: vi.fn(() => 0),
    getTaskDurationMinutes: vi.fn((task) => (task.estimated_blocks || 1) * 25),
}));

vi.mock('../../../../components/timer/task_input/taskInputConstants', () => ({
    SORT_ALPHA: 'alpha',
    SORT_ALPHA_DESC: 'alpha_desc',
    SORT_DATE_ADDED: 'date_added',
    SORT_DATE_ADDED_ASC: 'date_added_asc',
    SORT_DUE: 'due',
    SORT_TIME: 'time',
}));

import {
    getTaskUrgencyTone,
    urgencyRank,
    sortTasks,
    hydrateTasks,
} from '../../../../components/timer/task_input/taskInputUtils';

beforeEach(async () => {
    vi.clearAllMocks();
    const { normalizeModuleCode, getModuleCodePrefix } = await import('../../../../utils/moduleCodeUtils');
    const { isEnrolledIn } = await import('../../../../components/modules/utils/moduleUtils');
    const { compareTaskDue, compareTaskEstimatedTime, compareTaskPriority, getTaskDurationMinutes } = await import('../../../../lib/focusPlanner');

    normalizeModuleCode.mockImplementation((code) => (code ? String(code).toUpperCase().trim() : null));
    getModuleCodePrefix.mockImplementation((code) => (code ? String(code).slice(0, 2) : ''));
    isEnrolledIn.mockImplementation((id, enrollments) => enrollments.some((e) => e.module_id === id || e === id));
    compareTaskDue.mockImplementation((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
    });
    compareTaskEstimatedTime.mockImplementation((a, b) => (a.estimated_blocks || 1) - (b.estimated_blocks || 1));
    compareTaskPriority.mockImplementation(() => 0);
    getTaskDurationMinutes.mockImplementation((task) => (task.estimated_blocks || 1) * 25);
});

describe('getTaskUrgencyTone', () => {
    it('returns "cool" when no due date', () => {
        expect(getTaskUrgencyTone({})).toBe('cool');
        expect(getTaskUrgencyTone(null)).toBe('cool');
    });

    it('returns "cool" for invalid due date', () => {
        expect(getTaskUrgencyTone({ due_date: 'invalid' })).toBe('cool');
    });

    it('returns "hot" when due today (before end of day)', () => {
        const soonDue = new Date(Date.now() + 60000);
        expect(getTaskUrgencyTone({ due_date: soonDue.toISOString() })).toBe('hot');
    });

    it('returns "hot" for overdue tasks', () => {
        const yesterday = new Date(Date.now() - 86400000);
        expect(getTaskUrgencyTone({ due_date: yesterday.toISOString() })).toBe('hot');
    });

    it('returns "warm" when due within 48 hours (tomorrow)', () => {
        const tomorrow = new Date(Date.now() + 25 * 3600000);
        expect(getTaskUrgencyTone({ due_date: tomorrow.toISOString() })).toBe('warm');
    });

    it('returns "cool" when due more than 48 hours away', () => {
        const farFuture = new Date(Date.now() + 72 * 3600000);
        expect(getTaskUrgencyTone({ due_date: farFuture.toISOString() })).toBe('cool');
    });

    it('uses dueDate field as fallback', () => {
        const farFuture = new Date(Date.now() + 72 * 3600000);
        expect(getTaskUrgencyTone({ dueDate: farFuture.toISOString() })).toBe('cool');
    });
});

describe('urgencyRank', () => {
    it('returns 0 for hot', () => {
        const yesterday = new Date(Date.now() - 86400000);
        expect(urgencyRank({ due_date: yesterday.toISOString() })).toBe(0);
    });

    it('returns 1 for warm', () => {
        const tomorrow = new Date(Date.now() + 25 * 3600000);
        expect(urgencyRank({ due_date: tomorrow.toISOString() })).toBe(1);
    });

    it('returns 2 for cool', () => {
        expect(urgencyRank({})).toBe(2);
    });
});

describe('sortTasks', () => {
    const tasks = [
        { id: 3, title: 'Zebra', estimated_blocks: 2 },
        { id: 1, title: 'Alpha', estimated_blocks: 1 },
        { id: 2, title: 'Mango', estimated_blocks: 3 },
    ];

    it('sorts by estimated time', () => {
        const sorted = sortTasks([...tasks], 'time');
        expect(sorted[0].estimated_blocks).toBe(1);
    });

    it('sorts alphabetically', () => {
        const sorted = sortTasks([...tasks], 'alpha');
        expect(sorted[0].title).toBe('Alpha');
    });

    it('sorts by date added (id desc)', () => {
        const sorted = sortTasks([...tasks], 'date_added');
        expect(sorted[0].id).toBe(3);
    });

    it('sorts by due date', () => {
        const withDates = [
            { id: 1, due_date: '2026-03-10T12:00:00Z' },
            { id: 2, due_date: '2026-03-05T12:00:00Z' },
        ];
        const sorted = sortTasks([...withDates], 'due');
        expect(sorted[0].id).toBe(2);
    });

    it('sorts in reverse alphabetical order', () => {
        const sorted = sortTasks([...tasks], 'alpha_desc');
        expect(sorted[0].title).toBe('Zebra');
    });

    it('sorts by date added ascending', () => {
        const sorted = sortTasks([...tasks], 'date_added_asc');
        expect(sorted[0].id).toBe(1);
    });

    it('handles missing titles and ids in alpha and date-added sorts', () => {
        const missingTitleTasks = [
            { id: 2, title: null },
            { id: 1, title: 'Alpha' },
        ];
        const missingRightTitleTasks = [
            { id: 1, title: 'Alpha' },
            { id: 2, title: null },
        ];
        const missingIdTasks = [
            { id: null, title: 'No id' },
            { id: 3, title: 'Has id' },
        ];
        const missingRightIdTasks = [
            { id: 3, title: 'Has id' },
            { id: null, title: 'No id' },
        ];

        expect(sortTasks([...missingTitleTasks], 'alpha')[0].title).toBe(null);
        expect(sortTasks([...missingRightTitleTasks], 'alpha')[0].title).toBe(null);
        expect(sortTasks([...missingTitleTasks], 'alpha_desc')[0].title).toBe('Alpha');
        expect(sortTasks([...missingRightTitleTasks], 'alpha_desc')[0].title).toBe('Alpha');
        expect(sortTasks([...missingIdTasks], 'date_added')[0].id).toBe(3);
        expect(sortTasks([...missingRightIdTasks], 'date_added')[0].id).toBe(3);
        expect(sortTasks([...missingIdTasks], 'date_added_asc')[0].id).toBe(null);
        expect(sortTasks([...missingRightIdTasks], 'date_added_asc')[0].id).toBe(null);
    });

    it('falls back to priority sort for unknown sort type', () => {
        const sorted = sortTasks([...tasks], 'unknown');
        expect(sorted).toHaveLength(3);
    });
});

describe('hydrateTasks', () => {
    it('filters out completed tasks', () => {
        const tasks = [
            { id: 1, title: 'Active', completed: false, task_list: '1' },
            { id: 2, title: 'Done', completed: true, task_list: '1' },
        ];
        const lists = [{ id: 1, name: 'Main', color: '#FF0000' }];
        const result = hydrateTasks(tasks, lists);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Active');
    });

    it('adds list_name and list_color to tasks', () => {
        const tasks = [{ id: 1, title: 'Task', completed: false, task_list: 1 }];
        const lists = [{ id: 1, name: 'Work', color: '#123456' }];
        const result = hydrateTasks(tasks, lists);
        expect(result[0].list_name).toBe('Work');
        expect(result[0].list_color).toBe('#123456');
    });

    it('uses default values for unknown list', () => {
        const tasks = [{ id: 1, title: 'Task', completed: false, task_list: 99 }];
        const result = hydrateTasks(tasks, []);
        expect(result[0].list_name).toBe('Other');
    });

    it('handles null/undefined inputs', () => {
        expect(hydrateTasks(null, null)).toEqual([]);
        expect(hydrateTasks(undefined, undefined)).toEqual([]);
    });

    it('assigns default color from FOCUS_BLOCK_COLOURS_HEX when list has no color', () => {
        const tasks = [{ id: 1, title: 'Task', completed: false, task_list: 1 }];
        const lists = [{ id: 1, name: 'Work' }];
        const result = hydrateTasks(tasks, lists);
        expect(result[0].list_color).toBeTruthy();
    });

    it('uses "Other" when a known list is missing its name', () => {
        const tasks = [{ id: 1, title: 'Task', completed: false, task_list: 1 }];
        const lists = [{ id: 1, color: '#abcdef' }];
        const result = hydrateTasks(tasks, lists);

        expect(result[0].list_name).toBe('Other');
        expect(result[0].list_color).toBe('#abcdef');
    });
});
