import { useCallback, useState } from "react";
import { formatTime, getNextFreeSlotToday, getAllFreeWindowsToday, isRoutineEvent } from "../utils/index";
import { extractBaseEventId } from "../../../components/Calendar/utils/eventUtils";

export function useHomepageReschedule({
  selectedDate,
  addEvent,
  removeEvent,
  loadEvents,
  showToast,
  refetchTasks,
  editEvent,
  sortedEvents,
  deleteTask,
  missedItems,
  overdueTasksForNow,
}) {
  const [replanLoading, setReplanLoading] = useState(false);

  const getDuration = (start, end) => Math.round((end - start) / 60000) || 25;

  const handleRescheduleTomorrow = useCallback(async (item) => {
    try {
      const start = new Date(item.start_time);
      const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const endTomorrow = new Date(tomorrow.getTime() + getDuration(start, end) * 60000);
      await addEvent({ title: item.title, description: item.description || "", start_time: tomorrow.toISOString(), end_time: endTomorrow.toISOString() });
      await removeEvent(extractBaseEventId(item.id));
      await loadEvents();
      showToast(`"${item.title}" re-scheduled for tomorrow at 9:00`);
    } catch {
      showToast("Couldn't re-schedule. Try again.");
    } finally {
      refetchTasks();
    }
  }, [selectedDate, addEvent, removeEvent, loadEvents, showToast, refetchTasks]);

  const handleReschedule = useCallback(async (item) => {
    const start = new Date(item.start_time);
    const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
    const slot = getNextFreeSlotToday(sortedEvents, selectedDate, getDuration(start, end));
    if (!slot) return handleRescheduleTomorrow(item);
    
    const baseId = extractBaseEventId(item.id);
    const optimistic = { ...item, start_time: slot.start.toISOString(), end_time: slot.end.toISOString() };
    removeEvent(item.id);
    addEvent(optimistic);
    showToast(`"${item.title}" → ${formatTime(slot.start.toISOString())}`);
    
    try {
      await editEvent(baseId, { start_time: slot.start.toISOString(), end_time: slot.end.toISOString() });
      await loadEvents();
    } catch {
      removeEvent(item.id);
      addEvent(item);
      showToast("Couldn't reschedule. Try again.");
    }
  }, [selectedDate, sortedEvents, handleRescheduleTomorrow, removeEvent, addEvent, showToast, editEvent, loadEvents]);

  const handleQuickStartGap = useCallback(async (gapStartDate, _gapMins, task) => {
    if (!task) return;
    try {
      const durationMins = (task.estimated_blocks || 1) * 25;
      const endDate = new Date(gapStartDate.getTime() + durationMins * 60000);
      await addEvent({ title: task.title, start_time: gapStartDate.toISOString(), end_time: endDate.toISOString(), description: task.description || "" });
      await loadEvents();
      showToast(`"${task.title}" added to schedule at ${formatTime(gapStartDate.toISOString())}`);
    } catch {
      showToast("Couldn't add to schedule. Try again.");
    }
  }, [addEvent, loadEvents, showToast]);

  const handleConflictAutoMove = useCallback(async (event, newStart, newEnd) => {
    try {
      await editEvent(extractBaseEventId(event.id), { start_time: newStart.toISOString(), end_time: newEnd.toISOString() });
      await loadEvents();
      showToast("Event moved to next available window.");
    } catch {
      showToast("Couldn't move event. Try again.");
    }
  }, [editEvent, loadEvents, showToast]);

  const handleConflictPushTomorrow = useCallback(async (event) => {
    if (!event?.start_time) return;
    try {
      const baseId = extractBaseEventId(event.id);
      const start = new Date(event.start_time);
      const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 25 * 60000);
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);
      const movedEnd = new Date(nextDay.getTime() + Math.max(25, getDuration(start, end)) * 60000);
      await editEvent(baseId, { start_time: nextDay.toISOString(), end_time: movedEnd.toISOString() });
      await loadEvents();
      showToast(`"${event.title}" moved to tomorrow.`, {
        actionLabel: "Undo", durationMs: 7000,
        onAction: async () => {
          try { await editEvent(baseId, { start_time: start.toISOString(), end_time: end.toISOString() }); await loadEvents(); showToast(`Undid move.`); } catch { showToast("Undo failed."); }
        },
      });
    } catch { showToast("Couldn't move to tomorrow."); }
  }, [editEvent, loadEvents, showToast]);

  const handleTimelineDelete = useCallback(async (eventLike) => {
    const eventObj = eventLike && typeof eventLike === "object" ? eventLike : null;
    try {
      if (eventObj?.source === "task" && eventObj?.external_id) {
        await deleteTask(eventObj.external_id);
        await Promise.all([loadEvents(), refetchTasks()]);
        showToast(`"${eventObj.title}" removed.`);
        return;
      }
      await removeEvent(extractBaseEventId(eventObj?.id ?? eventLike, eventObj));
      await loadEvents();
      showToast(`"${eventObj?.title || "Event"}" deleted.`);
    } catch { showToast("Couldn't delete item."); }
  }, [deleteTask, loadEvents, refetchTasks, removeEvent, showToast]);

  const handleReplanDay = useCallback(async () => {
    const missed = (missedItems || []).filter((item) => !isRoutineEvent(item));
    const overdue = overdueTasksForNow || [];
    if (!missed.length && !overdue.length) return showToast("Nothing to re-plan.");
    const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
    if (!windows.length) return showToast("No free windows left today.");
    
    setReplanLoading(true);
    try {
      const processReplanItems = async (items, windowCopies, isTask, assignedCountRef) => {
        for (const item of items) {
          const end = Number.isFinite(item.end_time) ? new Date(item.end_time) : new Date(new Date(item.start_time || new Date()).getTime() + 25 * 60000);
          const durationMins = isTask ? (item.estimated_blocks || 1) * 25 : getDuration(new Date(item.start_time), end);
          const win = windowCopies.find((w) => w.minutes >= durationMins);
          if (!win) continue;
          const slotEnd = new Date(win.start.getTime() + durationMins * 60000);
          if (isTask) {
            await addEvent({ title: item.title, description: item.description || "", start_time: win.start.toISOString(), end_time: slotEnd.toISOString() });
          } else {
            await editEvent(extractBaseEventId(item.id), { start_time: win.start.toISOString(), end_time: slotEnd.toISOString() });
          }
          win.start = slotEnd;
          win.minutes -= durationMins;
          assignedCountRef.current += 1;
        }
      };

      const winCopies = windows.map((w) => ({ start: new Date(w.start), end: new Date(w.end), minutes: w.minutes }));
      const assigned = { current: 0 };
      await processReplanItems([...missed].sort((a,b)=>new Date(a.start_time)-new Date(b.start_time)), winCopies, false, assigned);
      await processReplanItems(overdue, winCopies, true, assigned);
      await loadEvents();
      refetchTasks();
      showToast(assigned.current > 0 ? `Re-planned ${assigned.current} items.` : "No items fit.");
    } catch { showToast("Couldn't re-plan.");
    } finally { setReplanLoading(false); }
  }, [missedItems, overdueTasksForNow, selectedDate, sortedEvents, loadEvents, refetchTasks, showToast, addEvent, editEvent]);

  return { replanLoading, handleRescheduleTomorrow, handleReschedule, handleQuickStartGap, handleConflictAutoMove, handleConflictPushTomorrow, handleTimelineDelete, handleReplanDay };
}
