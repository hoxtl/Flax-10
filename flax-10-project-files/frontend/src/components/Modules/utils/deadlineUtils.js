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

export function getDeadlineUrgency(dateStr) {
    const days = Math.floor((new Date(dateStr) - new Date()) / 86_400_000);
    if (days < 3) return 'critical';
    if (days < 7) return 'urgent';
    return 'normal';
}

/** Days remaining (integer). Negative if overdue. */
export function getDaysRemaining(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 86_400_000);
}