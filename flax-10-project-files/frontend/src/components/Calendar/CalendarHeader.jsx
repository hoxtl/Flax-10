/*
 * CalendarHeader.jsx
<<<<<<< HEAD
 * Calendar header layout and interaction wiring.
 */

import { useState } from "react";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import {
  formatDate,
  getWeekDays,
  formatMonthYear,
  isSameDay,
} from "./utils/dateUtils";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { getEvents } from "../../api/eventApi";
import {
  CalendarNav,
  ViewSwitcher,
  ActionMenu,
  ViewSettingsMenu,
  ViewModeButton,
  SearchButton,
  ScheduleManagerButton,
  FilterDropdownButton,
} from "./header/calendarHeaderUtils";
import TimetableImportModal from "../TimetableImportModal";
import useBreakpoint from "../../hooks/useBreakpoint";
import "./calendar-header.css";

const VIEW_MODES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function filterMobileModes(isMobile) {
  return isMobile ? VIEW_MODES.filter(({ value }) => value !== "week") : VIEW_MODES;
}

function setCalendarField(dispatch, type) {
  return (payload) => dispatch({ type, payload });
}

function setViewModeWithGuard(dispatch, isMobile) {
  return (mode) => (!isMobile || mode !== "week") && setCalendarField(dispatch, "SET_VIEW_MODE")(mode);
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
  const newDate = new Date(selectedDate);
  if (viewMode === "month") newDate.setMonth(newDate.getMonth() + dir);
  if (viewMode !== "month") newDate.setDate(newDate.getDate() + getDayDelta(viewMode, dir));
  dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
}

function getDayDelta(viewMode, dir) {
  return (viewMode === "week" ? 7 : 1) * dir;
}

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTitle(selectedDate, viewMode) {
  return viewMode === "day" ? formatDate(selectedDate) : formatMonthYear(selectedDate);
}

function isTodayVisible(viewMode, date) {
  const today = new Date();
  if (viewMode === "day") return isSameDay(date, today);
  if (viewMode === "week") return getWeekDays(date).some((day) => isSameDay(day, today));
  return date.getMonth() === today.getMonth();
}

function openForView(openModal, viewMode, selectedDate) {
  return viewMode === "day" ? openModal(null, null, selectedDate) : openModal();
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
  const range = getDateRangeForView(selectedDate, viewMode);
<<<<<<< HEAD
  const events = await getEvents(range);
  dispatch({ type: "SET_EVENTS", payload: events });
}

function useCalendarHeaderState() {
  const state = useCalendar();
  const isMobile = useBreakpoint();
  return buildHeaderState(state, isMobile);
}

function buildHeaderState(state, isMobile) {
  const { selectedDate, viewMode, displayMode, searchQuery, filter, sharedCalendarUserId } =
    state;
  return {
    selectedDate,
    viewMode,
    displayMode,
    searchQuery,
    filter,
    isMobile,
    isSharedCalendar: Boolean(sharedCalendarUserId),
    title: getTitle(selectedDate, viewMode),
    showToday: !isTodayVisible(viewMode, selectedDate),
    weekDays: getWeekDays(selectedDate),
    modes: filterMobileModes(isMobile),
  };
}

function HeaderControls(props) {
  return (
    <>
      <SearchButton value={props.searchQuery || ""} onChange={props.onSearchChange} />
      <FilterDropdownButton active={props.filter} onChange={props.onFilterChange} allowManageTags={!props.isSharedCalendar} />
      <MobileViewModeAction {...props} />
      <ViewSettingsMenu activeMode={props.displayMode} onViewChange={props.onChangeDisplayMode} isMobile={props.isMobile} />
      <ScheduleActions isSharedCalendar={props.isSharedCalendar} onAdd={props.onAdd} onImport={props.onImport} />
    </>
  );
}

function MobileViewModeAction({ isMobile, modes, onViewModeChange, viewMode }) {
  if (!isMobile) return null;
  return <ViewModeButton modes={modes} activeMode={viewMode} onChange={onViewModeChange} />;
}

function ScheduleActions({ isSharedCalendar, onAdd, onImport }) {
  if (isSharedCalendar) return null;
  return (
    <>
      <ScheduleManagerButton />
      <ActionMenu onAddEvent={onAdd} onImport={onImport} />
    </>
  );
}

function HeaderActions(props) {
  return <div className="header-actions"><HeaderControls {...props} /></div>;
}

function useCalendarHeaderActions(state, setShowImportModal) {
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  return buildHeaderActions(dispatch, openModal, setShowImportModal, state);
}

function buildHeaderActions(dispatch, openModal, setShowImportModal, state) {
  return {
    dispatch,
    onAdd: () => openForView(openModal, state.viewMode, state.selectedDate),
    onImportComplete: async (url) => {
      await importTimetable(url);
      await reloadEvents(dispatch, state.selectedDate, state.viewMode);
    },
    onOpenImport: () => setShowImportModal(true),
    onSearchChange: setCalendarField(dispatch, "SET_SEARCH_QUERY"),
    onFilterChange: setCalendarField(dispatch, "SET_FILTER"),
    onChangeDisplayMode: setCalendarField(dispatch, "SET_DISPLAY_MODE"),
    onJumpToDate: setCalendarField(dispatch, "SET_SELECTED_DATE"),
    onViewModeChange: setViewModeWithGuard(dispatch, state.isMobile),
    onNavigate: (dir) => navigateDate(dispatch, state.selectedDate, state.viewMode, dir),
  };
}

