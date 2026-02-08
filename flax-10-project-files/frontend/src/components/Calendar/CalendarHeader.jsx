import { useRef } from "react";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear, parseDateInput } from "../../utils/dateUtils";
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
            <HeaderActions openModal={openModal} viewMode={viewMode} selectedDate={selectedDate} dispatch={dispatch} />
        </div>
    );
}

function NavigationButtons({ onNavigate, selectedDate, onDatePick }) {
    return (
        <div className="nav-buttons">
            <button onClick={() => onNavigate(-1)}>&lt;</button>
            <button onClick={() => onNavigate(1)}>&gt;</button>
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
            <TodayButton onDatePick={onDatePick} />
        </div>
    );
}

function DatePickerButton({ selectedDate, onDatePick }) {
    const ref = useRef(null);
    const value = selectedDate.toISOString().slice(0, 10);
    const handleChange = (e) => onDatePick(parseDateInput(e.target.value));

    return (
        <>
            <button className="btn-calendar" onClick={() => ref.current?.showPicker?.()}>🗓️</button>
            <input ref={ref} type="date" className="hidden-date-input" value={value} onChange={handleChange} />
        </>
    );
}

function TodayButton({ onDatePick }) {
    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        onDatePick(today);
    };
    return <button className="btn-today" onClick={goToToday}>Today</button>;
}

function HeaderActions({ openModal, viewMode, selectedDate, dispatch }) {
    const handleAddClick = () => {
        // For Day and Week views, use the selected date
        // For Month view, use today's date (openModal will default to today)
        if (viewMode === 'day' || viewMode === 'week') {
            openModal(null, null, selectedDate);
        } else {
            openModal();
        }
    };

    return (
        <div className="actions">
            <button className="btn-add" onClick={handleAddClick}>+</button>
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

function ViewModeToggle({ viewMode, dispatch }) {
    const modes = ['day', 'week', 'month'];
    return (
        <div className="view-toggle">
            {modes.map(m => <ModeButton key={m} mode={m} active={viewMode === m} dispatch={dispatch} />)}
        </div>
    );
}

function ModeButton({ mode, active, dispatch }) {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    const onClick = () => dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    return <button onClick={onClick} className={active ? 'active' : ''}>{label}</button>;
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
