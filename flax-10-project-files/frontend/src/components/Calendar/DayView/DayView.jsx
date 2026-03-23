/**
 * DayView - Single day calendar view with hourly time grid.
 * Displays all-day events in header and timed events in scrollable grid.
 */

import { useRef, useState, useEffect } from "react";
import { useCalendarData } from "../../../context/CalendarContext";
import { overlapsDay } from "../utils/dateUtils";
import { shouldShowInTimeGrid } from "../utils/eventDisplayUtils";
import { TimeSlot } from "./TimeSlot";
import { AllDayRow } from "../WeekView/components/AllDayRow";
import { DraggableEvent } from "../DraggableEvent";
import { getHoursOfDay, calculateEventStyle, formatHour } from "./dayViewHelpers";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { SLOT_HEIGHT } from "../calendarConstants";
import { CurrentTimeLine } from "../components/CurrentTimeLine";
import "./DayView.css";

function useDayViewData(selectedDate, events) {
  const scrollRef = useRef(null);
  const timed = events.filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate) && shouldShowInTimeGrid(e, selectedDate));
  useAutoScroll(scrollRef, timed, selectedDate.toISOString());
  return { selectedDate, timedEvents: timed, allEvents: events, scrollRef };
}

function TimeLabelsColumn({ hours }) {
  return (
    <div className="time-labels-column">
      {hours.map((hour) => (
        <div key={hour} className="time-label-row">
          <span className="time-label-text">{formatHour(hour)}</span>
        </div>
      ))}
    </div>
  );
}

function EventsLayer({ events, date, readOnly }) {
  return (
    <div className="events-layer">
      {events.map((e) => (
        <DraggableEvent key={e.id} event={e} readOnly={readOnly}
          style={calculateEventStyle(e, SLOT_HEIGHT, events, date)} minWidthForDetails={25} />
      ))}
    </div>
  );
}

function DayGrid({ hours, date, events, readOnly }) {
  return (
    <div className="day-grid">
      {hours.map((hour) => <TimeSlot key={hour} hour={hour} date={date} readOnly={readOnly} />)}
      <EventsLayer events={events} date={date} readOnly={readOnly} />
      <CurrentTimeLine />
    </div>
  );
}

/** Day view component showing hourly time slots with events. */

export function DayView({ selectedDate: propDate, events: propEvents, readOnly }) {
  const data = useCalendarData({ selectedDate: propDate, events: propEvents });
  const { selectedDate, timedEvents, allEvents, scrollRef } = useDayViewData(data.selectedDate, data.events);

  return (
    <div className="day-view" ref={scrollRef}>
      <div className="sticky-header">
        <AllDayRow days={[selectedDate]} events={allEvents} readOnly={readOnly} />
      </div>
      <div className="day-grid-container">
        <TimeLabelsColumn hours={getHoursOfDay()} />
        <DayGrid hours={getHoursOfDay()} date={selectedDate} events={timedEvents} readOnly={readOnly} />
      </div>
    </div>
  );
}
