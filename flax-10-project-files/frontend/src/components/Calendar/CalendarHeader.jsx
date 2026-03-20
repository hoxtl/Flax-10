import { useState } from "react";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear, isSameDay, getStartOfWeek } from "./utils/dateUtils";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { getEvents } from "../../api/eventApi";
import { CalendarNav, ViewSwitcher, ActionMenu, ViewSettingsMenu, ViewModeButton, SearchButton, ScheduleManagerButton, FilterDropdownButton} from "./header/CalendarHeaderUtils";
import TimetableImportModal from "../TimetableImportModal";
import useBreakpoint from "../../hooks/useBreakpoint";
import "./CalendarHeader.css";

const VIEW_MODES = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

function useCalendarHeader() {
    const { selectedDate, viewMode, displayMode, searchQuery, filter } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { openModal } = useEventModal();
    const [showImportModal, setShowImportModal] = useState(false);
    const setSearchQuery = (q) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q });
    const setFilter = (key) => dispatch({ type: 'SET_FILTER', payload: key });
    return { selectedDate, viewMode, displayMode, searchQuery, setSearchQuery, filter, setFilter, dispatch, openModal, showImportModal, setShowImportModal };
}

export function CalendarHeader() {
    const { selectedDate, viewMode, displayMode, searchQuery, setSearchQuery, filter, setFilter, dispatch, openModal, showImportModal, setShowImportModal } = useCalendarHeader();
    const isMobile = useBreakpoint();
    const modes = isMobile ? VIEW_MODES.filter(m => m.value !== 'week') : VIEW_MODES;

    const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
    const jumpToDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });
    const setViewMode = (mode) => dispatch({ type: "SET_VIEW_MODE", payload: mode });
    const setDisplayMode = (mode) => dispatch({ type: "SET_DISPLAY_MODE", payload: mode });
    const onImport = async (url) => { await importTimetable(url); await reloadEvents(dispatch, selectedDate, viewMode); };
    const showToday = !isTodayVisible(viewMode, selectedDate);
    const title = getTitle(selectedDate, viewMode);

    return (
        <>
            <div className="calendar-header-container">
                <header className="calendar-header">
                    <CalendarNav
                        onPrev={() => navigate(-1)}
                        onNext={() => navigate(1)}
                        onToday={() => jumpToDate(getTodayDate())}
                        showToday={showToday}
                        selectedDate={selectedDate}
                        onDatePick={jumpToDate}
                        title={!isMobile ? title : null}
                    />
                    {!isMobile && (
                        <div className="header-center">
                            <ViewSwitcher modes={modes} activeMode={viewMode} onChange={setViewMode} />
                        </div>
                    )}
                    <div className="header-actions">
                        <SearchButton value={searchQuery || ''} onChange={setSearchQuery} />
                        <FilterDropdownButton active={filter} onChange={setFilter} />
                        {isMobile && <ViewModeButton modes={modes} activeMode={viewMode} onChange={setViewMode} />}
                        <ViewSettingsMenu activeMode={displayMode} onViewChange={setDisplayMode} isMobile={isMobile} />
                        <ScheduleManagerButton />
                        <ActionMenu onAddEvent={() => openForView(openModal, viewMode, selectedDate)} onImport={() => setShowImportModal(true)} />
                    </div>
                </header>
                {isMobile && (
                    <div className="mobile-title-row">
                        <h2 className="title">{title}</h2>
                    </div>
                )}
            </div>
            {viewMode === "day" && <MobileDateStrip selectedDate={selectedDate} dispatch={dispatch} />}
            <TimetableImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={onImport} />
        </>
    );
}

function MobileDateStrip({ selectedDate, dispatch }) {
    const weekStart = getStartOfWeek(selectedDate);
    const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
    const selectDay = (day) => { dispatch({ type: "SET_SELECTED_DATE", payload: day }); dispatch({ type: "SET_VIEW_MODE", payload: "day" }); };
    return (
        <div className="date-strip-wrapper">
            <div className="date-strip">
                {weekDays.map((day) => <DateCard key={day.toString()} day={day} isActive={isSameDay(day, selectedDate)} onClick={() => selectDay(day)} />)}
            </div>
        </div>
    );
}

function DateCard({ day, isActive, onClick }) {
    return (
        <button className={`date-card ${isActive ? "active" : ""}`} onClick={onClick}>
            <span className="day-name">{day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}</span>
            <span className="day-number">{day.getDate()}</span>
        </button>
    );
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
    const newDate = new Date(selectedDate);
    if (viewMode === "month") {
        newDate.setMonth(newDate.getMonth() + dir);
    } else {
        const delta = viewMode === "week" ? 7 : 1;
        newDate.setDate(newDate.getDate() + delta * dir);
    }
    dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
}

function getTitle(selectedDate, viewMode) {
    if (viewMode === "day") return formatDate(selectedDate);
    return formatMonthYear(selectedDate);
}

function isTodayVisible(viewMode, date) {
    const today = new Date();
    if (viewMode === 'day') return isSameDay(date, today);
    if (viewMode === 'week') return getWeekDays(date).some(d => isSameDay(d, today));
    return date.getMonth() === today.getMonth()
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function openForView(openModal, viewMode, selectedDate) {
    if (viewMode === "day") openModal(null, null, selectedDate);
    else openModal();
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
    const { start, end } = getDateRangeForView(selectedDate, viewMode);
    const data = await getEvents({ start, end });
    dispatch({ type: "SET_EVENTS", payload: data });
}
