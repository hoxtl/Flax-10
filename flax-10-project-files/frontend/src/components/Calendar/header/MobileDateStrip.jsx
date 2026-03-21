/*
 * MobileDateStrip.jsx
 * Horizontally scrollable date selector for mobile day view.
 */

import { isSameDay, getStartOfWeek, addDays } from "../utils/dateUtils";
import "../CalendarHeader.css";

function DateCard({ day, isActive, onClick }) {
  const dayName = day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);

  return (
    <button className={`date-card ${isActive ? "active" : ""}`} onClick={onClick}>
      <span className="day-name">{dayName}</span>
      <span className="day-number">{day.getDate()}</span>
    </button>
  );
}

/** Horizontal strip of dates for quick navigation on mobile. */
export function MobileDateStrip({ selectedDate, dispatch }) {
  const weekStart = getStartOfWeek(selectedDate);
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const selectDay = (day) => {
    dispatch({ type: "SET_SELECTED_DATE", payload: day });
    dispatch({ type: "SET_VIEW_MODE", payload: "day" });
  };
  return (
    <div className="date-strip-wrapper">
      <div className="date-strip">
        {weekDays.map((day) => <DateCard key={day.toString()} day={day} isActive={isSameDay(day, selectedDate)} onClick={() => selectDay(day)} />)}
      </div>
    </div>
  );
}
