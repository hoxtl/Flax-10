import { useEffect } from 'react';
import { SLOT_HEIGHT } from './calendarConstants';

export function useAutoScroll(ref, events) {
    useEffect(() => {
        if (!ref.current) return;
        const minutes = getEarliestMinutes(events);
        const scrollY = (minutes / 60) * SLOT_HEIGHT - 10; // so that the whole time is shown
        ref.current.scrollTop = scrollY;
    }, [events, ref]);
}

function getEarliestMinutes(events) {
    if (!events.length) return 9 * 60; // Default to 9 AM
    const minutes = events.map(e => {
        const d = new Date(e.start_time);
        return d.getHours() * 60 + d.getMinutes();
    });
    return Math.min(...minutes);
}
