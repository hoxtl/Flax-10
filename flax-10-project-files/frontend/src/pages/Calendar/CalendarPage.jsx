import { useMemo } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import PillFilters from '../../components/Tags/PillFilters';
import { useCalendar, useCalendarDispatch } from '../../context/CalendarContext';
import { getVisibleEventsInView } from '../../components/Calendar/utils/eventUtils';
import styles from './CalendarPage.module.css';
import { EventPopups } from '../../components/Calendar/EventPopups';
import { useEventPopupListener } from '../../components/Calendar/hooks/useEventPopupListener';

export default function CalendarPage() {
    const { filter, allEvents, selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    useEventPopupListener();

    const visibleItems = useMemo(() =>
        getVisibleEventsInView(allEvents, selectedDate, viewMode),
        [allEvents, selectedDate, viewMode]
    );

    const handleFilterChange = (key) => {
        dispatch({ type: 'SET_FILTER', payload: key });
    };

    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <PillFilters active={filter} onChange={handleFilterChange} items={visibleItems} />
            </div>
            <Calendar />
            <EventPopups />
        </div>);
}