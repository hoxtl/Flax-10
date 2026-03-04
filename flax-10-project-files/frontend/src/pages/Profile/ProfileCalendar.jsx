import { useEffect } from "react";
import { useCalendar, useCalendarDispatch, CalendarProvider } from "../../context/CalendarContext";
import { addMonths, formatMonthYear } from '../../components/Calendar/utils/dateUtils';
import { NavigationButtons } from "../../components/Calendar/header/NavigationButtons";
import { MonthView } from '../../components/Calendar/MonthView/MonthView';
import { EventPopups } from '../../components/Calendar/EventPopups';
import { ResizeHighlightProvider } from '../../context/ResizeHighlightContext';
import "../../components/Calendar/CalendarHeader.css";
import "../../components/Calendar/Calendar.css";

function ProfileCalendarHeader() {
    const { selectedDate } = useCalendar();
    const dispatch = useCalendarDispatch();

    useEffect(() => {
        dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
        dispatch({ type: 'SET_READ_ONLY', payload: true });
    }, [dispatch]);

    return (
        <div className="calendar-header">
            <NavigationButtons
                onNavigate={(dir) => dispatch({ type: 'SET_SELECTED_DATE', payload: addMonths(selectedDate, dir) })}
                selectedDate={selectedDate}
                onDatePick={(date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date })}
            />
            <h2 className="calendar-title">{formatMonthYear(selectedDate)}</h2>
            <div className="actions" />
        </div>
    );
}

function ProfileCalendarInner({ events }) {
    const dispatch = useCalendarDispatch();

    useEffect(() => {
        if (dispatch) {
            dispatch({ type: 'SET_EVENTS', payload: events });
        }
    }, [dispatch, events]);

    return (
        <div className="calendar-container profile-calendar">
            <ProfileCalendarHeader />
            <MonthView events={events} readOnly={true} />
            <EventPopups />
        </div>
    );
}

export function ProfileCalendar({ events }) {
    return (
        <CalendarProvider>
            <ResizeHighlightProvider>
                <ProfileCalendarInner events={events} />
            </ResizeHighlightProvider>
        </CalendarProvider>
    );
}
