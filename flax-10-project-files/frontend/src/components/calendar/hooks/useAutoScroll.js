/**
 * useAutoScroll - Auto-scrolls calendar view to current time on mount.
 * Scrolls time grid to show the current hour in view.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useEffect, useRef } from 'react';
import { SLOT_HEIGHT } from '../calendarConstants';

/** Hook that scrolls a time grid container to the current time. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function useAutoScroll(ref, events, dependency) {
    const hasScrolled = useRef(false);
    useEffect(() => {
        hasScrolled.current = false;
    }, [dependency]);

    useEffect(() => {
        if (!ref.current || hasScrolled.current) return;
        performScroll(ref, hasScrolled);
    }, [events, ref, dependency]);
}

function performScroll(ref, hasScrolled) {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const scrollY = (minutes / 60) * SLOT_HEIGHT - (SLOT_HEIGHT * 2);

    requestAnimationFrame(() => {
        if (ref.current) {
            ref.current.scrollTop = scrollY > 0 ? scrollY : 0;
            hasScrolled.current = true;
        }
    });
}
