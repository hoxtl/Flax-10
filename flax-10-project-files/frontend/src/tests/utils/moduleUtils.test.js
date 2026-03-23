/*
 * Tests for module utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    getDepartment, isEnrolledIn, getEnrollmentId, serialiseModule,
    formatWeekdayTime, formatFullDateTime, formatTime, formatDuration,
    formatForInput, filterModules, getDepartments, sortModules, applyFiltersAndSort
} from '../../components/Modules/utils/moduleUtils';

const modules = [
    { id: 1, module_code: 'CS1000', module_name: 'Intro to CS', deadlines: [1, 2] },
    { id: 2, module_code: 'MA2000', module_name: 'Linear Algebra', deadlines: [1] },
    { id: 3, module_code: 'HI3000', module_name: 'History of Art', deadlines: [] },
];

const enrollments = [
    { id: 10, module: 1 },
    { id: 11, module: 2 },
];

describe('moduleUtils', () => {
    describe('getDepartment', () => {
        it('returns correct department for known prefix', () => {
            expect(getDepartment('CS1000')).toBe("Natural, Mathematical & Engineering Sciences");
        });
        it('returns default for unknown prefix', () => {
            expect(getDepartment('XX9999')).toBe("King's College London");
        });
        it('handles null module_code', () => {
            expect(getDepartment(null)).toBe("King's College London");
        });
        it('handles LW prefix', () => {
            expect(getDepartment('LW1000')).toBe("Law");
        });
    });

    describe('isEnrolledIn', () => {
        it('returns true if enrolled', () => {
            expect(isEnrolledIn(1, enrollments)).toBe(true);
        });
        it('returns false if not enrolled', () => {
            expect(isEnrolledIn(3, enrollments)).toBe(false);
        });
    });

    describe('getEnrollmentId', () => {
        it('returns enrollment id if enrolled', () => {
            expect(getEnrollmentId(1, enrollments)).toBe(10);
        });
        it('returns null if not enrolled', () => {
            expect(getEnrollmentId(3, enrollments)).toBeNull();
        });
    });

    describe('serialiseModule', () => {
        it('serialises form data correctly', () => {
            const form = {
                module_code: 'CS1000', module_name: 'Intro to CS', description: 'desc',
                start_time: '10:00', end_time: '11:00', location: 'Room 1', is_recurring: true
            };
            expect(serialiseModule(form)).toEqual({
                module_code: 'CS1000', module_name: 'Intro to CS', description: 'desc',
                start_time: '10:00', end_time: '11:00', location: 'Room 1', is_recurring: true
            });
        });
        it('defaults is_recurring to true when undefined', () => {
            const form = { module_code: 'CS1000', module_name: 'X', description: '', start_time: '', end_time: '', location: '' };
            expect(serialiseModule(form).is_recurring).toBe(true);
        });
        it('uses false when is_recurring is false', () => {
            const form = { module_code: 'CS', module_name: 'X', description: '', start_time: '', end_time: '', location: '', is_recurring: false };
            expect(serialiseModule(form).is_recurring).toBe(false);
        });
    });

    describe('formatWeekdayTime', () => {
        it('returns "Not announced yet..." for null', () => {
            expect(formatWeekdayTime(null)).toBe('Not announced yet...');
        });
        it('returns formatted weekday time', () => {
            const result = formatWeekdayTime('2026-02-16T10:00:00');
            expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
            expect(result).toContain('at');
        });
    });

    describe('formatFullDateTime', () => {
        it('returns "Not announced yet..." for null', () => {
            expect(formatFullDateTime(null)).toBe('Not announced yet...');
        });
        it('returns formatted date/time string', () => {
            const result = formatFullDateTime('2026-02-16T10:00:00');
            expect(result).toMatch(/2026/);
        });
    });

    describe('formatTime', () => {
        it('returns "Not announced yet..." for null', () => {
            expect(formatTime(null)).toBe('Not announced yet...');
        });
        it('returns formatted time', () => {
            const result = formatTime('2026-02-16T10:30:00');
            expect(result).toMatch(/10:30/);
        });
    });

    describe('formatDuration', () => {
        it('returns empty string when start or end missing', () => {
            expect(formatDuration(null, '2026-01-01T11:00:00')).toBe('');
            expect(formatDuration('2026-01-01T10:00:00', null)).toBe('');
        });
        it('returns hours and minutes', () => {
            expect(formatDuration('2026-01-01T10:00:00', '2026-01-01T11:30:00')).toBe('1h 30m');
        });
        it('returns hours only', () => {
            expect(formatDuration('2026-01-01T10:00:00', '2026-01-01T11:00:00')).toBe('1h');
        });
        it('returns minutes only', () => {
            expect(formatDuration('2026-01-01T10:00:00', '2026-01-01T10:45:00')).toBe('45m');
        });
    });

    describe('formatForInput', () => {
        it('returns current time when null', () => {
            const result = formatForInput(null);
            expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
        });
        it('formats date string', () => {
            const result = formatForInput('2026-02-15T10:00:00Z');
            expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
        });
        it('formats Date object', () => {
            const result = formatForInput(new Date('2026-02-15T10:00:00Z'));
            expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
        });
    });

    describe('filterModules', () => {
        it('returns all modules on empty search with filter all', () => {
            expect(filterModules(modules, enrollments, '', 'all')).toHaveLength(3);
        });
        it('filters by search query on module_name', () => {
            const result = filterModules(modules, enrollments, 'algebra', 'all');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
        });
        it('filters by search query on module_code', () => {
            const result = filterModules(modules, enrollments, 'CS', 'all');
            expect(result).toHaveLength(1);
        });
        it('filters by enrolled mode', () => {
            const result = filterModules(modules, enrollments, '', 'enrolled');
            expect(result).toHaveLength(2);
        });
        it('can exclude enrolled modules in browse mode', () => {
            const result = filterModules(modules, enrollments, '', 'all', { excludeEnrolled: true });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(3);
        });
    });

    describe('getDepartments', () => {
        it('returns unique sorted departments', () => {
            const depts = getDepartments(modules);
            expect(depts).toContain("Natural, Mathematical & Engineering Sciences");
            expect(depts).toContain("Arts & Humanities");
            expect(new Set(depts).size).toBe(depts.length);
        });
    });

    describe('sortModules', () => {
        it('sorts by module_name by default', () => {
            const sorted = sortModules(modules, 'name');
            expect(sorted[0].module_name).toBe('History of Art');
        });
        it('sorts by deadlines count', () => {
            const sorted = sortModules(modules, 'deadlines');
            expect(sorted[0].id).toBe(1); // 2 deadlines
        });
    });

    describe('applyFiltersAndSort', () => {
        it('returns all when department is all', () => {
            const result = applyFiltersAndSort(modules, 'all', 'name');
            expect(result).toHaveLength(3);
        });
        it('filters by department', () => {
            const result = applyFiltersAndSort(modules, 'Arts & Humanities', 'name');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(3);
        });
    });
});
