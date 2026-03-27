/*
 * Calendar import actions for AI-suggested events.
 */

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { createEvent } from "../../../api/eventApi";
import { useCalendarDispatch } from "../../../context/CalendarContext";
import {
  formatEventTime,
  getPendingImports,
  resetStatuses,
  updateStatusAtIndex,
} from "../utils/studyCoachHelpers";
import styles from "../styles/studyCoachStyles";

export default function ScheduleImportPanel({ events }) {
  const calendarDispatch = useCalendarDispatch();
  const { importAll, importOne, statuses } = useScheduleImports(events, calendarDispatch);
  return (
    <div className={styles.importPanel}>
      {events.map((event, index) => (
        <ImportRow
          key={`${event.title}-${event.start_time}-${index}`}
          event={event}
          status={statuses[index]}
          onImport={() => importOne(index)}
        />
      ))}
      <ImportFooter statuses={statuses} onImportAll={importAll} />
    </div>
  );
}

function ImportRow({ event, status, onImport }) {
  return (
    <div className={styles.importRow}>
      <ImportEventDetails event={event} />
      <ImportButton event={event} status={status} onImport={onImport} />
      {status === "error" && <span className={styles.importStatus}>Failed</span>}
    </div>
  );
}

function ImportEventDetails({ event }) {
  return (
    <div className={styles.importEventInfo}>
      <span className={styles.importEventTitle}>{event.title}</span>
      <span className={styles.importEventTime}>{formatEventTime(event.start_time, event.end_time)}</span>
    </div>
  );
}

function ImportButton({ event, status, onImport }) {
  return (
    <button
      className={getImportButtonClassName(status)}
      onClick={onImport}
      disabled={status === "loading" || status === "done"}
      aria-label={`Add ${event.title} to calendar`}
    >
      {status === "done" ? <Check size={13} /> : status === "loading" ? "…" : "+ Add"}
    </button>
  );
}

function ImportFooter({ statuses, onImportAll }) {
  if (!statuses.length) return null;
  if (statuses.every((status) => status === "done")) return <ImportDoneState />;
  return (
    <button className={styles.importAllBtn} onClick={onImportAll}>
      <CalendarPlus size={14} />
      Import All ({getPendingImports(statuses)} events)
    </button>
  );
}

function ImportDoneState() {
  return (
    <p className={styles.importAllDone}>
      <Check size={13} /> All events added to your calendar
    </p>
  );
}

function buildEventPayload(event) {
  return {
    title: event.title,
    start_time: event.start_time,
    end_time: event.end_time,
    description: event.description || "",
  };
}

function getImportIndexes(statuses) {
  return statuses.flatMap((status, index) => (status === "done" ? [] : [index]));
}

function getImportButtonClassName(status) {
  const doneClass = status === "done" ? ` ${styles.importAddBtnDone}` : "";
  return `${styles.importAddBtn}${doneClass}`;
}

function useScheduleImports(events, calendarDispatch) {
  const [statuses, setStatuses] = useState(() => resetStatuses(events));
  return {
    statuses,
    importAll: () => importAllSchedules(statuses, (index) => importSchedule(events, index, setStatuses, calendarDispatch)),
    importOne: (index) => importSchedule(events, index, setStatuses, calendarDispatch),
  };
}

async function importAllSchedules(statuses, importOne) {
  for (const index of getImportIndexes(statuses)) await importOne(index);
}

async function importSchedule(events, index, setStatuses, calendarDispatch) {
  setStatuses(updateStatusAtIndex(index, "loading"));
  try {
    await createEvent(buildEventPayload(events[index]));
    setStatuses(updateStatusAtIndex(index, "done"));
    calendarDispatch?.({ type: "TRIGGER_RELOAD" });
  } catch {
    setStatuses(updateStatusAtIndex(index, "error"));
  }
}
