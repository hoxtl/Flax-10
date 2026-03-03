import { useEffect } from "react";
import { useCalendar, useCalendarDispatch, CalendarProvider } from "../../context/CalendarContext";
import { addMonths, formatMonthYear } from '../../components/Calendar/utils/dateUtils';
import { NavigationButtons } from "../../components/Calendar/header/NavigationButtons";
import { MonthView } from '../../components/Calendar/MonthView/MonthView';
import { EventPopups } from '../../components/Calendar/EventPopups';
import { ResizeHighlightProvider } from '../../context/ResizeHighlightContext';
import { EventsSummaryModal } from "../../components/Calendar/EventsSummaryModal/EventsSummaryModal";
import { useState } from "react";
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

function ProfileCalendarInner({ allEvents }) {
    const [summaryDate, setSummaryDate] = useState(null);
    const dispatch = useCalendarDispatch();

    useEffect(() => {
        if (dispatch) {
            dispatch({ type: 'SET_EVENTS', payload: allEvents });
        }
    }, [dispatch, allEvents]);

    return (
        <div className="calendar-container profile-calendar">
            <ProfileCalendarHeader />
            <MonthView events={allEvents} readOnly={true} onMoreClick={setSummaryDate} />
            <EventPopups />
            <EventsSummaryModal
                isOpen={!!summaryDate}
                onClose={() => setSummaryDate(null)}
                allEvents={allEvents}
                baseDate={summaryDate}
                isMutualOrSelf={true}
            />
        </div>
    );
}

export function ProfileCalendar({ allEvents }) {
    return (
        <CalendarProvider>
            <ResizeHighlightProvider>
                <ProfileCalendarInner allEvents={allEvents} />
            </ResizeHighlightProvider>
        </CalendarProvider>
    );
}
