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
import { importTimetable } from "../../api/calendar/timetableApi";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { getEvents } from "../../api/calendar/eventApi";
import {
  CalendarNav,
  ViewSwitcher,
  ActionMenu,
  ViewSettingsMenu,
  ViewModeButton,
  SearchButton,
  ScheduleManagerButton,
  FilterDropdownButton,
} from "./header/CalendarHeaderUtils";
import TimetableImportModal from "../TimetableImportModal";
import useBreakpoint from "../../hooks/useBreakpoint";
import "./CalendarHeader.css";

const VIEW_MODES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function CalendarHeader() {
  const {
    selectedDate,
    viewMode,
    displayMode,
    searchQuery,
    filter,
    sharedCalendarUserId,
  } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { openModal } = useEventModal();
  const [showImportModal, setShowImportModal] = useState(false);
  const isMobile = useBreakpoint();

  const modes = isMobile
    ? VIEW_MODES.filter((m) => m.value !== "week")
    : VIEW_MODES;
  const isSharedCalendar = Boolean(sharedCalendarUserId);

  const setSearchQuery = (q) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: q });
  const setFilter = (key) => dispatch({ type: "SET_FILTER", payload: key });
  const setViewMode = (mode) => {
    if (isMobile && mode === "week") return;
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  };
  const setDisplayMode = (mode) =>
    dispatch({ type: "SET_DISPLAY_MODE", payload: mode });

  const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
  const jumpToDate = (date) =>
    dispatch({ type: "SET_SELECTED_DATE", payload: date });

  const onAdd = () => openForView(openModal, viewMode, selectedDate);
  const onImport = async (url) => {
    await importTimetable(url);
    await reloadEvents(dispatch, selectedDate, viewMode);
  };

  const showToday = !isTodayVisible(viewMode, selectedDate);
  const title = getTitle(selectedDate, viewMode);
  const weekDays = getWeekDays(selectedDate);

  const selectDay = (day) => {
    dispatch({ type: "SET_SELECTED_DATE", payload: day });
    dispatch({ type: "SET_VIEW_MODE", payload: "day" });
  };

  return (
    <div className="calendar-header-container">
      {isMobile && (
        <div className="mobile-title-row">
          <h2 className="title">{title}</h2>
        </div>
      )}
      <div className="calendar-header">
        <div className="header-nav-row">
          <CalendarNav
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={() => jumpToDate(getTodayDate())}
            showToday={showToday}
            selectedDate={selectedDate}
            onDatePick={jumpToDate}
            title={!isMobile ? title : undefined}
          />
        </div>
        {!isMobile && (
          <div className="header-center">
            <ViewSwitcher
              modes={modes}
              activeMode={viewMode}
              onChange={setViewMode}
            />
          </div>
        )}
        <div className="header-actions">
          <SearchButton value={searchQuery || ""} onChange={setSearchQuery} />
          <FilterDropdownButton
            active={filter}
            onChange={setFilter}
            allowManageTags={!isSharedCalendar}
          />
          {isMobile && (
            <ViewModeButton
              modes={modes}
              activeMode={viewMode}
              onChange={setViewMode}
            />
          )}
          <ViewSettingsMenu
            activeMode={displayMode}
            onViewChange={setDisplayMode}
            isMobile={isMobile}
          />
          {!isSharedCalendar && <ScheduleManagerButton />}
          {!isSharedCalendar && (
            <ActionMenu
              onAddEvent={onAdd}
              onImport={() => setShowImportModal(true)}
            />
          )}
        </div>
      </div>
      {isMobile && (
        <div className="date-strip-wrapper">
          <div className="date-strip">
            {weekDays.map((day) => (
              <DateCard
                key={day.toString()}
                day={day}
                isActive={isSameDay(day, selectedDate)}
                onClick={() => selectDay(day)}
              />
            ))}
          </div>
        </div>
      )}
      {showImportModal && (
        <TimetableImportModal
          onClose={() => setShowImportModal(false)}
          onImport={onImport}
        />
      )}
    </div>
  );
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
  if (viewMode === "day") return isSameDay(date, today);
  if (viewMode === "week")
    return getWeekDays(date).some((d) => isSameDay(d, today));
  return date.getMonth() === today.getMonth();
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
  const range = getDateRangeForView(selectedDate, viewMode);
  const events = await getEvents(range);
  dispatch({ type: "SET_EVENTS", payload: events });
}
