/**
 * CalendarHeader - Navigation and controls for the calendar.
 * Handles date navigation, view switching, and import functionality.
 */
import { useState } from "react";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { formatDate, getWeekDays, formatMonthYear, isSameDay, getStartOfWeek, addDays } from "./utils/dateUtils";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { getEvents } from "../../api/eventApi";
import { CalendarNav, ViewSwitcher, ActionMenu, ViewSettingsMenu, ViewModeButton, SearchButton } from "./header/CalendarHeaderUtils";
import TimetableImportModal from "../TimetableImportModal";
import useBreakpoint from "../../hooks/useBreakpoint";
import "./CalendarHeader.css";

const VIEW_MODES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function useCalendarHeaderState() {
  const { selectedDate, viewMode, displayMode, searchQuery } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  const [showImportModal, setShowImportModal] = useState(false);
  const setSearchQuery = (q) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q });
  return { selectedDate, viewMode, displayMode, searchQuery, setSearchQuery, dispatch, openModal, showImportModal, setShowImportModal };
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
  const newDate = new Date(selectedDate);
  if (viewMode === "month") newDate.setMonth(newDate.getMonth() + dir);
  else newDate.setDate(newDate.getDate() + (viewMode === "week" ? 7 : 1) * dir);
  dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
}

function getTitle(selectedDate, viewMode) {
  return viewMode === "day" ? formatDate(selectedDate) : formatMonthYear(selectedDate);
}

function isTodayVisible(viewMode, date) {
  const today = new Date();
  if (viewMode === 'day') return isSameDay(date, today);
  if (viewMode === 'week') return getWeekDays(date).some(d => isSameDay(d, today));
  return date.getMonth() === today.getMonth();
}

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function openForView(openModal, viewMode, selectedDate) {
  viewMode === "day" ? openModal(null, null, selectedDate) : openModal();
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
  const { start, end } = getDateRangeForView(selectedDate, viewMode);
  dispatch({ type: "SET_EVENTS", payload: await getEvents({ start, end }) });
}

function HeaderActions({ isMobile, searchQuery, setSearchQuery, modes, viewMode, setViewMode, displayMode, setDisplayMode, openModal, selectedDate, setShowImportModal }) {
  return (
    <div className="header-actions">
      <SearchButton value={searchQuery || ''} onChange={setSearchQuery} />
      {isMobile && <ViewModeButton modes={modes} activeMode={viewMode} onChange={setViewMode} />}
      <ViewSettingsMenu activeMode={displayMode} onViewChange={setDisplayMode} isMobile={isMobile} />
      <ActionMenu onAddEvent={() => openForView(openModal, viewMode, selectedDate)} onImport={() => setShowImportModal(true)} />
    </div>
  );
}

function useHeaderHandlers(state) {
  const navigate = (dir) => navigateDate(state.dispatch, state.selectedDate, state.viewMode, dir);
  const jumpToDate = (date) => state.dispatch({ type: "SET_SELECTED_DATE", payload: date });
  const setViewMode = (mode) => state.dispatch({ type: "SET_VIEW_MODE", payload: mode });
  const setDisplayMode = (mode) => state.dispatch({ type: "SET_DISPLAY_MODE", payload: mode });
  const onImport = async (url) => { await importTimetable(url); await reloadEvents(state.dispatch, state.selectedDate, state.viewMode); };
  return { navigate, jumpToDate, setViewMode, setDisplayMode, onImport };
}

function HeaderMain({ state, isMobile, modes, handlers }) {
  const title = getTitle(state.selectedDate, state.viewMode);
  return (
    <div className="calendar-header-container">
      <header className="calendar-header">
        <CalendarNav onPrev={() => handlers.navigate(-1)} onNext={() => handlers.navigate(1)} onToday={() => handlers.jumpToDate(getTodayDate())}
          showToday={!isTodayVisible(state.viewMode, state.selectedDate)} selectedDate={state.selectedDate}
          onDatePick={handlers.jumpToDate} title={!isMobile ? title : null} />
        {!isMobile && <div className="header-center"><ViewSwitcher modes={modes} activeMode={state.viewMode} onChange={handlers.setViewMode} /></div>}
        <HeaderActions isMobile={isMobile} searchQuery={state.searchQuery} setSearchQuery={state.setSearchQuery}
          modes={modes} viewMode={state.viewMode} setViewMode={handlers.setViewMode} displayMode={state.displayMode}
          setDisplayMode={handlers.setDisplayMode} openModal={state.openModal} selectedDate={state.selectedDate}
          setShowImportModal={state.setShowImportModal} />
      </header>
      {isMobile && <div className="mobile-title-row"><h2 className="title">{title}</h2></div>}
    </div>
  );
}

/** Main calendar header with navigation, view switcher, and action buttons. */
export function CalendarHeader() {
  const state = useCalendarHeaderState();
  const isMobile = useBreakpoint();
  const modes = isMobile ? VIEW_MODES.filter(m => m.value !== 'week') : VIEW_MODES;
  const handlers = useHeaderHandlers(state);

  return (
    <>
      <HeaderMain state={state} isMobile={isMobile} modes={modes} handlers={handlers} />
      {state.viewMode === "day" && <MobileDateStrip selectedDate={state.selectedDate} dispatch={state.dispatch} />}
      <TimetableImportModal isOpen={state.showImportModal} onClose={() => state.setShowImportModal(false)} onImport={handlers.onImport} />
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
