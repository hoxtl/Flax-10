import { useState, useMemo } from "react";
import styles from "./Home.module.css";
import PillFilters from "../../components/Tags/PillFilters";
import DateNavigator from "../../components/Home/DateNavigator";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
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
  return items.filter((e) => e.tag_name?.toLowerCase() === active);
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
  const { removeEvent } = useEventActions();
  const { openModal } = useEventModal();
  const { openPopup } = useEventPopup();
  const setSelectedDate = (d) => dispatch({ type: "SET_SELECTED_DATE", payload: d });
  const handleEdit = (event, ev) => {
    if (isReadOnlyEvent(event)) openPopup(event, ev.currentTarget.getBoundingClientRect());
    else openModal(event, event.tag);
  };
  return { setSelectedDate, removeEvent, handleEdit };
}

export default function Home() {
  const data = useHomeData();
  const actions = useHomeActions();
  const { selectedDate, activeFilter, setActiveFilter, dayItems, filtered, scheduleTitle } = data;
  const { setSelectedDate, removeEvent, handleEdit } = actions;
  return (
    <div className={styles.page}>
      <SleepBanner />
      <FiltersBar activeFilter={activeFilter} onChange={setActiveFilter} dayItems={dayItems} />
      <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
      <div className={styles.content}>
        {isToday(selectedDate) && <DeadlinesWidget />}
        <CardGrid items={filtered} onDelete={removeEvent} onEdit={handleEdit} date={selectedDate} />
      </div>
      <EventPopups />
    </div>
  );
}
