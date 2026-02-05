import { CalendarProvider, useCalendar } from '../../context/CalendarContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView/DayView';
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
  // Placeholder for week and month views until they're implemented
  return (
    <div className="view-placeholder">
      <p>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view coming soon</p>
      <p>Use Day view for now</p>
    </div>
  );
}
