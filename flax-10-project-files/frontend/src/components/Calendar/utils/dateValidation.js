export function validateDateRange(startTime, endTime) {
    if (!startTime) return null;
    if (!endTime) return null;
    if (new Date(startTime) >= new Date(endTime)) return 'Start must be before end';
    return null;
}

export function validateEventTimes(form) {
    if (!form.start_time) return 'Start time is required';
    if (!form.end_time) return 'End time is required';
    return validateDateRange(form.start_time, form.end_time);
}