function CalendarHeaderRow({ actions, state }) {
  return (
    <div className="calendar-header">
      <div className="header-nav-row">
        <CalendarNav
          onPrev={() => actions.onNavigate(-1)}
          onNext={() => actions.onNavigate(1)}
          onToday={() => actions.onJumpToDate(getTodayDate())}
          showToday={state.showToday}
          selectedDate={state.selectedDate}
          onDatePick={actions.onJumpToDate}
          title={!state.isMobile ? state.title : undefined}
        />
      </div>
      <DesktopViewSwitcher isMobile={state.isMobile} modes={state.modes} onChange={actions.onViewModeChange} viewMode={state.viewMode} />
      <HeaderActions {...state} {...actions} onImport={actions.onOpenImport} />
    </div>
  );
}

function MobileStripSection({ isMobile, onSelectDay, selectedDate, weekDays }) {
  if (!isMobile) return null;
  return <MobileDateStrip selectedDate={selectedDate} weekDays={weekDays} onSelectDay={onSelectDay} />;
}

function CalendarHeaderContent({ actions, onCloseImport, onSelectDay, showImportModal, state }) {
  return (
    <div className="calendar-header-container">
      <MobileTitle isMobile={state.isMobile} title={state.title} />
      <CalendarHeaderRow actions={actions} state={state} />
      <MobileStripSection isMobile={state.isMobile} onSelectDay={onSelectDay} selectedDate={state.selectedDate} weekDays={state.weekDays} />
      <ImportModal showImportModal={showImportModal} onClose={onCloseImport} onImport={actions.onImportComplete} />
    </div>
  );
}

function useDaySelection(actions) {
  return (day) => {
    actions.onJumpToDate(day);
    actions.onViewModeChange("day");
  };
}

export function CalendarHeader() {
  const [showImportModal, setShowImportModal] = useState(false);
  const state = useCalendarHeaderState();
  const actions = useCalendarHeaderActions(state, setShowImportModal);
  const onSelectDay = useDaySelection(actions);
  return <CalendarHeaderContent actions={actions} onCloseImport={() => setShowImportModal(false)} onSelectDay={onSelectDay} showImportModal={showImportModal} state={state} />;
}

function DateCard({ day, isActive, onClick }) {
  const dayName = day.toLocaleDateString("en-GB", { weekday: "short" });
  const dayNumber = day.getDate();
  return (
    <button
      type="button"
      className={`date-card${isActive ? " active" : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="day-name">{dayName}</span>
      <span className="day-number">{dayNumber}</span>
    </button>
  );
}

function MobileDateStrip({ selectedDate, weekDays, onSelectDay }) {
  return (
    <div className="date-strip-wrapper">
      <div className="date-strip">
        {weekDays.map((day) => (
          <DateCard
            key={day.toString()}
            day={day}
            isActive={isSameDay(day, selectedDate)}
            onClick={() => onSelectDay(day)}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopViewSwitcher({ isMobile, modes, onChange, viewMode }) {
  if (isMobile) return null;
  return (
    <div className="header-center">
      <ViewSwitcher modes={modes} activeMode={viewMode} onChange={onChange} />
    </div>
  );
}

function MobileTitle({ isMobile, title }) {
  if (!isMobile) return null;
  return (
    <div className="mobile-title-row">
      <h2 className="title">{title}</h2>
    </div>
  );
}

function ImportModal({ onClose, onImport, showImportModal }) {
  if (!showImportModal) return null;
  return <TimetableImportModal isOpen={showImportModal} onClose={onClose} onImport={onImport} />;
=======
  const events = await getEvents({ start: range.start, end: range.end });
  dispatch({ type: "SET_EVENTS", payload: events });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function HeaderActions({ state, handlers, isMobile, modes }) {
  const { searchQuery, filter, viewMode, displayMode, selectedDate } = state;
  const { setSearchQuery, setFilter, setViewMode, setDisplayMode, openModal, setShowImportModal } = handlers;

  const onAdd = () => (viewMode === "day" ? openModal(null, null, selectedDate) : openModal());

  return (
    <div className="header-actions">
      <SearchButton value={searchQuery || ''} onChange={setSearchQuery} />
      <FilterDropdownButton active={filter} onChange={setFilter} />
      {isMobile && <ViewModeButton modes={modes} activeMode={viewMode} onChange={setViewMode} />}
      <ViewSettingsMenu activeMode={displayMode} onViewChange={setDisplayMode} isMobile={isMobile} />
      <ScheduleManagerButton />
      <ActionMenu onAddEvent={onAdd} onImport={() => setShowImportModal(true)} />
    </div>
  );
}

function useHeaderState() {
  const { selectedDate, viewMode, displayMode, searchQuery, filter } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  const [showImportModal, setShowImportModal] = useState(false);
  
  const setters = {
    setSearchQuery: (q) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q }),
    setFilter: (key) => dispatch({ type: 'SET_FILTER', payload: key }),
    setShowImportModal: (val) => setShowImportModal(val)
  };

  return { selectedDate, viewMode, displayMode, searchQuery, filter, dispatch, openModal, showImportModal, ...setters };
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

