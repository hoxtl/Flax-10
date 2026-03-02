import { useEffect, useRef } from 'react';
import { SLOT_HEIGHT } from '../calendarConstants';

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

// Walk up the DOM to find the nearest element that actually scrolls
function getScrollParent(el) {
    let node = el?.parentElement;
    while (node) {
        const { overflow, overflowY } = getComputedStyle(node);
        if (/auto|scroll/.test(overflow + overflowY)) return node;
        node = node.parentElement;
    }
    return null;
}

function performScroll(ref, events, hasScrolled) {
    const minutes = getEarliestMinutes(events);
    const scrollY = (minutes / 60) * SLOT_HEIGHT - 10;

    requestAnimationFrame(() => {
        const container = getScrollParent(ref.current);
        if (container) {
            container.scrollTop = Math.max(0, scrollY);
            hasScrolled.current = true;
        }
    });
}

function getEarliestMinutes(events) {
    if (!events.length) return 7 * 60; // Default to 7 AM when no events
    const minutes = events.map(e => {
        const d = new Date(e.start_time);
        return d.getHours() * 60 + d.getMinutes();
    });
    return Math.min(...minutes);
}
