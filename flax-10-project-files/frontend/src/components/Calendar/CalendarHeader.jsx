import { useState } from 'react';
import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import { addDays, formatDate, formatMonthYear } from './utils/dateUtils';
import { getEvents } from "../../api/eventApi";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { NavigationButtons } from "./header/NavigationButtons";
import { ViewModeToggle } from "./header/ViewModeToggle";
import TimetableImportModal from '../TimetableImportModal';
import PillFilters from '../Tags/PillFilters';
import './CalendarHeader.css';

async function handleImport(url, dispatch, selectedDate, viewMode) {
  await importTimetable(url);
  await reloadEvents(dispatch, selectedDate, viewMode);
}

function useCalendarHeader() {
  const { selectedDate, viewMode, filter, allEvents } = useCalendar();
  const dispatch = useCalendarDispatch();
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
  const jumpToDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  const onImport = (url) => handleImport(url, dispatch, selectedDate, viewMode);
  const onFilterChange = (key) => dispatch({ type: 'SET_FILTER', payload: key });
  return { selectedDate, viewMode, dispatch, filter, allEvents, showImportModal, setShowImportModal, navigate, jumpToDate, onImport, onFilterChange };
}

export function CalendarHeader() {
  const { selectedDate, viewMode, dispatch, filter, allEvents, showImportModal, setShowImportModal, navigate, jumpToDate, onImport, onFilterChange } = useCalendarHeader();
  return (
    <>
      <div className="calendar-header">
        <div className="calendar-toolbar">
          <div className="toolbar-left">
            <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
            <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
          </div>
          <div className="toolbar-middle">
            <PillFilters active={filter} onChange={onFilterChange} items={allEvents} compact={true} />
          </div>
          <div className="toolbar-right">
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
            <ImportButton onImport={() => setShowImportModal(true)} />
          </div>
        </div>
      </div>
      <TimetableImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={onImport} />
    </>
  );
}

function ImportButton({ onImport }) {
  return (
    <div className="btn-import-wrapper">
      <button className="btn-import" onClick={onImport}>Import timetable</button>
      <span className="btn-import-tooltip">Import your timetable using the shareable link</span>
    </div>
  );
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
