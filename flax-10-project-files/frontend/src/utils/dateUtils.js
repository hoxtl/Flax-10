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

export function overlapsDay(eventStart, eventEnd, day) {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return eventStart < dayEnd && eventEnd > dayStart;
}

export function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear()
        && date1.getMonth() === date2.getMonth();
}

export function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMonthYear(date) {
    return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

export function addWeeks(date, weeks) {
    return addDays(date, weeks * 7);
}

export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

export function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

// From lib/dateUtils.js
export function startOfDay(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    return x;
}

export function isToday(d) {
    return isSameDay(d, new Date());
}

export function parseDateInput(v) {
    if (!v) return null;
    const x = new Date(v); x.setHours(0, 0, 0, 0);
    return x;
}

export function formatDayLabel(date, today = new Date()) {
    if (isSameDay(date, today)) return "Today";
    return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

export function isAllDayEvent(event) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const duration = (end - start) / (1000 * 60 * 60);
    return duration >= 24;
}