import { useCalendar } from "../context/CalendarContext";
import { ResizeHighlightProvider } from "../context/ResizeHighlightContext";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { CalendarHeader } from './CalendarHeader';

import { DayView } from './DayView/DayView';
import { WeekView } from './WeekView/WeekView';
import { MonthView } from './MonthView/MonthView';
import './Calendar.css';

export function Calendar() {
    return (
        <ResizeHighlightProvider>
            <CalendarContent />
        </ResizeHighlightProvider>
    );
}

function CalendarContent() {
    const { viewMode } = useCalendar();
    useCalendarEvents();

    return (
        <div className="calendar-container">
            <CalendarHeader />
            <CalendarView viewMode={viewMode} />
        </div>
    );
}

function CalendarView({ viewMode }) {
    const views = { day: DayView, week: WeekView, month: MonthView };
    const View = views[viewMode];

    return View ? <View /> : null;
}

export default Calendar;