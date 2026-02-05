export function getWeekDays(date) {
    const start = getStartOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthDays(date) {
    const start = getStartOfMonth(date);
    const end = getEndOfMonth(date);
    const startWeek = getStartOfWeek(start);
    const days = [];

    let current = startWeek;
    while (current <= end || days.length % 7 !== 0) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }
    return days;
}

export function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

export function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}