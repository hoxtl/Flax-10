/*
 * Helper functions for module form state and validation.
 */

import { formatForInput } from './moduleUtils.js';

export function getFormData() {
    return { module_code: '', module_name: '', description: '', department: '', course: '', start_time: '', end_time: '', location: '', is_recurring: true };
}

export function updateForm(module) {
    return {
        module_code: module.module_code || '',
        module_name: module.module_name || '',
        description: module.description || '',
        department: module.department || '',
        course: module.course || '',
        start_time: formatForInput(module.start_time),
        end_time: formatForInput(module.end_time),
        location: module.location || '',
        is_recurring: !!module.recurrence_rule
    }
}

export function validateForm(form_data) {
    const errors = {};
    if (!form_data.department) errors.department = 'Department is required';
    if (!form_data.course) errors.course = 'Course is required';
    if (!form_data.module_code.trim()) errors.module_code = 'Module code is required';
    if (!form_data.module_name.trim()) errors.module_name = 'Module name is required';
    if (!form_data.start_time) errors.start_time = 'Start time is required';
    if (!form_data.end_time) errors.end_time = 'End time is required';
    validateTimes(form_data, errors);
    return errors;
}

function validateTimes(form_data, errors) {
    if ((!form_data.start_time) || !(form_data.end_time)) return;
    if (new Date(form_data.end_time) <= new Date(form_data.start_time)) {
        errors.end_time = 'End time has to be after the start time.';
    }
}
