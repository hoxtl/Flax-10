import { useEffect, useRef } from 'react';
import { SLOT_HEIGHT } from './calendarConstants';

export function useAutoScroll(ref, events) {
    const hasScrolled = useRef(false);

    useEffect(() => {
        if (!ref.current || hasScrolled.current) return;

        const minutes = getEarliestMinutes(events);
        const scrollY = (minutes / 60) * SLOT_HEIGHT - 10;
        ref.current.scrollTop = scrollY;
        hasScrolled.current = true;
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
