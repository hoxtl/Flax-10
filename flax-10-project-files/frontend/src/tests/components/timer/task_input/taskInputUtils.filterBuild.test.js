/*
 * Tests for buildModuleItems, buildListItems, groupModuleItems, filterListItems,
 * filterTasks, getRecommendedTask, mapEnrolledModules, and getTaskDurationLabel.
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
    buildModuleItems,
    buildListItems,
    groupModuleItems,
    filterListItems,
    filterTasks,
    getRecommendedTask,
    mapEnrolledModules,
    getTaskDurationLabel,
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

    it('uses the empty-string fallback when task module_name is missing', () => {
        const tasks = [{ module_code: 'xy123', module_name: null }];
        const result = buildModuleItems([], tasks);
        expect(result).toEqual([{ value: 'XY123', label: 'XY123' }]);
    });

    it('sorts module options by code and ignores blank normalised task codes', () => {
        const tasks = [
            { module_code: 'zz100', module_name: 'Later code' },
            { module_code: null, module_name: 'Ignore me' },
            { module_code: 'aa100', module_name: 'Earlier code' },
        ];
        const result = buildModuleItems([], tasks);
        expect(result.map((item) => item.value)).toEqual(['AA100', 'ZZ100']);
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

    it('trims the filter query before grouping', () => {
        const result = groupModuleItems(items, '  intro ');
        const allItems = Object.values(result).flat();
        expect(allItems).toHaveLength(1);
        expect(allItems[0].value).toBe('CS1001');
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
        const { normalizeModuleCode } = await import('../../../../utils/moduleCodeUtils');
        normalizeModuleCode.mockImplementation((code) => code ? String(code).toUpperCase() : null);
        const state = { search: '', filterListIds: [], filterModuleCodes: ['MATH101'] };
        const result = filterTasks(tasks, state);
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('combines module and list filters together', () => {
        const state = { search: '', filterListIds: ['1'], filterModuleCodes: ['CS1001'] };
        const result = filterTasks(tasks, state);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('CS Assignment');
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

  it('breaks urgency ties with due date order', () => {
    const nearFuture = new Date(Date.now() + 72 * 3600000);
    const earlier = new Date(nearFuture.getTime() + 3600000).toISOString();
    const later = new Date(nearFuture.getTime() + 7200000).toISOString();
    const tasks = [
      { id: 1, title: 'Later cool task', due_date: later },
      { id: 2, title: 'Earlier cool task', due_date: earlier },
    ];

    expect(getRecommendedTask(tasks).id).toBe(2);
  });

  it('returns null when the first sorted task is undefined', () => {
    expect(getRecommendedTask([undefined])).toBeNull();
  });
});

describe('mapEnrolledModules', () => {
    it('returns empty array for null inputs', () => {
        expect(mapEnrolledModules(null, null)).toEqual([]);
        expect(mapEnrolledModules(undefined, undefined)).toEqual([]);
    });

    it('filters modules by enrollment and maps correctly', async () => {
        const { isEnrolledIn } = await import('../../../../components/modules/utils/moduleUtils');
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
        const { isEnrolledIn } = await import('../../../../components/modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValue(true);
        const { normalizeModuleCode } = await import('../../../../utils/moduleCodeUtils');
        normalizeModuleCode.mockReturnValue(null);

        const allModules = [{ id: 1, module_code: null, title: 'No Code Module' }];
        const result = mapEnrolledModules(allModules, [1]);
        expect(result).toHaveLength(0);
    });

  it('falls back to module title when module_name is missing', async () => {
        const { isEnrolledIn } = await import('../../../../components/modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValue(true);
        const result = mapEnrolledModules([{ id: 1, module_code: 'cs55', title: 'Title fallback' }], [1]);
        expect(result).toEqual([{ code: 'CS55', name: 'Title fallback' }]);
    });

    it('falls back to an empty name and empty enrollments array when names are missing', async () => {
        const { isEnrolledIn } = await import('../../../../components/modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValue(true);
        const result = mapEnrolledModules([{ id: 1, module_code: 'cs77' }], null);
        expect(result).toEqual([{ code: 'CS77', name: '' }]);
        expect(isEnrolledIn).toHaveBeenCalledWith(1, []);
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
