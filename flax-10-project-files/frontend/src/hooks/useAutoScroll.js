import { useEffect, useRef } from 'react';
import { SLOT_HEIGHT } from '../components/Calendar/calendarConstants';

export function useAutoScroll(ref, events, dependency) {
    const hasScrolled = useRef(false);

    // Reset scrolled state when dependency changes (e.g. date changes)
    useEffect(() => {
        hasScrolled.current = false;
    }, [dependency]);

    useEffect(() => {
        if (!ref.current || hasScrolled.current) return;
        performScroll(ref, events, hasScrolled);
    }, [events, ref, dependency]);
}

function performScroll(ref, events, hasScrolled) {
    const minutes = getEarliestMinutes(events);
    const scrollY = (minutes / 60) * SLOT_HEIGHT - 10;

    requestAnimationFrame(() => {
        if (ref.current) {
            ref.current.scrollTop = scrollY;
            hasScrolled.current = true;
        }
    });
}

function getEarliestMinutes(events) {
    if (!events.length) return 9 * 60;
    const minutes = events.map(e => {
        const d = new Date(e.start_time);
        return d.getHours() * 60 + d.getMinutes();
    });
    return Math.min(...minutes);
}
