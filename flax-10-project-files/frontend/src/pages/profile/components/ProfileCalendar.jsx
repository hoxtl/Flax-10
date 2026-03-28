/**
 * ProfileCalendar - Read-only calendar view for user profiles.
 * Displays monthly calendar with event summary modal.
 */

import { useEffect, useState } from "react";
import { useCalendar, useCalendarDispatch, CalendarProvider } from "../../../context/CalendarContext";
import { addMonths, formatMonthYear, isSameMonth } from "../../../components/calendar/utils/dateUtils";
import { CalendarNav } from "../../../components/calendar/header/CalendarHeaderUtils";
import { MonthView } from "../../../components/calendar/month_view/MonthView";
import { EventPopups } from "../../../components/calendar/EventPopups";
import { ResizeHighlightProvider } from "../../../context/ResizeHighlightContext";
import { EventsSummaryModal } from "../../../components/calendar/events_summary_modal/EventsSummaryModal";
import "../../../components/calendar/calendar-header.css";
import "../../../components/calendar/calendar.css";

function useProfileCalendarMode(dispatch) {
  useEffect(() => {
    if (!dispatch) return;
    dispatch({ type: "SET_VIEW_MODE", payload: "month" });
    dispatch({ type: "SET_READ_ONLY", payload: true });
  }, [dispatch]);
}

function useProfileNavigation() {
  const { selectedDate } = useCalendar();
  const dispatch = useCalendarDispatch();
  useProfileCalendarMode(dispatch);
  const setDate = (date) => {
    if (!dispatch) return;
    dispatch({ type: "SET_SELECTED_DATE", payload: date });
  };
  return { selectedDate, setDate };
}

function ProfileCalendarHeader() {
  const { selectedDate, setDate } = useProfileNavigation();
  const showToday = !isSameMonth(selectedDate, new Date());

  return (
    <div className="calendar-header">
      <CalendarNav
        onPrev={() => setDate(addMonths(selectedDate, -1))}
        onNext={() => setDate(addMonths(selectedDate, 1))}
        onToday={() => setDate(new Date())}
        showToday={showToday}
        selectedDate={selectedDate}
        onDatePick={setDate}
        title={formatMonthYear(selectedDate)}
      />
      <div className="header-actions" />
    </div>
  );
}

function useSyncEvents(dispatch, allEvents) {
  useEffect(() => {
    if (dispatch) dispatch({ type: "SET_EVENTS", payload: allEvents });
  }, [dispatch, allEvents]);
}

function SummaryModal({ summaryDate, setSummaryDate, allEvents }) {
  return (
    <EventsSummaryModal
      isOpen={!!summaryDate}
      onClose={() => setSummaryDate(null)}
      allEvents={allEvents}
      baseDate={summaryDate}
      isMutualOrSelf={true}
    />
  );
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
      <SummaryModal summaryDate={summaryDate} setSummaryDate={setSummaryDate} allEvents={allEvents} />
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
