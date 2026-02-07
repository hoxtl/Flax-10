import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear } from "../../utils/dateUtils";
import { NavigationButtons } from "./header/NavigationButtons";
import { ViewModeToggle } from "./header/ViewModeToggle";
import './CalendarHeader.css';

export function CalendarHeader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { openModal } = useEventModal();
    const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
    const jumpToDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });

    return (
        <div className="calendar-header">
            <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
            <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
            <HeaderActions openModal={openModal} viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

function HeaderActions({ openModal, viewMode, dispatch }) {
    return (
        <div className="actions">
            <button className="btn-add" onClick={() => openModal()}>+</button>
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
    const days = { day: 1, week: 7, month: 30 }[viewMode] * dir;
    dispatch({ type: 'SET_SELECTED_DATE', payload: addDays(selectedDate, days) });
}

function getTitle(selectedDate, viewMode) {
    if (viewMode === 'day') return formatDate(selectedDate);
    if (viewMode === 'month') return formatMonthYear(selectedDate);
    return getWeekTitle(selectedDate);
}

function getWeekTitle(selectedDate) {
    const week = getWeekDays(selectedDate);
    const fmt = { month: 'short', day: 'numeric' };
    return `${week[0].toLocaleDateString([], fmt)} – ${week[6].toLocaleDateString([], fmt)}`;
}
