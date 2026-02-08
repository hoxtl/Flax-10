import { useRef } from "react";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { getEvents } from "../../api/event_api";
import { importTimetable } from "../../api/timetable_api";
import { getDateRangeForView } from "../../hooks/calendarHelpers";
import { addDays, formatDate, getWeekDays, formatMonthYear, parseDateInput, isSameDay, isSameMonth } from "../../utils/dateUtils";
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
            <TodayButton selectedDate={selectedDate} onDatePick={onDatePick} />
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

function TodayButton({ selectedDate, onDatePick }) {
    const { viewMode } = useCalendar();
    if (isTodayVisible(viewMode, selectedDate)) return null;
    const goToToday = () => onDatePick(getTodayDate());
    return <button className="btn-today" onClick={goToToday}>Today</button>;
}

function HeaderActions({ openModal, viewMode, selectedDate, dispatch }) {
    const handleAddClick = () => openForView(openModal, viewMode, selectedDate);
    const handleImportClick = () => handleImport(dispatch, selectedDate, viewMode);
    return (
        <div className="actions">
            <ImportButton onImport={handleImportClick} />
            <button className="btn-add" onClick={handleAddClick}>+</button>
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}

function ImportButton({ onImport }) {
    return (
        <div className="btn-import-wrapper">
            <button className="btn-import" onClick={onImport}>
                Import timetable
            </button>
            <span className="btn-import-tooltip">
                Import your timetable using the shareable link
            </span>
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

function openForView(openModal, viewMode, selectedDate) {
    if (viewMode === 'day') {
        openModal(null, null, selectedDate);
        return;
    }
    openModal();
}

function isTodayVisible(viewMode, selectedDate) {
    const today = new Date();
    if (viewMode === 'day') return isSameDay(selectedDate, today);
    if (viewMode === 'week') return getWeekDays(selectedDate).some(d => isSameDay(d, today));
    if (viewMode === 'month') return isSameMonth(selectedDate, today);
    return false;
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

async function handleImport(dispatch, selectedDate, viewMode) {
    const sourceUrl = window.prompt("Paste timetable URL (.ics or timetable page)");
    if (!sourceUrl) return;
    try {
        await importTimetable(sourceUrl.trim());
        await reloadEvents(dispatch, selectedDate, viewMode);
    } catch (error) {
        window.alert(error?.message || "Failed to import timetable");
    }
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
    const { start, end } = getDateRangeForView(selectedDate, viewMode);
    const data = await getEvents({ start, end });
    dispatch({ type: 'SET_EVENTS', payload: data });
}
