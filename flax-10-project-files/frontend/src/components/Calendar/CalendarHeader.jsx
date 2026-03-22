/*
 * CalendarHeader.jsx
 * Navigation and controls for the calendar.
 */

import { useState } from "react";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { formatDate, isSameDay, formatMonthYear } from "./utils/dateUtils";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { getEvents } from "../../api/eventApi";
import { 
  CalendarNav, ViewSwitcher, ActionMenu, ViewSettingsMenu, 
  ViewModeButton, SearchButton, ScheduleManagerButton, FilterDropdownButton 
} from "./header/CalendarHeaderUtils";
import { MobileDateStrip } from "./header/MobileDateStrip";
import TimetableImportModal from "../TimetableImportModal";
import useBreakpoint from "../../hooks/useBreakpoint";
import "./CalendarHeader.css";

const VIEW_MODES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function navigateDate(dispatch, selectedDate, viewMode, dir) {
  const newDate = new Date(selectedDate);
  const isMonth = viewMode === "month";
  const step = viewMode === "week" ? 7 : 1;
  
  if (isMonth) newDate.setMonth(newDate.getMonth() + dir);
  else newDate.setDate(newDate.getDate() + step * dir);
  
  dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
  const range = getDateRangeForView(selectedDate, viewMode);
  const events = await getEvents({ start: range.start, end: range.end });
  dispatch({ type: "SET_EVENTS", payload: events });
}

function HeaderActions({ state, handlers, isMobile, modes }) {
  const { searchQuery, filter, viewMode, displayMode, selectedDate, sharedCalendarUserId } = state;
  const { setSearchQuery, setFilter, setViewMode, setDisplayMode, openModal, setShowImportModal } = handlers;
  const isSharedCalendar = Boolean(sharedCalendarUserId);

  const onAdd = () => (viewMode === "day" ? openModal(null, null, selectedDate) : openModal());

  return (
    <div className="header-actions">
      <SearchButton value={searchQuery || ''} onChange={setSearchQuery} />
      <FilterDropdownButton active={filter} onChange={setFilter} allowManageTags={!isSharedCalendar} />
      {isMobile && <ViewModeButton modes={modes} activeMode={viewMode} onChange={setViewMode} />}
      <ViewSettingsMenu activeMode={displayMode} onViewChange={setDisplayMode} isMobile={isMobile} />
      {!isSharedCalendar && <ScheduleManagerButton />}
      {!isSharedCalendar && <ActionMenu onAddEvent={onAdd} onImport={() => setShowImportModal(true)} />}
    </div>
  );
}

function useHeaderState() {
  const { selectedDate, viewMode, displayMode, searchQuery, filter, sharedCalendarUserId } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  const [showImportModal, setShowImportModal] = useState(false);
  
  const setters = {
    setSearchQuery: (q) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q }),
    setFilter: (key) => dispatch({ type: 'SET_FILTER', payload: key }),
    setShowImportModal: (val) => setShowImportModal(val)
  };

  return { selectedDate, viewMode, displayMode, searchQuery, filter, sharedCalendarUserId, dispatch, openModal, showImportModal, ...setters };
}

function useHeaderHandlers(state) {
  const { dispatch, selectedDate, viewMode } = state;
  
  return {
    navigate: (dir) => navigateDate(dispatch, selectedDate, viewMode, dir),
    jumpToDate: (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date }),
    setViewMode: (mode) => dispatch({ type: "SET_VIEW_MODE", payload: mode }),
    setDisplayMode: (mode) => dispatch({ type: "SET_DISPLAY_MODE", payload: mode }),
    onImport: async (url) => { 
      await importTimetable(url); 
      await reloadEvents(dispatch, selectedDate, viewMode); 
    }
  };
}

function HeaderMain({ state, isMobile, modes, handlers }) {
  const isToday = isSameDay(state.selectedDate, new Date());
  const title = state.viewMode === "day" ? formatDate(state.selectedDate) : formatMonthYear(state.selectedDate);
  return (
    <div className="calendar-header-container">
      <header className="calendar-header">
        <CalendarNav onPrev={() => handlers.navigate(-1)} onNext={() => handlers.navigate(1)} onToday={() => handlers.jumpToDate(new Date())}
          showToday={!isToday} selectedDate={state.selectedDate} onDatePick={handlers.jumpToDate} title={!isMobile ? title : null} />
        {!isMobile && <div className="header-center"><ViewSwitcher modes={modes} activeMode={state.viewMode} onChange={handlers.setViewMode} /></div>}
        <HeaderActions state={state} handlers={{...state, ...handlers}} isMobile={isMobile} modes={modes} />
      </header>
      {isMobile && <div className="mobile-title-row"><h2 className="title">{title}</h2></div>}
    </div>
  );
}

export function CalendarHeader() {
  const state = useHeaderState();
  const isMobile = useBreakpoint();
  const modes = isMobile ? VIEW_MODES.filter(m => m.value !== 'week') : VIEW_MODES;
  const handlers = useHeaderHandlers(state);

  return (
    <>
      <HeaderMain state={state} isMobile={isMobile} modes={modes} handlers={handlers} />
      {state.viewMode === "day" && <MobileDateStrip selectedDate={state.selectedDate} dispatch={state.dispatch} />}
      <TimetableImportModal 
        isOpen={state.showImportModal} 
        onClose={() => state.setShowImportModal(false)} 
        onImport={handlers.onImport} 
      />
    </>
  );
}
