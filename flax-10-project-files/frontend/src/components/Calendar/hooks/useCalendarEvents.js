/**
 * useCalendarEvents - Event fetching and caching for calendar views.
 * Manages API calls with deduplication to prevent redundant fetches.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { getEvents, createEvent, updateEvent, deleteEvent, addExceptionDate } from '../../../api/eventApi';
import { getDateRangeForView } from './calendarHelpers';

function getDateKey(date, viewMode) {
  if (!date) return '';
  const d = new Date(date);
  if (viewMode === 'day') return d.toDateString();
  if (viewMode === 'week') return `${d.getFullYear()}-W${getWeekNumber(d)}`;
  if (viewMode === 'year') return `${d.getFullYear()}`;
  return `${d.getFullYear()}-${d.getMonth()}`;
<<<<<<< HEAD
}

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

const fetchingRef = { current: false, key: null };

/** Hook for loading calendar events based on current view. */

export function useCalendarEvents() {
  const { events, selectedDate, viewMode, reloadKey, sharedCalendarUserId } = useCalendar();
  const dispatch = useCalendarDispatch();
  const dateKey = useMemo(() => getDateKey(selectedDate, viewMode), [selectedDate, viewMode]);
  const stateRef = useRef({ selectedDate, viewMode, sharedCalendarUserId });
  stateRef.current = { selectedDate, viewMode, sharedCalendarUserId };
  const load = useCallback(() => { fetchingRef.key = null; fetchEvents(stateRef.current, dispatch); }, [dispatch]);
  useEffect(() => {
    if (fetchingRef.key === dateKey || fetchingRef.current) return;
    fetchingRef.key = dateKey;
    fetchEvents(stateRef.current, dispatch);
  }, [dateKey, dispatch]);
  useEffect(() => { if (reloadKey) load(); }, [reloadKey, load]);
  return { events, loadEvents: load };
}

async function fetchEvents(state, dispatch) {
  if (fetchingRef.current) return;
  fetchingRef.current = true;
  const { start, end } = getDateRangeForView(state.selectedDate, state.viewMode);
  const params = state.sharedCalendarUserId
    ? { start, end, user_id: state.sharedCalendarUserId }
    : { start, end };
  try {
    dispatch({ type: 'SET_EVENTS', payload: await getEvents(params) });
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
  } finally {
    fetchingRef.current = false;
  }
}

/** Hook providing event CRUD operations with auto-reload. */

export function useEventActions() {
  const { selectedDate, viewMode, sharedCalendarUserId } = useCalendar();
  const dispatch = useCalendarDispatch();
  const stateRef = useRef({ selectedDate, viewMode, dispatch, sharedCalendarUserId });
  stateRef.current = { selectedDate, viewMode, dispatch, sharedCalendarUserId };

  const reload = useCallback(async () => {
    const { selectedDate: date, viewMode: mode, dispatch: d, sharedCalendarUserId: viewerUserId } = stateRef.current;
    const { start, end } = getDateRangeForView(date, mode);
    const params = viewerUserId ? { start, end, user_id: viewerUserId } : { start, end };
    d({ type: 'SET_EVENTS', payload: await getEvents(params) });
=======
}

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

const fetchingRef = { current: false, key: null };

/** Hook for loading calendar events based on current view. */
export function useCalendarEvents() {
  const { events, selectedDate, viewMode, reloadKey } = useCalendar();
  const dispatch = useCalendarDispatch();
  const dateKey = useMemo(() => getDateKey(selectedDate, viewMode), [selectedDate, viewMode]);
  const stateRef = useRef({ selectedDate, viewMode });
  stateRef.current = { selectedDate, viewMode };
  const load = useCallback(() => { fetchingRef.key = null; fetchEvents(stateRef.current, dispatch); }, [dispatch]);
  useEffect(() => {
    if (fetchingRef.key === dateKey || fetchingRef.current) return;
    fetchingRef.key = dateKey;
    fetchEvents(stateRef.current, dispatch);
  }, [dateKey, dispatch]);
  useEffect(() => { if (reloadKey) load(); }, [reloadKey, load]);
  return { events, loadEvents: load };
}

async function fetchEvents(state, dispatch) {
  if (fetchingRef.current) return;
  fetchingRef.current = true;
  const { start, end } = getDateRangeForView(state.selectedDate, state.viewMode);
  try {
    dispatch({ type: 'SET_EVENTS', payload: await getEvents({ start, end }) });
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
  } finally {
    fetchingRef.current = false;
  }
}

/** Hook providing event CRUD operations with auto-reload. */
export function useEventActions() {
  const { selectedDate, viewMode } = useCalendar();
  const dispatch = useCalendarDispatch();
  const stateRef = useRef({ selectedDate, viewMode, dispatch });
  stateRef.current = { selectedDate, viewMode, dispatch };

  const reload = useCallback(async () => {
    const { selectedDate: date, viewMode: mode, dispatch: d } = stateRef.current;
    const { start, end } = getDateRangeForView(date, mode);
    d({ type: 'SET_EVENTS', payload: await getEvents({ start, end }) });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  }, []);

  return useMemo(() => ({
    addEvent: async (data) => { const e = await createEvent(data); await reload(); return e; },
    editEvent: async (id, data) => { const e = await updateEvent(id, data); await reload(); return e; },
    removeEvent: async (id) => { await deleteEvent(id); await reload(); },
    addException: async (id, date) => { await addExceptionDate(id, date); await reload(); },
  }), [reload]);
}
