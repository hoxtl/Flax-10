import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEvents } from "../../../api/eventApi";
import { getUpcomingDeadlines } from "../../../api/deadlineApi";

function getMonday(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addWeeks(date, count) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 7 * count);
  return nextDate;
}

function getSemesterStart(semesterStart, numWeeks, now) {
  if (semesterStart) return getMonday(new Date(semesterStart));
  const approx = new Date(now);
  approx.setDate(approx.getDate() - Math.floor(numWeeks / 2) * 7);
  return getMonday(approx);
}

async function fetchSemesterData(semStart, semEnd) {
  const start = semStart.toISOString().slice(0, 10);
  const end = semEnd.toISOString().slice(0, 10);
  const [events, deadlines] = await Promise.all([
    getEvents({ start, end }),
    getUpcomingDeadlines().catch(() => []),
  ]);
  return [Array.isArray(events) ? events : [], Array.isArray(deadlines) ? deadlines : []];
}

async function loadSemesterData(semStart, semEnd, setEvents, setDeadlines, setLoading) {
  setLoading(true);
  try {
    const [events, deadlines] = await fetchSemesterData(semStart, semEnd);
    setEvents(events);
    setDeadlines(deadlines);
  } catch {
    setEvents([]);
    setDeadlines([]);
  } finally {
    setLoading(false);
  }
}

export function useSemesterRange(semesterStart, numWeeks) {
  const nowRef = useRef(new Date());
  const now = nowRef.current;
  const semStart = useMemo(
    () => getSemesterStart(semesterStart, numWeeks, now),
    [semesterStart, numWeeks, now],
  );
  const semEnd = useMemo(() => addWeeks(semStart, numWeeks), [semStart, numWeeks]);
  return { now, semStart, semEnd };
}

export function useSemesterData(semStart, semEnd) {
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const startTime = semStart?.getTime?.() ?? new Date(semStart).getTime();
  const endTime = semEnd?.getTime?.() ?? new Date(semEnd).getTime();
  const fetchData = useCallback(
    async () => loadSemesterData(new Date(startTime), new Date(endTime), setEvents, setDeadlines, setLoading),
    [endTime, startTime],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { deadlines, events, loading };
}
