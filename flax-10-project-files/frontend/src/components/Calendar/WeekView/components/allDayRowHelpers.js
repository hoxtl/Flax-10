/**
 * allDayRowHelpers - Layout calculations for all-day events in week view.
 * Handles positioning events across multiple days with row stacking.
 */

import { isSameDay } from '../../utils/dateUtils';
import { getAllDayVisualRange } from '../../utils/eventDisplayUtils';

function mapEventToLayout(event, days) {
    const range = getAllDayVisualRange(event);
    if (!range) return null;
    const startIdx = getStartIndex(range.start, days);
    const endIdx = getEndIndex(range.end, days);
    if (startIdx === null || endIdx === null) return null;
    return { event, startCol: startIdx + 1, endCol: endIdx + 2 };
}

function sortByStartAndWidth(a, b) {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return (b.endCol - b.startCol) - (a.endCol - a.startCol);
}

function findRowForItem(rows, item) {
    const index = rows.findIndex(row => !rowCollides(row, item));
    return index;
}

function placeItemInRow(rows, item, rowIdx) {
    if (rowIdx >= 0) { rows[rowIdx].push(item); item.row = rowIdx + 1; return; }
    rows.push([item]);
    item.row = rows.length;
}

function assignRowsToItems(items) {
    const rows = [];
    items.forEach(item => placeItemInRow(rows, item, findRowForItem(rows, item)));
}

/** Calculates layout positions for all-day events across week columns. */

export function calculateEventLayout(events, days) {
    const visibleEvents = events.map(e => mapEventToLayout(e, days)).filter(Boolean);
    visibleEvents.sort(sortByStartAndWidth);
    assignRowsToItems(visibleEvents);
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
