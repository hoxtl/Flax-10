import { Calendar } from '../../components/Calendar/Calendar';
import PillFilters from '../../components/Tags/PillFilters';
import { useCalendar, useCalendarDispatch } from '../../context/CalendarContext';
import styles from './CalendarPage.module.css';
import { EventPopups } from '../../components/Calendar/EventPopups';

export default function CalendarPage() {
    const { filter, allEvents } = useCalendar();
    const dispatch = useCalendarDispatch();
    const handleFilterChange = (key) => {
        dispatch({ type: 'SET_FILTER', payload: key });
    };
    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <PillFilters active={filter} onChange={handleFilterChange} items={allEvents} />
            </div>
            <Calendar />
            <EventPopups />
        </div>);
}