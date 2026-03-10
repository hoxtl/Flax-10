import { useRef, useCallback, useState, memo } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';
import styles from './SwipeMonthView.module.css';

const MonthGrid = memo(function MonthGrid({ date, events, readOnly, onMoreClick, customTags }) {
    const weeks = getMonthWeeks(date);
    return (
        <div className="month-grid">
            <WeekdayHeader />
            {weeks.map((week, i) => (
                <WeekRow key={i} days={week} events={events} cur={date}
                    readOnly={readOnly} onMoreClick={onMoreClick} customTags={customTags} />
            ))}
        </div>
    );
});

export function SwipeMonthView({ readOnly: propReadOnly, customTags }) {
    const { selectedDate, events, readOnly: contextReadOnly } = useCalendar();
    const dispatch = useCalendarDispatch();
    const isReadOnly = propReadOnly ?? contextReadOnly;
    const containerRef = useRef(null);
    const [direction, setDirection] = useState(null);

    const navigate = useCallback((dir) => {
        setDirection(dir);
        setTimeout(() => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() + dir);
            dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
            setDirection(null);
            if (containerRef.current) containerRef.current.scrollTop = 0;
        }, 150);
    }, [selectedDate, dispatch]);

    const onPrev = useCallback(() => navigate(-1), [navigate]);
    const onNext = useCallback(() => navigate(1), [navigate]);

    const handleMoreClick = useCallback((date) => {
        dispatch({ type: 'SET_SELECTED_DATE', payload: date });
        dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
    }, [dispatch]);

    useSwipeNavigation({ containerRef, onPrev, onNext });

    const animationClass = direction === 1 ? styles.slideUp : direction === -1 ? styles.slideDown : '';

    return (
        <div ref={containerRef} className={styles.container}>
            <div className={`${styles.content} ${animationClass}`}>
                <MonthGrid date={selectedDate} events={events} readOnly={isReadOnly}
                    onMoreClick={handleMoreClick} customTags={customTags} />
            </div>
        </div>
    );
}

function getMonthWeeks(date) {
    const weeks = [];
    const current = getStartDate(date);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    while (shouldContinue(current, last)) weeks.push(generateWeek(current));
    return weeks;
}

function shouldContinue(current, last) {
    return current <= last || current.getDay() !== 0;
}

function getStartDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function generateWeek(current) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(current)); current.setDate(current.getDate() + 1); }
    return week;
}
