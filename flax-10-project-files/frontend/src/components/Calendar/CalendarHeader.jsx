/*
    This file is used to handle the calendar header component.
*/

import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear } from "../../utils/dateUtils";
import './CalendarHeader.css';

/*
    This function is used to handle the calendar header component.
    It includes the navigation buttons, title, and view mode toggle.
*/
export function CalendarHeader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { openModal } = useEventModal();
    const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);

    return (
        <div className="calendar-header">
            <NavigationButtons onNavigate={navigate} />
            <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
            <HeaderActions openModal={openModal} viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

/*
    This function is used to handle the navigation buttons.
    It includes the previous and next buttons.
*/
function NavigationButtons({ onNavigate }) {
    return (
        <div className="nav-buttons">
            <button onClick={() => onNavigate(-1)}>&lt;</button>
            <button onClick={() => onNavigate(1)}>&gt;</button>
        </div>
    );
}

/*
    This function is used to handle the header actions.
    It includes the add event button and the view mode toggle.
*/
function HeaderActions({ openModal, viewMode, dispatch }) {
    return (
        <div className="actions">
            <button className="btn-add" onClick={() => openModal()}>+</button>
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

/*
    This function is used to handle the view mode toggle.
    It includes the day, week, and month view modes.
*/
function ViewModeToggle({ viewMode, dispatch }) {
    const modes = ['day', 'week', 'month'];
    return (
        <div className="view-toggle">
            {modes.map(m => <ModeButton key={m} mode={m} active={viewMode === m} dispatch={dispatch} />)}
        </div>
    );
}

/*
    This function is used to handle the mode button.
    It includes the day, week, and month view modes.
*/
function ModeButton({ mode, active, dispatch }) {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    const onClick = () => dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    return <button onClick={onClick} className={active ? 'active' : ''}>{label}</button>;
}

/*
    This function is used to handle the navigation.
    It includes the previous and next buttons.
*/
function navigateDate(dispatch, selectedDate, viewMode, dir) {
    const days = { day: 1, week: 7, month: 30 }[viewMode] * dir;
    dispatch({ type: 'SET_SELECTED_DATE', payload: addDays(selectedDate, days) });
}

/*
    This function is used to handle the title.
    It includes the day, week, and month view modes.
*/
function getTitle(selectedDate, viewMode) {
    if (viewMode === 'day') return formatDate(selectedDate);
    if (viewMode === 'month') return formatMonthYear(selectedDate);
    return getWeekTitle(selectedDate);
}

/*
    This function is used to handle the week title.
    It includes the day, week, and month view modes.
*/
function getWeekTitle(selectedDate) {
    const week = getWeekDays(selectedDate);
    const fmt = { month: 'short', day: 'numeric' };
    return `${week[0].toLocaleDateString([], fmt)} – ${week[6].toLocaleDateString([], fmt)}`;
}
