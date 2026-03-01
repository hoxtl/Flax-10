import { addDays, addWeeks, addMonths, getStartOfMonth, getEndOfMonth } from './dateUtils';

export function expandRecurringEvents(events, viewDate) {
    const { viewStart, viewEnd } = getViewRange(viewDate);
    return events.flatMap(e => expandEvent(e, viewStart, viewEnd));
}

function getViewRange(viewDate) {
    const viewStart = getStartOfMonth(viewDate);
    const viewEnd = getEndOfMonth(viewDate);
    viewEnd.setDate(viewEnd.getDate() + 7);
    return { viewStart, viewEnd };
}

function expandEvent(event, viewStart, viewEnd) {
    const recurrence = event.recurrence || 'none';
    if (recurrence === 'none') return [event];
    return generateOccurrences(event, recurrence, viewStart, viewEnd);
}

function generateOccurrences(event, recurrence, viewStart, viewEnd) {
    const baseStart = new Date(event.start_time);
    const baseEnd = new Date(event.end_time);
    const duration = baseEnd - baseStart;
    const endDate = getEndDate(event);
    const exceptions = getExceptions(event);
    const occurrences = [];

    for (let i = 0; i < 100; i++) {
        const start = calcNextOccurrence(baseStart, recurrence, i);
        if (start > viewEnd) break;
        if (endDate && start > endDate) break;

        const dateStr = start.toISOString().slice(0, 10);
        if (exceptions.includes(dateStr)) continue;

        const end = new Date(start.getTime() + duration);
        if (overlapsRange(start, end, viewStart, viewEnd)) {
            occurrences.push(createOccurrence(event, start, end, i));
        }
    }
    return occurrences;
}

function getExceptions(event) {
    if (event.exception_dates) return event.exception_dates;
    if (event.recurrence_rule?.exception_dates) return event.recurrence_rule.exception_dates;
    return [];
}

function getEndDate(event) {
    if (!event.recurrence_end_date) return null;
    const d = new Date(event.recurrence_end_date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function calcNextOccurrence(baseDate, recurrence, index) {
    if (recurrence === 'daily') return addDays(baseDate, index);
    if (recurrence === 'weekly') return addWeeks(baseDate, index);
    if (recurrence === 'biweekly') return addWeeks(baseDate, index * 2);
    if (recurrence === 'monthly') return addMonths(baseDate, index);
    if (recurrence === 'yearly') return addYears(baseDate, index);
    return baseDate;
}

function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

function overlapsRange(start, end, viewStart, viewEnd) {
    return start <= viewEnd && end >= viewStart;
}

function createOccurrence(event, start, end, index) {
    return { ...event, id: `${event.id}_${index}`, start_time: start.toISOString(), end_time: end.toISOString(), _baseId: event.id };
}
