/*
 * CurrentTimeLine.jsx
 * Red line indicator for the current time in Day and Week views.
 */

import { useState, useEffect } from 'react';
import { SLOT_HEIGHT } from '../calendarConstants';

function useCurrentTime() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);
    return now;
}

/** Renders a red line and dot at the current time position. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function CurrentTimeLine() {
    const now = useCurrentTime();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const top = totalMinutes * (SLOT_HEIGHT / 60);

    return (
        <div className="now-line" style={{ top: `${top}px` }}>
            <div className="now-line-dot" />
        </div>
    );
}
