import { CalendarProvider, useCalendar, useEventModal } from '../../context/CalendarContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView/DayView';
import { WeekView } from './WeekView/WeekView';
import { EventModal } from './EventModal/EventModal';
import './Calendar.css';

export function Calendar() {
    return (
        <CalendarProvider>
            <CalendarContent />
        </CalendarProvider>
    );
}

function CalendarContent() {
    const { viewMode } = useCalendar();
    const { isModalOpen, modalEvent, closeModal } = useEventModal();
    useCalendarEvents();

    return (
        <div className="calendar-container">
            <CalendarHeader />
            <CalendarView viewMode={viewMode} />
            {isModalOpen && <EventModal event={modalEvent} onClose={closeModal} />}
        </div>
    );
}

function CalendarView({ viewMode }) {
    const views = { day: DayView, week: WeekView };
    const View = views[viewMode];

    if (View) return <View />;

    return (
        <div className="view-placeholder">
            <p>Month view coming soon</p>
        </div>
    );
}
