import { useState, useMemo } from "react";
import styles from "./Home.module.css";
import PillFilters from "../../components/Tags/PillFilters";
import DateNavigator from "../../components/Home/DateNavigator";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import { getEffectiveTagName } from "../../components/Calendar/utils/eventUtils";
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import { isReadOnlyEvent } from "../../components/Calendar/utils/eventUtils";
import { EventPopups } from "../../components/Calendar/EventPopups";
import CardGrid from "../../components/Home/CardGrid";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";
import SleepBanner from "./SleepBanner";

function getScheduleTitle(selectedDate) {
  return isToday(selectedDate) ? "Today's schedule" : "Schedule";
}

function filterEvents(active, items) {
  if (active === "all") return items;
  return items.filter((e) => getEffectiveTagName(e) === active);
}

function eventsForDate(events, date) {
  return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function FiltersBar({ activeFilter, onChange, dayItems }) {
  return (
    <div className={styles.filters}>
      <PillFilters active={activeFilter} onChange={onChange} items={dayItems} />
    </div>
  );
}

function useHomeData() {
  const { selectedDate, events } = useCalendar();
  const [activeFilter, setActiveFilter] = useState("all");
  useCalendarEvents();
  const dayItems = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate]);
  const filtered = useMemo(() => filterEvents(activeFilter, dayItems), [activeFilter, dayItems]);
  const scheduleTitle = useMemo(() => getScheduleTitle(selectedDate), [selectedDate]);
  return { selectedDate, activeFilter, setActiveFilter, dayItems, filtered, scheduleTitle };
}

function useHomeActions() {
  const dispatch = useCalendarDispatch();
  const { openPopup } = useEventPopup();
  const setSelectedDate = (d) => dispatch({ type: "SET_SELECTED_DATE", payload: d });
  const handleEdit = (event, ev) => openPopup(event, ev.currentTarget.getBoundingClientRect());
  return { setSelectedDate, handleEdit };
}

export default function Home() {
  const data = useHomeData();
  const actions = useHomeActions();
  const { selectedDate, activeFilter, setActiveFilter, dayItems, filtered, scheduleTitle } = data;
  const { setSelectedDate, handleEdit } = actions;
  return (
    <div className={styles.page}>
      <SleepBanner />
      <FiltersBar activeFilter={activeFilter} onChange={setActiveFilter} dayItems={dayItems} />
      <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
      <div className={styles.content}>
        {isToday(selectedDate) && <DeadlinesWidget />}
        <CardGrid items={filtered} onEdit={handleEdit} date={selectedDate} />
      </div>
      <EventPopups />
    </div>
  );
}
