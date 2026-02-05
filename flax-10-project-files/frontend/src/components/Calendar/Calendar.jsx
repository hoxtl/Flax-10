import { CalendarProvider, useCalendar } from '../../context/CalendarContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView/DayView';
import { WeekView } from './WeekView/WeekView';
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

  // This hook fetches events when date/view changes
  useCalendarEvents();

  return (
    <div className="calendar-container">
      <CalendarHeader />
      <CalendarView viewMode={viewMode} />
    </div>
  );
}

function CalendarView({ viewMode }) {
  if (viewMode === 'day') {
    return <DayView />;
  }
  if (viewMode === 'week') {
    return <WeekView />;
  }
  // Placeholder for month view until it's implemented
  return (
    <div className="view-placeholder">
      <p>Month view coming soon</p>
      <p>Use Day or Week view for now</p>
    </div>
  );
}
