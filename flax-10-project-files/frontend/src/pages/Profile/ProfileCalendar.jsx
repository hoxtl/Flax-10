import { useCalendar, useCalendarDispatch, CalendarProvider } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear } from '../../components/Calendar/utils/dateUtils';
import { NavigationButtons } from "../../components/Calendar/header/NavigationButtons";
import { ViewModeToggle } from "../../components/Calendar/header/ViewModeToggle";
import { DayView } from '../../components/Calendar/DayView/DayView';
import { WeekView } from '../../components/Calendar/WeekView/WeekView';
import { MonthView } from '../../components/Calendar/MonthView/MonthView';
import { YearView } from '../../components/Calendar/YearView/YearView';
import { ResizeHighlightProvider } from '../../context/ResizeHighlightContext';
import "../../components/Calendar/CalendarHeader.css";
import "../../components/Calendar/Calendar.css";

function navigateDate(dispatch, selectedDate, viewMode, dir) {
    if (viewMode === 'year') {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(newDate.getFullYear() + dir);
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
        return;
    }
    dispatch({ type: 'SET_SELECTED_DATE', payload: addDays(selectedDate, { day: 1, week: 7, month: 30 }[viewMode] * dir) });
}

function getTitle(selectedDate, viewMode) {
    if (viewMode === 'day') return formatDate(selectedDate);
    if (viewMode === 'month') return formatMonthYear(selectedDate);
    if (viewMode === 'year') return selectedDate.getFullYear().toString();

    const week = getWeekDays(selectedDate);
    const fmt = { month: 'short', day: 'numeric' };
    return `${week[0].toLocaleDateString([], fmt)} – ${week[6].toLocaleDateString([], fmt)}`;
}

function ProfileCalendarHeader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();

    const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
    const jumpToDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });

    return (
        <div className="calendar-header">
            <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
            <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
            <div className="actions">
                <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
            </div>
        </div>
    );
}

function ProfileCalendarView({ events }) {
    const { viewMode } = useCalendar();
    const views = { day: DayView, week: WeekView, month: MonthView, year: YearView };
    const View = views[viewMode];

    return View ? <View events={events} readOnly={true} /> : null;
}

export function ProfileCalendar({ events }) {
    return (
        <CalendarProvider>
            <ResizeHighlightProvider>
                <div className="calendar-container profile-calendar">
                    <ProfileCalendarHeader />
                    <ProfileCalendarView events={events} />
                </div>
            </ResizeHighlightProvider>
        </CalendarProvider>
    );
}
