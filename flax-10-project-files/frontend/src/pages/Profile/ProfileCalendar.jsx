/**
 * ProfileCalendar - Read-only calendar view for user profiles.
 * Displays monthly calendar with event summary modal.
 */
import { useEffect, useState } from "react";
import { useCalendar, useCalendarDispatch, CalendarProvider } from "../../context/CalendarContext";
import { addMonths, formatMonthYear, isSameMonth } from '../../components/Calendar/utils/dateUtils';
import { CalendarNav } from "../../components/Calendar/header/CalendarHeaderUtils";
import { MonthView } from '../../components/Calendar/MonthView/MonthView';
import { EventPopups } from '../../components/Calendar/EventPopups';
import { ResizeHighlightProvider } from '../../context/ResizeHighlightContext';
import { EventsSummaryModal } from "../../components/Calendar/EventsSummaryModal/EventsSummaryModal";
import "../../components/Calendar/CalendarHeader.css";
import "../../components/Calendar/Calendar.css";

function useProfileCalendarSetup(dispatch) {
  useEffect(() => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
    dispatch({ type: 'SET_READ_ONLY', payload: true });
  }, [dispatch]);
}

function useProfileNavigation() {
  const { selectedDate } = useCalendar();
  const dispatch = useCalendarDispatch();
  useProfileCalendarSetup(dispatch);
  const setDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  return { selectedDate, setDate };
}

function ProfileCalendarHeader() {
  const { selectedDate, setDate } = useProfileNavigation();
  return (
    <div className="calendar-header">
      <CalendarNav onPrev={() => setDate(addMonths(selectedDate, -1))} onNext={() => setDate(addMonths(selectedDate, 1))}
        onToday={() => setDate(new Date())} showToday={!isSameMonth(selectedDate, new Date())}
        selectedDate={selectedDate} onDatePick={setDate} title={formatMonthYear(selectedDate)} />
      <div className="header-actions" />
    </div>
  );
}

function useSyncEvents(dispatch, allEvents) {
  useEffect(() => {
    if (dispatch) dispatch({ type: 'SET_EVENTS', payload: allEvents });
  }, [dispatch, allEvents]);
}

function ProfileCalendarInner({ allEvents }) {
  const [summaryDate, setSummaryDate] = useState(null);
  const dispatch = useCalendarDispatch();
  useSyncEvents(dispatch, allEvents);

  return (
    <div className="calendar-container profile-calendar">
      <ProfileCalendarHeader />
      <MonthView events={allEvents} readOnly={true} onMoreClick={setSummaryDate} />
      <EventPopups />
      <EventsSummaryModal isOpen={!!summaryDate} onClose={() => setSummaryDate(null)}
        allEvents={allEvents} baseDate={summaryDate} isMutualOrSelf={true} />
    </div>
  );
}

/** Profile calendar wrapper with context providers. */
export function ProfileCalendar({ allEvents }) {
  return (
    <CalendarProvider>
      <ResizeHighlightProvider>
        <ProfileCalendarInner allEvents={allEvents} />
      </ResizeHighlightProvider>
    </CalendarProvider>
  );
}
