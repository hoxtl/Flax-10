/*
 * Timer feature file.
 */

export function fmtDuration(sec) {
    if (sec <= 0) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

export function formatHoursAsClock(hours) {
    const totalSeconds = Math.max(0, Math.round(Number(hours || 0) * 3600));
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

export const formatSessionMinutes = (seconds) => `${Math.max(0, Math.round(seconds / 60))}m`;

export function taskDueText(task, now = new Date()) {
    if (!task?.due_date) return null;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return null;
    const diffMs = due.getTime() - now.getTime();
    const absMin = Math.abs(diffMs) / 60000;
    if (absMin < 5) return 'now';
    return diffMs < 0 ? formatOverdueText(absMin) : formatRemainingText(absMin);
}

function formatOverdueText(absMin) {
    const parts = getDueTimeParts(absMin);
    if (parts.days > 0) return `${parts.days}d ${parts.remainingHours}h overdue`;
    return `${parts.hours > 0 ? `${parts.hours}h ` : ''}${parts.minutes}m overdue`;
}

function formatRemainingText(absMin) {
    const parts = getDueTimeParts(absMin);
    if (parts.days > 0) return `${parts.days}d ${parts.remainingHours}h left`;
    if (parts.hours === 0) return `${parts.minutes}m left`;
    return `${parts.hours}h ${parts.minutes}m left`;
}

function getDueTimeParts(absMin) {
    const days = Math.floor(absMin / (60 * 24));
    const hours = Math.floor(absMin / 60);
    const minutes = Math.round(absMin % 60);
    const remainingHours = Math.floor((absMin - days * 24 * 60) / 60);
    return { days, hours, minutes, remainingHours };
}

export const extractTime = (value) => {
    try {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    } catch { return null; }
};

export const isToday = (dateValue) => {
    const d = extractTime(dateValue);
    if (!d) return false;
    return d.toDateString() === new Date().toDateString();
};
