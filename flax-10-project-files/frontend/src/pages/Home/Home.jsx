import { useState, useMemo } from "react";
import styles from "./Home.module.css";
import DateNavigator from "../../components/Home/DateNavigator";
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import CardGrid from "../../components/Home/CardGrid";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";

function getScheduleTitle(selectedDate) {
  return isToday(selectedDate) ? "Today's schedule" : "Schedule";
}

function eventsForDate(events, date) {
  return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date));
}

function useHomeState() {
  const { selectedDate, events } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { removeEvent } = useEventActions();
  const { openModal } = useEventModal();
  useCalendarEvents();
  const setSelectedDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });
  const dayItems = useMemo(() => eventsForDate(events, selectedDate), [events, selectedDate]);
  const scheduleTitle = useMemo(() => getScheduleTitle(selectedDate), [selectedDate]);
  const handleEdit = (event) => openModal(event, event.tag);
  return { selectedDate, setSelectedDate, dayItems, scheduleTitle, removeEvent, handleEdit };
}

export default function Home() {
  const { selectedDate, setSelectedDate, dayItems, scheduleTitle, removeEvent, handleEdit } = useHomeState();
  return (
    <div className={styles.page}>
      <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={scheduleTitle} />
      <div className={styles.content}>
        {isToday(selectedDate) && <DeadlinesWidget />}
        <CardGrid items={dayItems} onDelete={removeEvent} onEdit={handleEdit} date={selectedDate} />
      </div>
    </div>
  );
}
