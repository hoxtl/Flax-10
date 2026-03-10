import { useRef, useCallback, useState, memo } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { YearGrid } from './YearGrid';
import './YearView.css';
import styles from './SwipeYearView.module.css';

const YearContent = memo(function YearContent({ year, events }) {
    return <YearGrid year={year} events={events} />;
});

export function SwipeYearView() {
    const { selectedDate, events } = useCalendar();
    const dispatch = useCalendarDispatch();
    const containerRef = useRef(null);
    const [direction, setDirection] = useState(null);

    const navigate = useCallback((dir) => {
        setDirection(dir);
        setTimeout(() => {
            const newDate = new Date(selectedDate);
            newDate.setFullYear(newDate.getFullYear() + dir);
            dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
            setDirection(null);
            if (containerRef.current) containerRef.current.scrollTop = 0;
        }, 150);
    }, [selectedDate, dispatch]);

    const onPrev = useCallback(() => navigate(-1), [navigate]);
    const onNext = useCallback(() => navigate(1), [navigate]);

    useSwipeNavigation({ containerRef, onPrev, onNext });

    const animationClass = direction === 1 ? styles.slideUp : direction === -1 ? styles.slideDown : '';

    return (
        <div ref={containerRef} className={styles.container}>
            <div className={`${styles.content} ${animationClass}`}>
                <YearContent year={selectedDate.getFullYear()} events={events} />
            </div>
        </div>
    );
}
