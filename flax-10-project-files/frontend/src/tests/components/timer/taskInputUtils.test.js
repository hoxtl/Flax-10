import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../../../pages/Tasks/constants/focusBlockColours', () => ({
    FOCUS_BLOCK_COLOURS_HEX: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333'],
}));

vi.mock('../../../utils/moduleCodeUtils', () => ({
    normalizeModuleCode: vi.fn((code) => (code ? String(code).toUpperCase().trim() : null)),
    getModuleCodePrefix: vi.fn((code) => (code ? String(code).slice(0, 2) : '')),
}));

vi.mock('../../../components/Modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn((id, enrollments) => enrollments.some((e) => e.module_id === id || e === id)),
}));

vi.mock('../../../lib/focusPlanner', () => ({
    compareTaskDue: vi.fn((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
    }),
    compareTaskEstimatedTime: vi.fn((a, b) => (a.estimated_blocks || 1) - (b.estimated_blocks || 1)),
    compareTaskPriority: vi.fn((a, b) => 0),
    getTaskDurationMinutes: vi.fn((task) => (task.estimated_blocks || 1) * 25),
}));

vi.mock('../../../components/Timer/task_input/taskInputConstants', () => ({
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
    buildModuleItems,
    buildListItems,
    groupModuleItems,
    filterListItems,
    filterTasks,
    getRecommendedTask,
    mapEnrolledModules,
    getTaskDurationLabel,
} from '../../../components/Timer/task_input/taskInputUtils';

describe('getTaskUrgencyTone', () => {
    it('returns "cool" when no due date', () => {
        expect(getTaskUrgencyTone({})).toBe('cool');
        expect(getTaskUrgencyTone(null)).toBe('cool');
    });

    it('returns "cool" for invalid due date', () => {
        expect(getTaskUrgencyTone({ due_date: 'invalid' })).toBe('cool');
    });

    it('returns "hot" when due today (before end of day)', () => {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        // Due in 1 minute
        const soonDue = new Date(Date.now() + 60000);
        expect(getTaskUrgencyTone({ due_date: soonDue.toISOString() })).toBe('hot');
    });

    it('returns "hot" for overdue tasks', () => {
        const yesterday = new Date(Date.now() - 86400000);
        expect(getTaskUrgencyTone({ due_date: yesterday.toISOString() })).toBe('hot');
    });

    it('returns "warm" when due within 48 hours (tomorrow)', () => {
        const tomorrow = new Date(Date.now() + 25 * 3600000); // 25h from now
        expect(getTaskUrgencyTone({ due_date: tomorrow.toISOString() })).toBe('warm');
    });

    it('returns "cool" when due more than 48 hours away', () => {
        const farFuture = new Date(Date.now() + 72 * 3600000); // 3 days
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

    it('falls back to priority sort for unknown sort type', () => {
        const sorted = sortTasks([...tasks], 'unknown');
        expect(sorted).toHaveLength(3); // just doesn't throw
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
        const lists = [{ id: 1, name: 'Work' }]; // no color
        const result = hydrateTasks(tasks, lists);
        expect(result[0].list_color).toBeTruthy();
    });
});

describe('buildModuleItems', () => {
    it('builds items from enrolled modules', () => {
        const modules = [{ code: 'CS1001', name: 'Intro CS' }];
        const result = buildModuleItems(modules, []);
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe('CS1001');
        expect(result[0].label).toContain('CS1001');
    });

    it('adds module codes from tasks', () => {
        const tasks = [{ module_code: 'MATH101', module_name: 'Calculus' }];
        const result = buildModuleItems([], tasks);
        expect(result.some((item) => item.value === 'MATH101')).toBe(true);
    });

    it('deduplicates modules', () => {
        const modules = [{ code: 'CS1001', name: 'CS' }];
        const tasks = [{ module_code: 'CS1001', module_name: 'CS' }];
        const result = buildModuleItems(modules, tasks);
        expect(result.filter((item) => item.value === 'CS1001')).toHaveLength(1);
    });

    it('shows label with code only when no name', () => {
        const modules = [{ code: 'XY999', name: '' }];
        const result = buildModuleItems(modules, []);
        expect(result[0].label).toBe('XY999');
    });
});

describe('buildListItems', () => {
    it('maps lists to value/label items', () => {
        const lists = [{ id: 1, name: 'Work' }, { id: 2, name: 'Personal' }];
        const result = buildListItems(lists);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ value: '1', label: 'Work' });
    });

    it('uses "List" as default label when name is missing', () => {
        const lists = [{ id: 1 }];
        const result = buildListItems(lists);
        expect(result[0].label).toBe('List');
    });

    it('handles null/undefined input', () => {
        expect(buildListItems(null)).toEqual([]);
        expect(buildListItems(undefined)).toEqual([]);
    });
});

describe('groupModuleItems', () => {
    const items = [
        { value: 'CS1001', label: 'CS1001 — Intro CS' },
        { value: 'CS1002', label: 'CS1002 — Data Structures' },
        { value: 'MA1001', label: 'MA1001 — Calculus' },
    ];

    it('groups by prefix with empty query', () => {
        const result = groupModuleItems(items, '');
        expect(typeof result).toBe('object');
        expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('filters by query string', () => {
        const result = groupModuleItems(items, 'calculus');
        const allItems = Object.values(result).flat();
        expect(allItems).toHaveLength(1);
        expect(allItems[0].value).toBe('MA1001');
    });

    it('returns empty object when no matches', () => {
        const result = groupModuleItems(items, 'xyz-nonexistent');
        expect(Object.keys(result)).toHaveLength(0);
    });
});

describe('filterListItems', () => {
    const items = [
        { value: '1', label: 'Work Tasks' },
        { value: '2', label: 'Personal' },
        { value: '3', label: 'Work Projects' },
    ];

    it('returns all items when query is empty', () => {
        expect(filterListItems(items, '')).toHaveLength(3);
        expect(filterListItems(items, '  ')).toHaveLength(3);
    });

    it('filters by label substring', () => {
        const result = filterListItems(items, 'work');
        expect(result).toHaveLength(2);
    });

    it('is case insensitive', () => {
        const result = filterListItems(items, 'PERSONAL');
        expect(result).toHaveLength(1);
    });
});

describe('filterTasks', () => {
    const tasks = [
        { id: 1, title: 'Math Homework', task_list: '1', module_code: 'MATH101', list_name: 'School' },
        { id: 2, title: 'Gym Session', task_list: '2', module_code: null, list_name: 'Personal' },
        { id: 3, title: 'CS Assignment', task_list: '1', module_code: 'CS1001', list_name: 'School' },
    ];

    it('returns all tasks when no filters applied', () => {
        const state = { search: '', filterListIds: [], filterModuleCodes: [] };
        expect(filterTasks(tasks, state)).toHaveLength(3);
    });

    it('filters by search term (title)', () => {
        const state = { search: 'math', filterListIds: [], filterModuleCodes: [] };
        expect(filterTasks(tasks, state)).toHaveLength(1);
    });

    it('filters by search term (list name)', () => {
        const state = { search: 'personal', filterListIds: [], filterModuleCodes: [] };
        expect(filterTasks(tasks, state)).toHaveLength(1);
    });

    it('filters by search term (module code)', () => {
        const state = { search: 'CS1001', filterListIds: [], filterModuleCodes: [] };
        expect(filterTasks(tasks, state)).toHaveLength(1);
    });

    it('filters by list IDs', () => {
        const state = { search: '', filterListIds: ['2'], filterModuleCodes: [] };
        expect(filterTasks(tasks, state)).toHaveLength(1);
    });

    it('filters by module codes', async () => {
        const { normalizeModuleCode } = await import('../../../utils/moduleCodeUtils');
        normalizeModuleCode.mockImplementation((code) => code ? String(code).toUpperCase() : null);
        const state = { search: '', filterListIds: [], filterModuleCodes: ['MATH101'] };
        const result = filterTasks(tasks, state);
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('combines search and list filter', () => {
        const state = { search: 'assignment', filterListIds: ['1'], filterModuleCodes: [] };
        const result = filterTasks(tasks, state);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('CS Assignment');
    });
});

describe('getRecommendedTask', () => {
    it('returns null for empty list', () => {
        expect(getRecommendedTask([])).toBeNull();
    });

    it('returns the highest urgency task', () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        const future = new Date(Date.now() + 86400000 * 5).toISOString();
        const tasks = [
            { id: 1, title: 'Future Task', due_date: future },
            { id: 2, title: 'Overdue Task', due_date: yesterday },
        ];
        const result = getRecommendedTask(tasks);
        expect(result.id).toBe(2);
    });

    it('returns first task when list has one item', () => {
        const tasks = [{ id: 1, title: 'Only Task' }];
        expect(getRecommendedTask(tasks).id).toBe(1);
    });
});

describe('mapEnrolledModules', () => {
    it('returns empty array for null inputs', () => {
        expect(mapEnrolledModules(null, null)).toEqual([]);
        expect(mapEnrolledModules(undefined, undefined)).toEqual([]);
    });

    it('filters modules by enrollment and maps correctly', async () => {
        const { isEnrolledIn } = await import('../../../components/Modules/utils/moduleUtils');
        isEnrolledIn.mockImplementation((id, enrollments) => enrollments.includes(id));

        const allModules = [
            { id: 1, module_code: 'CS101', module_name: 'Intro CS' },
            { id: 2, module_code: 'MATH201', module_name: 'Calculus' },
        ];
        const enrollments = [1];
        const result = mapEnrolledModules(allModules, enrollments);
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('CS101');
        expect(result[0].name).toBe('Intro CS');
    });

    it('filters out modules with no code', async () => {
        const { isEnrolledIn } = await import('../../../components/Modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValue(true);
        const { normalizeModuleCode } = await import('../../../utils/moduleCodeUtils');
        normalizeModuleCode.mockReturnValue(null);

        const allModules = [{ id: 1, module_code: null, title: 'No Code Module' }];
        const result = mapEnrolledModules(allModules, [1]);
        expect(result).toHaveLength(0);
    });
});

describe('getTaskDurationLabel', () => {
    it('returns duration label in minutes', () => {
        const task = { estimated_blocks: 2 };
        expect(getTaskDurationLabel(task)).toBe('50 mins');
    });

    it('handles task with 1 block by default', () => {
        expect(getTaskDurationLabel({})).toBe('25 mins');
    });
});
