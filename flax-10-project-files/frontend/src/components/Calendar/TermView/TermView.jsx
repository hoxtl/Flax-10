import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { loadTermConfig } from '../../../lib/termConfig';
import { groupEventsByWeek, detectClusters } from './utils/termViewUtils';
import { AlertCircle } from 'lucide-react';
import styles from './TermView.module.css';

export function TermView() {
    const { events } = useCalendar();
    const dispatch = useCalendarDispatch();
    const cfg = loadTermConfig();
    const weeks = groupEventsByWeek(events, cfg);
    const clusterWarning = detectClusters(weeks);
    const maxEvents = Math.max(...weeks.map(w => Object.values(w.counts).reduce((a, b) => a + b, 0)), 5);
    const showPreStarted = new Date() < new Date(cfg.startDate);

    return (
        <div className={styles.container}>
            {showPreStarted && <PreStartedBadge />}
            <div className={styles.grid}>
                {weeks.map(w => (
                    <WeekColumn key={w.index} week={w} max={maxEvents} dispatch={dispatch} />
                ))}
            </div>
            <TermLegend />
            {clusterWarning && <InsightBar message={clusterWarning} />}
        </div>
    );
}

function PreStartedBadge() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={styles.preStartedBadge}>SEMESTER HASN'T STARTED</div>
        </div>
    );
}

function WeekColumn({ week, max, dispatch }) {
    const isCurrent = checkIsCurrent(week.startDate);
    const now = new Date();
    const nextWeek = new Date(week.startDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const isPast = now >= nextWeek;

    const countsArr = Object.entries(week.counts).filter(([_, count]) => count > 0);
    const tooltip = countsArr.length > 0
        ? countsArr.map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`).join(', ')
        : 'No events';

    const onClick = () => {
        dispatch({ type: 'SET_SELECTED_DATE', payload: week.startDate });
        dispatch({ type: 'SET_VIEW_MODE', payload: 'week' });
    };

    const columnClass = [
        styles.column,
        isCurrent && styles.currentWeek,
        isPast && styles.pastWeek
    ].filter(Boolean).join(' ');

    return (
        <div className={columnClass} onClick={onClick} title={tooltip}>
            <span className={styles.label}>{week.label}</span>
            <BarStack counts={week.counts} max={max} />
            <span className={styles.date}>{formatMonday(week.startDate)}</span>
        </div>
    );
}

function BarStack({ counts, max }) {
    return (
        <div className={styles.barStack} style={{ height: '100%' }}>
            {Object.entries(counts).map(([type, count]) => (
                count > 0 && (
                    <div
                        key={type}
                        className={`${styles.bar} ${styles[type]}`}
                        style={{ height: `${(count / max) * 100}%` }}
                    />
                )
            ))}
        </div>
    );
}

function TermLegend() {
    const items = [
        { label: 'Lecture', color: '#7cb87c' },
        { label: 'Deadline', color: '#e06b6b' },
        { label: 'Exam', color: '#9b7fc7' }
    ];
    return (
        <div className={styles.legend}>
            {items.map(item => (
                <div key={item.label} className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: item.color }} />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

function InsightBar({ message }) {
    return (
        <div className={styles.insightBar}>
            <AlertCircle size={16} className={styles.insightIcon} />
            <span>{message}</span>
        </div>
    );
}

function checkIsCurrent(startDate) {
    const now = new Date();
    const nextWeek = new Date(startDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return now >= startDate && now < nextWeek;
}

function formatMonday(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
