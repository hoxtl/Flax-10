/**
 * Helpers for TimeRow date/time input handling.
 * Provides type resolution, value formatting, and change handlers for all-day and timed events.
 */

/** Returns a change handler for the DateTimePicker in all-day mode. */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/event_modal/components/timeRowHelpers.js

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/EventModal/components/timeRowHelpers.js
export function handleDateOnlyPickerChange(field, update) {
    return (val) => {
        if (!val) return update(field)({ target: { value: "" } });
        const adjusted = field === 'end_time' ? addOneDay(val) : val;
        update(field)({ target: { value: adjusted + 'T00:00' } });
    };
}

function addOneDay(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

export function handleDatePickerChange(field, update) {
    return (isoString) => update(field)({ target: { value: isoString } });
}

export function getDisplayValue(value, isAllDay, field) {
    if (isAllDay && value) {
        return getAdjustedDisplayValue(value, field);
    }
    return value;
}

function getAdjustedDisplayValue(value, field) {
    if (field === 'end_time') {
        const date = new Date(value);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }
    return value.split('T')[0];
}

export function handleToggle(setForm, form) {
    return (e) => {
        const isAllDay = e.target.checked;
        setForm(prev => getToggleUpdates(prev, isAllDay));
    };
}

function getToggleUpdates(prev, isAllDay) {
    const updates = { ...prev, all_day: isAllDay };
    if (!isAllDay) return updates;

    updates.start_time = stripTime(updates.start_time);
    updates.end_time = adjustEndDate(updates.end_time);
    return updates;
}

function stripTime(isoString) {
    if (!isoString) return isoString;
    return isoString.split('T')[0] + 'T00:00';
}

function adjustEndDate(isoString) {
    if (!isoString) return isoString;
    const endStr = isoString.split('T')[0];
    const endDate = new Date(endStr);
    endDate.setDate(endDate.getDate() + 1);
    return endDate.toISOString().split('T')[0] + 'T00:00';
}
