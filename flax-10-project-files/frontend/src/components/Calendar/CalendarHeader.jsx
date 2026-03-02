import { useState, useRef, useEffect } from 'react';
import { Plus, CalendarPlus, Upload } from 'lucide-react';
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import { useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, formatMonthYear } from './utils/dateUtils';
import { getEvents } from "../../api/eventApi";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { NavigationButtons } from "./header/NavigationButtons";
import { ViewModeToggle } from "./header/ViewModeToggle";
import TimetableImportModal from '../TimetableImportModal';
import PillFilters from '../Tags/PillFilters';
import './CalendarHeader.css';

function ExpandableActions({ onCreateEvent, onImport }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    const h = e => { if (!ref.current?.contains(e.target)) setExpanded(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [expanded]);

  return (
    <div className="action-menu" ref={ref}>
      <button
        className={`icon-circle-btn${expanded ? ' action-menu-open' : ''}`}
        onClick={() => setExpanded(p => !p)}
        aria-label="Actions"
        title="Actions"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
      {expanded && (
        <div className="action-menu-items">
          <button className="action-menu-btn" title="New event" aria-label="New event"
            onClick={() => { onCreateEvent(); setExpanded(false); }}>
            <CalendarPlus size={16} strokeWidth={2} />
          </button>
          <button className="action-menu-btn" title="Import timetable" aria-label="Import timetable"
            onClick={() => { onImport(); setExpanded(false); }}>
            <Upload size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

async function handleImport(url, dispatch, selectedDate, viewMode) {
  await importTimetable(url);
  await reloadEvents(dispatch, selectedDate, viewMode);
}

function useCalendarHeader() {
  const { selectedDate, viewMode, filter, allEvents } = useCalendar();
  const { openModal } = useEventModal();
  const dispatch = useCalendarDispatch();
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
  const jumpToDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  const onImport = (url) => handleImport(url, dispatch, selectedDate, viewMode);
  const onFilterChange = (key) => dispatch({ type: 'SET_FILTER', payload: key });
  const onCreateEvent = () => openModal(getDefaultStart(selectedDate), null, selectedDate);
  return { selectedDate, viewMode, dispatch, filter, allEvents, showImportModal, setShowImportModal, navigate, jumpToDate, onImport, onFilterChange, onCreateEvent };
}

export function CalendarHeader() {
  const { selectedDate, viewMode, dispatch, filter, allEvents, showImportModal, setShowImportModal, navigate, jumpToDate, onImport, onFilterChange, onCreateEvent } = useCalendarHeader();
  return (
    <>
      <div className="calendar-header">
        <div className="calendar-toolbar-main">
          <div className="toolbar-left">
            <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
            <ExpandableActions onCreateEvent={onCreateEvent} onImport={() => setShowImportModal(true)} />
          </div>
          <div className="toolbar-right">
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
            <PillFilters active={filter} onChange={onFilterChange} items={allEvents} compact={true} />
            <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
          </div>
        </div>
      </div>
      <TimetableImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={onImport} />
    </>
  );
}

function getDefaultStart(selectedDate) {
  const start = new Date(selectedDate);
  start.setHours(9, 0, 0, 0);
  return { start_time: start, end_time: new Date(start.getTime() + 60 * 60 * 1000) };
}

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
  if (viewMode === 'week' || viewMode === 'month') return formatMonthYear(selectedDate);
  if (viewMode === 'year') return selectedDate.getFullYear().toString();
  return formatMonthYear(selectedDate);
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
  const { start, end } = getDateRangeForView(selectedDate, viewMode);
  const data = await getEvents({ start, end });
  dispatch({ type: 'SET_EVENTS', payload: data });
}
