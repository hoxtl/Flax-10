import { useMemo } from 'react';
import { isSameDay } from '../utils/dateUtils';

function getDateKey(date) {
    return date.toISOString().split('T')[0];
}

function sortByStartTime(a, b) {
    return new Date(a.start_time) - new Date(b.start_time);
}

function groupEventsByDate(events) {
    const groups = new Map();
    events.forEach(event => {
        const key = getDateKey(new Date(event.start_time));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(event);
    });
    return groups;
}

function sortGroupedEvents(groups) {
    groups.forEach(events => events.sort(sortByStartTime));
    return groups;
}

function getSortedDateKeys(groups) {
    return Array.from(groups.keys()).sort();
}

export function useEventGrouping(events, viewMode) {
    return useMemo(() => {
        if (!events?.length) return { groupedEvents: new Map(), dateKeys: [] };

        const sorted = [...events].sort(sortByStartTime);
        if (viewMode === 'day') return { groupedEvents: new Map(), dateKeys: [], flatEvents: sorted };

        const groups = sortGroupedEvents(groupEventsByDate(sorted));
        return { groupedEvents: groups, dateKeys: getSortedDateKeys(groups) };
    }, [events, viewMode]);
}
