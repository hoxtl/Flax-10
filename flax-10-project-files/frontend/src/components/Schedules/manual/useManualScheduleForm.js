/*
 * Manual schedule form state.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { filterScheduleEvents, toggleSelectedEventId } from './manualScheduleUtils';
import { loadScheduleTaggedEvents } from './loadScheduleTaggedEvents';

export function useManualScheduleForm() {
  const showToast = useToast();
  const state = useManualScheduleState();

  useEffect(() => {
    loadScheduleTaggedEvents(state.setEvents, state.setSelected, showToast);
  }, [showToast]);

  const filteredEvents = useMemo(
    () => filterScheduleEvents(state.events, state.eventSearch),
    [state.eventSearch, state.events],
  );

  return {
    ...state,
    filteredEvents,
    showToast,
    toggle: (id) => state.setSelected((value) => toggleSelectedEventId(value, id)),
  };
}

function useManualScheduleState() {
  const [title, setTitle] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState([]);
  return { title, setTitle, eventSearch, setEventSearch, events, setEvents, selected, setSelected };
}
