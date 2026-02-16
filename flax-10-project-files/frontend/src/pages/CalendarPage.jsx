import { Calendar } from '../components/Calendar/Calendar';
import PillFilters from '../components/Tags/PillFilters';
import { useCalendar, useCalendarDispatch, useEventModal } from '../context/CalendarContext';
import styles from './CalendarPage.module.css';
import { EventModal } from '../components/Calendar/EventModal/EventModal';

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
            <EventModalContainer />
        </div>
    );
}

function EventModalContainer() {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;
    return (
        <EventModal
            event={modalEvent}
            onClose={closeModal}
            initialType={modalType}
            initialDate={modalInitialDate}
        />
    );
}