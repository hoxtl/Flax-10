/*
 * Calendar.jsx
 * Main calendar component with animated view switching.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCalendar } from "../../context/CalendarContext";
import { ResizeHighlightProvider } from "../../context/ResizeHighlightContext";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
<<<<<<< HEAD
import { DayView } from "./day_view/DayView";
import { WeekView } from "./week_view/WeekView";
import { SwipeMonthView } from "./month_view/SwipeMonthView";
import { ListView } from "./list_view/ListView";
import { TableView } from "./table_view/TableView";
import { viewSwapMotion } from "../common";
import "./calendar.css";

const MOTION_STYLE = { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 };
const GRID_VIEWS = { day: DayView, week: WeekView, month: SwipeMonthView };
const DISPLAY_VIEWS = { grid: null, list: ListView, table: TableView };

function CalendarView({ viewMode, displayMode }) {
  const View = DISPLAY_VIEWS[displayMode] || GRID_VIEWS[viewMode];
  const { readOnly } = useCalendar();
  return View ? <View readOnly={readOnly} /> : null;
}

function CalendarContent() {
  const { viewMode, displayMode } = useCalendar();
  useCalendarEvents();
  const viewKey = `${viewMode}-${displayMode}`;

  return (
    <div className="calendar-container">
      <div className="calendar-view-relative-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={viewKey} style={MOTION_STYLE} {...viewSwapMotion}>
            <CalendarView viewMode={viewMode} displayMode={displayMode} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Main calendar wrapper with resize highlight provider. */
=======
import { DayView } from "./DayView/DayView";
import { WeekView } from "./WeekView/WeekView";
import { SwipeMonthView } from "./MonthView/SwipeMonthView";
import { ListView } from "./ListView/ListView";
import { TableView } from "./TableView/TableView";
import { viewSwapMotion } from "../common";
import "./Calendar.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const MOTION_STYLE = { display: "flex", flexDirection: "column", height: "100%" };
const GRID_VIEWS = { day: DayView, week: WeekView, month: SwipeMonthView };
const DISPLAY_VIEWS = { grid: null, list: ListView, table: TableView };

function CalendarView({ viewMode, displayMode }) {
  const View = DISPLAY_VIEWS[displayMode] || GRID_VIEWS[viewMode];
  return View ? <View /> : null;
}

function CalendarContent() {
  const { viewMode, displayMode } = useCalendar();
  useCalendarEvents();
  const viewKey = `${viewMode}-${displayMode}`;

  return (
    <div className="calendar-container">
      <div className="calendar-view-relative-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={viewKey} style={MOTION_STYLE} {...viewSwapMotion}>
            <CalendarView viewMode={viewMode} displayMode={displayMode} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Main calendar wrapper with resize highlight provider. */
export function Calendar() {
  return (
    <ResizeHighlightProvider>
      <CalendarContent />
    </ResizeHighlightProvider>
  );
}
