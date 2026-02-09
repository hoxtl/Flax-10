import { useState, useMemo } from "react";
import styles from "./Home.module.css";
import PillFilters from "../components/PillFilters";
import DateNavigator from "../components/DateNavigator";
import { isToday, overlapsDay } from "../utils/dateUtils";
import { useCalendar, useCalendarDispatch, useEventModal } from "../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../hooks/useCalendarEvents";
import CardGrid from "../components/CardGrid";

function getScheduleTitle(selectedDate) {
  return isToday(selectedDate) ? "Today's schedule" : "Schedule";
}

function filterEvents(active, items) {
  if (active === "all") return items;
  return items.filter((e) => e.tag_name?.toLowerCase() === active);
}

function eventsForDate(events, date) {
  // Use overlapsDay to correctly handle all-day events and timezone differences
  return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function FiltersBar({ activeFilter, onChange, dayItems }) {
  return (
    <div className={styles.filters}>
      <PillFilters active={activeFilter} onChange={onChange} items={dayItems} />
    </div>
  );
}

export default function Home() {
  const { selectedDate, events } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { removeEvent } = useEventActions();
  const { openModal } = useEventModal();
  const [activeFilter, setActiveFilter] = useState("all");
  useCalendarEvents();

  const setSelectedDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  const dayItems = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate]);
  const filtered = useMemo(() => filterEvents(activeFilter, dayItems), [activeFilter, dayItems]);
  const scheduleTitle = useMemo(() => getScheduleTitle(selectedDate), [selectedDate]);

  const handleEdit = (event) => {
    openModal(event, event.tag_name);
  };

  return (
    <div className={styles.page}>
      <FiltersBar activeFilter={activeFilter} onChange={setActiveFilter} dayItems={dayItems} />
      <DateNavigator
        date={selectedDate}
        onChange={setSelectedDate}
        scheduleTitle={scheduleTitle}
      />
      <div className={styles.content}>
        <CardGrid items={filtered} onDelete={removeEvent} onEdit={handleEdit} date={selectedDate} />
      </div>
    </div>
  );
}
