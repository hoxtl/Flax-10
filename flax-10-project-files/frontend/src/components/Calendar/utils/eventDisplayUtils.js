/**
 * eventDisplayUtils - Event display logic for all-day and timed events.
 * Determines how events should appear in time grids vs all-day rows.
 */
import { overlapsDay, startOfDay } from './dateUtils';

/** Returns true if the event should display as an all-day event. */
export function isAllDayEvent(event) {
    if (event.all_day || event.is_all_day || event.allDay) return true;
    return isMidnightAligned(event);
}

function isMidnightAligned(event) {
    const s = new Date(event.start_time);
    const e = new Date(event.end_time);
    return s.getHours() === 0 && s.getMinutes() === 0 &&
        e.getHours() === 0 && e.getMinutes() === 0;
}

/** Returns true if the event should appear in the hourly time grid. */
export function shouldShowInTimeGrid(event, day) {
    if (isAllDayEvent(event)) return false;
    return isPartialSegment(event, day);
}

function isPartialSegment(event, day) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return overlapsDay(start, end, day) && !isFullDay(event, day);
}

export function isFullDay(event, day) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return eventStart <= dayStart && eventEnd >= dayEnd;
}

/** Calculates the visual date range for an all-day event display. */
export function getAllDayVisualRange(event) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    if (isAllDayEvent(event)) {
        return getExplicitAllDayRange(start, end);
    }
    return getTimedAllDayRange(start, end);
}

function getExplicitAllDayRange(start, end) {
    const vStart = toMidnight(start);
    const vEnd = toMidnight(end);

    if (end.getTime() === vEnd.getTime() && end > start) {
        vEnd.setDate(vEnd.getDate() - 1);
    }
    return { start: vStart, end: vEnd };
}

function getTimedAllDayRange(start, end) {
    const vStart = toMidnight(start);
    if (start.getTime() !== vStart.getTime()) {
        vStart.setDate(vStart.getDate() + 1);
    }

    const vEnd = toMidnight(end);
    vEnd.setDate(vEnd.getDate() - 1);

    if (vStart > vEnd) return null;
    return { start: vStart, end: vEnd };
}

function toMidnight(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
