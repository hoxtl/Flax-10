import { useCalendar } from "../../context/CalendarContext";
import { ResizeHighlightProvider } from "../../context/ResizeHighlightContext";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { DayView } from "./DayView/DayView";
import { WeekView } from "./WeekView/WeekView";
import { MonthView } from "./MonthView/MonthView";
import { YearView } from "./YearView/YearView";
import "./Calendar.css";
import { useEffect, useRef, useState } from "react";

function CurrentTimeIndicator({ hourHeight = 60 }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const topPosition = (minutesSinceMidnight / 60) * hourHeight;

  return (
    <div className="current-time-line" style={{ top: `${topPosition}px` }}>
      <div className="current-time-dot" />
    </div>
  );
}

export function Calendar() {
    return (
        <ResizeHighlightProvider>
            <CalendarContent />
        </ResizeHighlightProvider>
    );
}

function CalendarContent() {
    const { viewMode } = useCalendar();
    useCalendarEvents();

    return (
        <div className="calendar-container">
            <CalendarHeader />
            <CalendarView viewMode={viewMode} />
        </div>
    );
}

function CalendarView({ viewMode }) {
    const views = { day: DayView, week: WeekView, month: MonthView, year: YearView };
    const View = views[viewMode];

    return View ? <View /> : null;
}