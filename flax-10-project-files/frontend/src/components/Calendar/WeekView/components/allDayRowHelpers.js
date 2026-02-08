import { isSameDay } from '../../../../utils/dateUtils';
import { getAllDayVisualRange } from '../../../../utils/eventDisplayUtils';

export function calculateBarStyle(event, days) {
    const range = getAllDayVisualRange(event);
    if (!range) return null;
    const startIdx = getStartIndex(range.start, days);
    const endIdx = getEndIndex(range.end, days);
    if (startIdx === null || endIdx === null) return null;
    return {
        gridColumnStart: startIdx + 1,
        gridColumnEnd: endIdx + 2,
        backgroundColor: event.tag_details?.color || '#3b82f6'
    };
}

function getStartIndex(start, days) {
    const idx = days.findIndex(d => isSameDay(d, start));
    if (idx !== -1) return idx;
    const weekStart = new Date(days[0]);
    weekStart.setHours(0, 0, 0, 0);
    if (start < weekStart) return 0;
    return null;
}

function getEndIndex(end, days) {
    const idx = days.findIndex(d => isSameDay(d, end));
    if (idx !== -1) return idx;
    const weekEnd = new Date(days[days.length - 1]);
    weekEnd.setHours(23, 59, 59, 999);
    if (end > weekEnd) return days.length - 1;
    return null;
}
