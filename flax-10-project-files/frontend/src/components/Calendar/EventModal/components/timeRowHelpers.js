export function getType(isAllDay) {
    return isAllDay ? 'date' : 'datetime-local';
}

export function handleDateChange(field, isAllDay, update) {
    return (e) => {
        let val = e.target.value;
        if (isAllDay && val) {
            val = adjustForAllDay(val, field);
        }
        update(field)({ target: { value: val } });
    };
}

function adjustForAllDay(val, field) {
    if (field === 'end_time') {
        const date = new Date(val);
        date.setDate(date.getDate() + 1);
        val = date.toISOString().split('T')[0];
    }
    return val + 'T00:00';
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
