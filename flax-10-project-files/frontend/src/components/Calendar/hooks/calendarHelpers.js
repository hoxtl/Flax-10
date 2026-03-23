import { getStartOfWeek, getStartOfMonth, getEndOfMonth, addDays } from '../utils/dateUtils';

/**
 * Figures out what date range to fetch events for based on the current view
 * Day view = just that day
 * Week view = that week (Sun-Sat) (7 days)
 * Month view = that month (28-31 days)
 * Year view = that year (Jan 1 - Dec 31)
 */

export function getDateRangeForView(date, viewMode) {
    if (viewMode === 'day') return getDayRange(date);
    if (viewMode === 'week') return getWeekRange(date);
    return getMonthRange(date);
}


// Returns start and end of a single day (midnight to 11:59:59 PM)
function getDayRange(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
}

// Returns start of week (Sunday) to end of week (Saturday)
function getWeekRange(date) {
    const start = getStartOfWeek(date);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
}

// Returns start of month to end of month
function getMonthRange(date) {
    const start = getStartOfMonth(date);
    const end = getEndOfMonth(date);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
}