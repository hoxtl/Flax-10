import { AnimatePresence, motion } from "framer-motion";
import { useCalendar } from "../../context/CalendarContext";
import { ResizeHighlightProvider } from "../../context/ResizeHighlightContext";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { DayView } from "./DayView/DayView";
import { WeekView } from "./WeekView/WeekView";
import { SwipeMonthView } from "./MonthView/SwipeMonthView";
import { ListView } from "./ListView/ListView";
import { TableView } from "./TableView/TableView";
import { viewSwapMotion } from "../common";
import "./Calendar.css";

export function Calendar() {
  return (
    <ResizeHighlightProvider>
      <CalendarContent />
    </ResizeHighlightProvider>
  );
}

const motionWrapperStyle = { display: "flex", flexDirection: "column", height: "100%" };

function CalendarContent() {
  const { viewMode, displayMode } = useCalendar();
  useCalendarEvents();
  const viewKey = `${viewMode}-${displayMode}`;

  return (
    <div className="calendar-container">
      <div className="calendar-view-relative-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={viewKey} style={motionWrapperStyle} {...viewSwapMotion}>
            <CalendarView viewMode={viewMode} displayMode={displayMode} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CalendarView({ viewMode, displayMode }) {
  const gridViews = { day: DayView, week: WeekView, month: SwipeMonthView };
  const displayViews = { grid: gridViews[viewMode], list: ListView, table: TableView };
  const View = displayViews[displayMode] || gridViews[viewMode];
  return View ? <View /> : null;
}
