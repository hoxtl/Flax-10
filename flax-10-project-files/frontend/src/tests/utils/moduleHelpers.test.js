import { describe, it, expect } from 'vitest';
import { validateForm, getFormData, updateForm } from '../../components/Modules/utils/moduleHelpers';

describe('moduleHelpers', () => {
    it('getFormData returns default empty form', () => {
        const form = getFormData();
        expect(form.module_code).toBe('');
        expect(form.module_name).toBe('');
        expect(form.is_recurring).toBe(true);
    });

    it('validateForm returns error for missing module code', () => {
        const form = { ...getFormData(), module_name: 'Test', start_time: '2026-03-01T09:00', end_time: '2026-03-01T10:00' };
        const errors = validateForm(form);
        expect(errors.module_code).toBeDefined();
    });

    it('validateForm returns error for missing module name', () => {
        const form = { ...getFormData(), module_code: 'CS101', start_time: '2026-03-01T09:00', end_time: '2026-03-01T10:00' };
        const errors = validateForm(form);
        expect(errors.module_name).toBeDefined();
    });

    it('validateForm returns error when end before start', () => {
        const form = { module_code: 'CS101', module_name: 'Test', start_time: '2026-03-01T10:00', end_time: '2026-03-01T09:00' };
        const errors = validateForm(form);
        expect(errors.end_time).toBeDefined();
    });

    it('validateForm returns no errors for valid form', () => {
        const form = {
            module_code: 'CS101',
            module_name: 'Test',
            department: 'Natural, Mathematical & Engineering Sciences',
            course: 'Computer Science',
            start_time: '2026-03-01T09:00',
            end_time: '2026-03-01T10:00',
        };
        const errors = validateForm(form);
        expect(Object.keys(errors)).toHaveLength(0);
    });

    describe('updateForm', () => {
        it('returns form with empty strings when module has no fields', () => {
            const result = updateForm({});
            expect(result.module_code).toBe('');
            expect(result.module_name).toBe('');
            expect(result.description).toBe('');
            expect(result.start_time).toBeDefined();
            expect(result.end_time).toBeDefined();
            expect(result.location).toBe('');
            expect(result.is_recurring).toBe(false);
        });

        it('returns form with module values when provided', () => {
            const module = {
                module_code: 'CS101',
                module_name: 'Intro',
                description: 'Desc',
                start_time: '2026-03-01T09:00:00',
                end_time: '2026-03-01T10:00:00',
                location: 'Room 1',
                recurrence_rule: 'FREQ=WEEKLY',
            };
            const result = updateForm(module);
            expect(result.module_code).toBe('CS101');
            expect(result.module_name).toBe('Intro');
            expect(result.description).toBe('Desc');
            expect(result.location).toBe('Room 1');
            expect(result.is_recurring).toBe(true);
        });
    });
});