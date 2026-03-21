/* Utility functions for deadline formatting and urgency. */
export const DEADLINE_LABELS = {
    exam: 'Exam' ,
    coursework: 'Coursework',
    quiz: 'Quiz',
    presentation: 'Presentation',
};

export const DEADLINE_TYPES = [
    { value: 'exam', label: 'Exam' },
    { value: 'coursework', label: 'Coursework' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'presentation', label: 'Presentation' },
];

export const TYPES_WITH_END_DATE = ['exam'];
export const TYPES_WITH_LOCATION  = ['exam', 'presentation'];

export function formatDeadlineDateTime(dateStr) {
    return new Date(dateStr).toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: false,
    });
}

export function getDeadlineCountdown(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / 86_400_000);
    if (days > 0) return `${days}d`;
    const hours = Math.floor(diff / 3_600_000);
    return hours > 0 ? `${hours}h` : 'Today';
}

/** Time remaining as "14h 20m left" or "2d 5h left" for triage display. */
export function getTimeRemainingCountdown(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Overdue';
    const totalMins = Math.floor(diff / 60_000);
    const days = Math.floor(totalMins / 1440);
    const remainderMins = totalMins % 1440;
    const hours = Math.floor(remainderMins / 60);
    const mins = remainderMins % 60;
    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
    }
    if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
    }
    return mins > 0 ? `${mins}m left` : 'Due soon';
}

/** "Due in 4 hours" style for high-contrast triage display. */
export function getDueInPhrase(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Overdue';
    const totalMins = Math.floor(diff / 60_000);
    const days = Math.floor(totalMins / 1440);
    const remainderMins = totalMins % 1440;
    const hours = Math.floor(remainderMins / 60);
    const mins = remainderMins % 60;
    if (days > 0) {
        return hours > 0 ? `Due in ${days}d ${hours}h` : `Due in ${days} day${days === 1 ? '' : 's'}`;
    }
    if (hours > 0) {
        return mins > 0 ? `Due in ${hours}h ${mins}m` : `Due in ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return mins > 0 ? `Due in ${mins}m` : 'Due soon';
}

export function getDeadlineUrgency(dateStr) {
    const days = Math.floor((new Date(dateStr) - new Date()) / 86_400_000);
    if (days < 3) return 'critical';
    if (days < 7) return 'urgent';
    return 'normal';
}

/** For traffic-light dot: 'safe' (7+ days), 'caution' (3–7 days), 'critical' (< 3 days). */
export function getDeadlineDotUrgency(dateStr) {
    const days = Math.floor((new Date(dateStr) - new Date()) / 86_400_000);
    if (days < 0) return 'critical';
    if (days < 3) return 'critical';
    if (days < 7) return 'caution';
    return 'safe';
}

/** Monospace countdown "07d : 00h : 22m" or "14h : 22m : 05s" (consistent spacing). */
export function getTimeRemainingMonospace(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Overdue';
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const remainderSec = totalSec % 86400;
    const hours = Math.floor(remainderSec / 3600);
    const mins = Math.floor((remainderSec % 3600) / 60);
    const secs = remainderSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (days > 0) {
        return `${pad(days)}d : ${pad(hours)}h : ${pad(mins)}m`;
    }
    return `${pad(hours)}h : ${pad(mins)}m : ${pad(secs)}s`;
}

/** Cleaner countdown for triage: "7d 12h" or "14h 22m" (no colons, compact). */
export function getTimeRemainingClean(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Overdue';
    const totalMins = Math.floor(diff / 60_000);
    const days = Math.floor(totalMins / 1440);
    const remainderMins = totalMins % 1440;
    const hours = Math.floor(remainderMins / 60);
    const mins = remainderMins % 60;
    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return mins > 0 ? `${mins}m` : 'Soon';
}

/** Human-readable stamped countdown: { number, unit } for "8 Days left" (number in Mono, unit in Lexend). */
export function getTimeRemainingStamped(dateStr) {
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return { number: null, unit: 'Overdue' };
    const totalMins = Math.floor(diff / 60_000);
    const days = Math.floor(totalMins / 1440);
    const remainderMins = totalMins % 1440;
    const hours = Math.floor(remainderMins / 60);
    const mins = remainderMins % 60;
    if (days > 0) return { number: days, unit: days === 1 ? 'Day' : 'Days' };
    if (hours > 0) return { number: hours, unit: hours === 1 ? 'Hour' : 'Hours' };
    if (mins > 0) return { number: mins, unit: mins === 1 ? 'Minute' : 'Minutes' };
    return { number: null, unit: 'Due soon' };
}

/** True if deadline is within 24 hours (for soft coral countdown styling). */
export function isDeadlineUnder24h(dateStr) {
    const diff = new Date(dateStr) - new Date();
    return diff >= 0 && diff < 24 * 60 * 60 * 1000;
}
