import { useState } from "react";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import {
  addDays,
  formatDate,
  getWeekDays,
  formatMonthYear,
  isSameDay,
  getStartOfWeek,
} from "./utils/dateUtils";
import { getEvents } from "../../api/eventApi";
import { importTimetable } from "../../api/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { NavigationButtons } from "./header/NavigationButtons";
import { ViewModeToggle } from "./header/ViewModeToggle";
import TimetableImportModal from "../TimetableImportModal";
import "./CalendarHeader.css";

async function handleImport(url, dispatch, selectedDate, viewMode) {
  await importTimetable(url);
  await reloadEvents(dispatch, selectedDate, viewMode);
}

function useCalendarHeader() {
  const { selectedDate, viewMode, filter, allEvents } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
  const jumpToDate = (date) =>
    dispatch({ type: "SET_SELECTED_DATE", payload: date });
  const onImport = (url) => handleImport(url, dispatch, selectedDate, viewMode);
  return {
    selectedDate,
    viewMode,
    filter,
    allEvents,
    dispatch,
    openModal,
    showImportModal,
    setShowImportModal,
    navigate,
    jumpToDate,
    onImport,
  };
}

export function CalendarHeader() {
  const {
    selectedDate,
    viewMode,
    filter,
    allEvents,
    dispatch,
    openModal,
    showImportModal,
    setShowImportModal,
    navigate,
    jumpToDate,
    onImport,
  } = useCalendarHeader();

  const termStartDate = new Date("2026-01-12");
  const weekNumber = Math.ceil(
    (Math.floor((selectedDate - termStartDate) / (24 * 60 * 60 * 1000)) + 1) /
      7,
  );

  const weekStart = getStartOfWeek(selectedDate);
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="calendar-header">
        <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
        <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
        <HeaderActions openModal={openModal} viewMode={viewMode} selectedDate={selectedDate} onImportClick={() => setShowImportModal(true)} />
      </div>
      <TimetableImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={onImport} />
    </>
  );
}

function HeaderActions({ openModal, viewMode, selectedDate, onImportClick }) {
  return (
    <div className="actions">
      <ImportButton onImport={onImportClick} />
      <button
        className="btn-add"
        onClick={() => openForView(openModal, viewMode, selectedDate)}
      >
        +
      </button>
      <ViewModeToggle viewMode={viewMode} dispatch={useCalendarDispatch()} />
    </div>
  );
}

function ImportButton({ onImport }) {
  return (
    <div className="btn-import-wrapper">
      <button className="btn-import" onClick={onImport}>
        <span className="btn-import-text-full">Import timetable</span>
        <span className="btn-import-text-short">Import</span>
      </button>
      <span className="btn-import-tooltip">
        Import your timetable using the shareable link
      </span>
    </div>
  );
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
  if (viewMode === "year") {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + dir);
    dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
    return;
  }
  dispatch({
    type: "SET_SELECTED_DATE",
    payload: addDays(
      selectedDate,
      { day: 1, week: 7, month: 30 }[viewMode] * dir,
    ),
  });
}

function getTitle(selectedDate, viewMode) {
  if (viewMode === "day") return formatDate(selectedDate);
  if (viewMode === "month") return formatMonthYear(selectedDate);
  if (viewMode === "year") return selectedDate.getFullYear().toString();
  return getWeekTitle(selectedDate);
}

function getWeekTitle(selectedDate) {
  const week = getWeekDays(selectedDate);
  const fmt = { month: "short", day: "numeric" };
  return `${week[0].toLocaleDateString([], fmt)} – ${week[6].toLocaleDateString([], fmt)}`;
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