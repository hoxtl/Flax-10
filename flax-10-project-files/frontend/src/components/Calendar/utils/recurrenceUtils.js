/**
 * recurrenceUtils - Expands recurring calendar events into individual occurrences.
 * Handles daily, weekly, biweekly, monthly, and yearly recurrence patterns.
 */
import { addDays, addWeeks, addMonths, getStartOfMonth, getEndOfMonth } from './dateUtils';

/** Expands all recurring events within the given view date's month. */
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

function shouldIncludeOccurrence(start, endDate, exceptions) {
    if (endDate && start > endDate) return false;
    const dateStr = start.toISOString().slice(0, 10);
    return !exceptions.includes(dateStr);
}

function collectOccurrence(occurrences, event, start, duration, viewStart, viewEnd, index) {
    const end = new Date(start.getTime() + duration);
    if (overlapsRange(start, end, viewStart, viewEnd)) {
        occurrences.push(createOccurrence(event, start, end, index));
    }
}

function shouldProcessOccurrence(start, viewEnd, endDate, exceptions) {
    if (start > viewEnd) return 'stop';
    if (!shouldIncludeOccurrence(start, endDate, exceptions)) return 'skip';
    return 'include';
}

function generateOccurrences(event, recurrence, viewStart, viewEnd) {
    const baseStart = new Date(event.start_time);
    const duration = new Date(event.end_time) - baseStart;
    const endDate = getEndDate(event);
    const exceptions = getExceptions(event);
    return buildOccurrencesList(event, recurrence, baseStart, duration, endDate, exceptions, viewStart, viewEnd);
}

function processOneOccurrence(ctx, i) {
    const start = calcNextOccurrence(ctx.baseStart, ctx.recurrence, i);
    const action = shouldProcessOccurrence(start, ctx.viewEnd, ctx.endDate, ctx.exceptions);
    if (action === 'stop') return false;
    if (action === 'include') collectOccurrence(ctx.occurrences, ctx.event, start, ctx.duration, ctx.viewStart, ctx.viewEnd, i);
    return true;
}

function buildOccurrencesList(event, recurrence, baseStart, duration, endDate, exceptions, viewStart, viewEnd) {
    const ctx = { event, recurrence, baseStart, duration, endDate, exceptions, viewStart, viewEnd, occurrences: [] };
    for (let i = 0; i < 100 && processOneOccurrence(ctx, i); i++);
    return ctx.occurrences;
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
