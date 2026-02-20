import { describe, it, expect } from 'vitest';
import { validateForm, getFormData } from '../../utils/moduleHelpers';

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
        const form = { module_code: 'CS101', module_name: 'Test', start_time: '2026-03-01T09:00', end_time: '2026-03-01T10:00' };
        const errors = validateForm(form);
        expect(Object.keys(errors)).toHaveLength(0);
    });
});