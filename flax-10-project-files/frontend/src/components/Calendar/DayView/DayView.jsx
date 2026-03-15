import { useRef, useState, useEffect } from "react";
import { useCalendarData } from "../../../context/CalendarContext";
import { overlapsDay } from "../utils/dateUtils";
import { shouldShowInTimeGrid } from "../utils/eventDisplayUtils";
import { TimeSlot } from "./TimeSlot";
import { AllDayRow } from "../WeekView/components/AllDayRow";
import { DraggableEvent } from "../DraggableEvent";
import { getHoursOfDay, calculateEventStyle } from "./dayViewHelpers";
import { SLOT_HEIGHT } from "../calendarConstants";
import { useAutoScroll } from "../hooks/useAutoScroll";
import "./DayView.css";

export function DayView({
  selectedDate: propDate,
  events: propEvents,
  readOnly,
}) {
  const data = useCalendarData({ selectedDate: propDate, events: propEvents });
  const { selectedDate, timedEvents, allEvents, scrollRef } = useDayViewData(
    data.selectedDate,
    data.events,
  );

  return (
    <div className="day-view" ref={scrollRef}>
      <div className="sticky-header">
        <AllDayRow
          days={[selectedDate]}
          events={allEvents}
          readOnly={readOnly}
        />
      </div>
      <div className="day-grid-container">
        <TimeLabelsColumn hours={getHoursOfDay()} />
        <DayGrid
          hours={getHoursOfDay()}
          date={selectedDate}
          events={timedEvents}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function useDayViewData(selectedDate, events) {
  const scrollRef = useRef(null);
  const allEvents = filterEventsForDay(events, selectedDate);
  const timedEvents = allEvents.filter((e) =>
    shouldShowInTimeGrid(e, selectedDate),
  );
  useAutoScroll(scrollRef, timedEvents, selectedDate.toISOString());
  return { selectedDate, timedEvents, allEvents, scrollRef };
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

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const top = (now.getHours() * 60 + now.getMinutes()) * (SLOT_HEIGHT / 60);
  return (
    <div
      style={{
        position: "absolute",
        top: `${top}px`,
        left: 0,
        right: 0,
        height: "2px",
        background: "#ea4335",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "12px",
          height: "12px",
          background: "#ea4335",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

function DayGrid({ hours, date, events, readOnly }) {
  return (
    <div className="day-grid">
      {hours.map((hour) => (
        <TimeSlot key={hour} hour={hour} date={date} readOnly={readOnly} />
      ))}
      <EventsLayer events={events} date={date} readOnly={readOnly} />
      <CurrentTimeLine />
    </div>
  );
}

function EventsLayer({ events, date, readOnly }) {
  return (
    <div className="events-layer">
      {events.map((e) => (
        <DraggableEvent
          key={e.id}
          event={e}
          readOnly={readOnly}
          style={calculateEventStyle(e, SLOT_HEIGHT, events, date)}
          minWidthForDetails={25}
        />
      ))}
    </div>
  );
}

function filterEventsForDay(events, date) {
  return events.filter((e) =>
    overlapsDay(new Date(e.start_time), new Date(e.end_time), date),
  );
}

function formatHour(hour) {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
}
