import { useState, useMemo } from "react";
import styles from "./Home.module.css";
import PillFilters from "../components/PillFilters";
import DateNavigator from "../components/DateNavigator";
import { isToday } from "../lib/dateUtils";
import { eventsForDate } from "../lib/eventsStore";
import CardGrid from "../components/CardGrid";

// Home page showing the schedule for the selected date, with filters and navigation.
function getScheduleTitle(selectedDate) {
  return isToday(selectedDate) ? "Today's schedule" : "Schedule";
}

// Filters events based on the active filter key. If "all", returns all items.
function filterEvents(active, items) {
  return active === "all" ? items : items.filter((e) => e.type === active);
}

// Renders the filter pills at the top of the page, showing counts for each type and allowing selection.
function FiltersBar({ activeFilter, onChange, dayItems }) {
  return (
    <div className={styles.filters}>
      <PillFilters active={activeFilter} onChange={onChange} items={dayItems} />
    </div>
  );
}

// Main Home component. Manages the selected date and active filter state, computes the events to show, and renders the navigation, filters, and event cards.
export default function Home({ selectedDate, setSelectedDate, events = [], onDelete }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const dayItems = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate]);
  const filtered = useMemo(() => filterEvents(activeFilter, dayItems), [activeFilter, dayItems]);
  const scheduleTitle = useMemo(() => getScheduleTitle(selectedDate), [selectedDate]);

  return (
    <div className={styles.page}>
      <FiltersBar activeFilter={activeFilter} onChange={setActiveFilter} dayItems={dayItems} />
      <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
      <div className={styles.content}>
        <CardGrid items={filtered} onDelete={onDelete} />
      </div>
    </div>
  );
}
