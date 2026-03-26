/*
 * Task timeline state hooks for drag and drop.
 */

import { useMemo } from "react";
import { DAY_MS, buildWeeks, getTimelineAnchor, placeTasksIntoWeeks } from "../utils/taskTimelineUtils";

function createDragOver(styles) {
  return (event) => { event.preventDefault(); event.currentTarget.classList.add(styles.timelineCellDropTarget); };
}

function createDragLeave(styles) {
  return (event) => { event.currentTarget.classList.remove(styles.timelineCellDropTarget); };
}

function createDrop(onUpdate, styles) {
  return (event, timestamp) => {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.timelineCellDropTarget);
    const taskId = event.dataTransfer.getData("text/plain");
    const date = new Date(timestamp);
    date.setHours(12, 0, 0, 0);
    if (taskId) onUpdate(Number(taskId), { due_date: date.toISOString() });
  };
}

function createDropWidget(onUpdate, styles) {
  return (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.widgetListDropTarget);
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onUpdate(Number(taskId), { due_date: null });
  };
}

export function useDragHandlers(onUpdate, styles) {
  return { onDragOver: createDragOver(styles), onDragLeave: createDragLeave(styles), onDrop: createDrop(onUpdate, styles), onDropWidget: createDropWidget(onUpdate, styles) };
}

export function useTaskTimelineState(tasks, page) {
  const anchor = useMemo(() => getTimelineAnchor(), []);
  const weeks = useMemo(() => buildWeeks(anchor), [anchor]);
  const placed = useMemo(() => placeTasksIntoWeeks(tasks, weeks), [tasks, weeks]);
  const unscheduled = useMemo(
    () => tasks.filter((task) => !task.due_date && !task.completed && task.status !== "done"),
    [tasks],
  );
  const visible = weeks.slice(page * 3, (page + 1) * 3);
  return { weeks, placed, unscheduled, visible, dayMs: DAY_MS };
}
