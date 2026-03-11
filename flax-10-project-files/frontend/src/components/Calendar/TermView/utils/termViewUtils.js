import { addDays, getStartOfWeek } from '../../utils/dateUtils';
import { isLecture } from '../../../../pages/Homepage/utils/eventUtils';
import { DEADLINE_LABELS } from '../../../Modules/utils/deadlineUtils';

export function getTermWeekStartDate(termStart, weekIndex) {
    const d = new Date(termStart);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    // Move to Monday: if Sunday (0) go +1, if Mon-Sat go -(day - 1)
    const diff = day === 0 ? 1 : -(day - 1);
    const monday = addDays(d, diff);
    return addDays(monday, weekIndex * 7);
}

export function getEventType(event) {
    if (isLecture(event)) return 'lecture';
    const title = (event.title || '').toLowerCase();
    const type = (event.type || '').toLowerCase();
    if (type === 'exam' || title.includes('exam')) return 'exam';
    if (DEADLINE_LABELS[type] || title.includes('deadline') || title.includes('coursework')) return 'deadline';
    return 'other';
}

export function groupEventsByWeek(events, termConfig) {
    const { startDate, totalWeeks, hasReadingWeek, readingWeekAfterWeek } = termConfig;
    const weekCount = totalWeeks + (hasReadingWeek ? 1 : 0);
    const weeks = Array.from({ length: weekCount }, (_, i) => ({
        index: i,
        label: getWeekLabel(i, readingWeekAfterWeek, hasReadingWeek),
        startDate: getTermWeekStartDate(startDate, i),
        counts: { lecture: 0, deadline: 0, exam: 0, other: 0 }
    }));

    events.forEach(event => {
        const weekIdx = getWeekIndex(new Date(event.start_time), weeks);
        if (weekIdx !== -1) weeks[weekIdx].counts[getEventType(event)]++;
    });

    return weeks;
}

function getWeekLabel(idx, rwAfter, hasRW) {
    if (!hasRW) return `W${idx + 1}`;
    if (idx < rwAfter) return `W${idx + 1}`;
    if (idx === rwAfter) return 'RW';
    return `W${idx}`;
}

function getWeekIndex(date, weeks) {
    return weeks.findIndex((w, i) => {
        const nextWeekStart = weeks[i + 1]?.startDate || addDays(w.startDate, 7);
        return date >= w.startDate && date < nextWeekStart;
    });
}

export function detectClusters(weeks) {
    const threshold = 3;
    for (let i = 0; i < weeks.length - 1; i++) {
        const w1 = weeks[i];
        const w2 = weeks[i + 1];
        const heavyCount = w1.counts.deadline + w1.counts.exam + w2.counts.deadline + w2.counts.exam;
        if (heavyCount >= threshold) {
            return `Deadline cluster in ${w1.label}–${w2.label} — consider planning revision sessions earlier.`;
        }
    }
    return null;
}
