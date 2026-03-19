import { useRef, useState, useEffect } from "react";
import {
  useCalendarData,
  useCalendarDispatch,
} from "../../../context/CalendarContext";
import { getWeekDays, isSameDay, overlapsDay } from "../utils/dateUtils";
import { DayColumn } from "./DayColumn";
import { AllDayRow } from "./components/AllDayRow";
import { TimeLabels } from "./TimeLabels";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { SLOT_HEIGHT } from "../calendarConstants";
import "./WeekView.css";

/**
 * Week view shows 7 day columns with hour rows.
 * Props are optional - falls back to CalendarContext if not provided.
 */
import { shouldShowInTimeGrid } from "../utils/eventDisplayUtils";

export function WeekView({
  selectedDate: propDate,
  events: propEvents,
  onDateSelect,
  readOnly,
}) {
  const data = useCalendarData({ selectedDate: propDate, events: propEvents });
  const weekDays = getWeekDays(data.selectedDate);
  const eventsForWeek = getEventsForWeek(data.events, weekDays);
  const scrollRef = useWeekScroll(eventsForWeek, weekDays);

  return (
    <div className="week-view" ref={scrollRef}>
      <div className="sticky-header">
        <WeekHeader
          days={weekDays}
          onDateSelect={onDateSelect}
          readOnly={readOnly}
        />
        <AllDayRow days={weekDays} events={eventsForWeek} readOnly={readOnly} />
      </div>
      <WeekGrid days={weekDays} events={eventsForWeek} readOnly={readOnly} />
    </div>
  );
}

function useWeekScroll(events, weekDays) {
  const scrollRef = useRef(null);
  const timed = events.filter((e) =>
    shouldShowInTimeGrid(e, new Date(e.start_time)),
  );
  useAutoScroll(scrollRef, timed, weekDays[0].toISOString());
  return scrollRef;
}

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const top = (now.getHours() * 60 + now.getMinutes()) * (SLOT_HEIGHT / 60);
  return (
    <div className="now-line" style={{ top: `${top}px` }}>
      <div className="now-line-dot" />
    </div>
  );
}

function WeekGrid({ days, events, readOnly }) {
  return (
    <div className="week-grid">
      <TimeLabels />
      {days.map((day) => (
        <DayColumn
          key={day.toISOString()}
          date={day}
          events={getTimedEventsForDay(events, day)}
          readOnly={readOnly}
        />
      ))}
      <CurrentTimeLine />
    </div>
  );
}

function getTimedEventsForDay(events, day) {
  return getEventsForDay(events, day).filter((e) =>
    shouldShowInTimeGrid(e, day),
  );
}

/**
 * Filter events for the entire week
 */
function getEventsForWeek(events, weekDays) {
  const weekStart = new Date(weekDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDays[weekDays.length - 1]);
  weekEnd.setHours(23, 59, 59, 999);

  return events.filter((e) => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    return start < weekEnd && end > weekStart;
  });
}

/**
 * Header row showing day names and dates.
 */
function WeekHeader({ days, onDateSelect, readOnly }) {
  const dispatch = useCalendarDispatch();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const handleDayClick = (day) => {
    if (onDateSelect) return onDateSelect(day);
    if (dispatch) {
      dispatch({ type: "SET_SELECTED_DATE", payload: day });
      dispatch({ type: "SET_VIEW_MODE", payload: "day" });
    }
  };
  return (
    <div className="week-header">
      <div className="time-gutter" />
      {days.map((day, i) => (
        <DayHeaderCell
          key={day.toISOString()}
          day={day}
          name={dayNames[i]}
          isToday={isSameDay(day, today)}
          onClick={() => handleDayClick(day)}
        />
      ))}
    </div>
  );
}

function DayHeaderCell({ day, name, isToday, onClick }) {
  return (
    <div className={`day-header ${isToday ? "is-today" : ""}`}>
      <span className="day-name">{name}</span>
      <span className="day-number" onClick={onClick}>
        {day.getDate()}
      </span>
    </div>
  );
}

/**
 * Filters events to only those starting on the given day.
 */
function getEventsForDay(events, date) {
  return events.filter((e) =>
    overlapsDay(new Date(e.start_time), new Date(e.end_time), date),
  );
}
