import { useCalendar } from '../../context/CalendarContext';
import { ResizeHighlightProvider } from '../../context/ResizeHighlightContext';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView/DayView';
import { WeekView } from './WeekView/WeekView';
import { MonthView } from './MonthView/MonthView';
import { YearView } from './YearView/YearView';
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
    const views = { day: DayView, week: WeekView, month: MonthView, year: YearView };
    const View = views[viewMode];

    return View ? <View /> : null;
}
