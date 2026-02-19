import { isSameDay } from '../../utils/dateUtils';
import { getAllDayVisualRange } from '../../utils/eventDisplayUtils';

export function calculateEventLayout(events, days) {
    const visibleEvents = events.map(event => {
        const range = getAllDayVisualRange(event);
        if (!range) return null;
        const startIdx = getStartIndex(range.start, days);
        const endIdx = getEndIndex(range.end, days);
        if (startIdx === null || endIdx === null) return null;
        return {
            event,
            startCol: startIdx + 1,
            endCol: endIdx + 2
        };
    }).filter(Boolean);

    visibleEvents.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        const widthA = a.endCol - a.startCol;
        const widthB = b.endCol - b.startCol;
        return widthB - widthA;
    });

    const rows = [];
    visibleEvents.forEach(item => {
        let placed = false;
        for (let i = 0; i < rows.length; i++) {
            if (!rowCollides(rows[i], item)) {
                rows[i].push(item);
                item.row = i + 1;
                placed = true;
                break;
            }
        }
        if (!placed) {
            rows.push([item]);
            item.row = rows.length;
        }
    });

    return visibleEvents;
}

function rowCollides(rowItems, newItem) {
    return rowItems.some(existing => {
        return Math.max(existing.startCol, newItem.startCol) < Math.min(existing.endCol, newItem.endCol);
    });
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
