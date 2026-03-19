import React from "react";
import { HourMarkRow } from "./HourMarkRow";
import { TinyGapRow } from "./TinyGapRow";
import { NowRow } from "./NowRow";
import { PlanFreeRow } from "./PlanFreeRow";
import { PlanEventRow } from "./PlanEventRow";
import { ConflictPairRow } from "./ConflictPairRow";

export function MiniTimelineRowRenderer({ row, rows, props, state }) {
  if (row.type === "hourMark") return <HourMarkRow row={row} styles={props.styles} />;
  if (row.type === "tinyGap") return <TinyGapRow row={row} styles={props.styles} />;
  if (row.type === "now") return <NowRow row={row} styles={props.styles} nowRowRef={props.nowRowRef} />;
  
  if (row.type === "free") return (
    <PlanFreeRow
      row={row} suggestableTasks={props.suggestableTasks} deadlineSuggestions={props.deadlineSuggestions}
      onQuickStart={props.onQuickStart} selectedDate={props.selectedDate} taskLists={props.taskLists}
      styles={props.styles} slotPopoverRef={state.slotPopoverRef} slotPopoverRowId={state.slotPopoverRowId}
      setSlotPopoverRowId={state.setSlotPopoverRowId} isBestGap={row.id === props.bestFreeRowId}
      assignedTask={props.assignedGapTasks[row.id]}
    />
  );

  if (row.type === "eventGroup") return (
    <ConflictPairRow
      row={row} rows={rows} onConflictAutoMove={props.onConflictAutoMove} onDelete={props.onDelete}
      onPushTomorrow={props.onPushTomorrow} onCardClick={props.onCardClick}
      onEventContextMenu={props.onEventContextMenu} onEdit={props.onEdit}
      getTag={props.getTag} styles={props.styles} selectedDate={props.selectedDate} sleepWindow={state.sleepWindow}
    />
  );

  return (
    <PlanEventRow
      row={row} rows={rows} taskLists={props.taskLists}
      conflictPopoverRowId={state.conflictPopoverRowId} conflictPopoverRef={state.conflictPopoverRef}
      setConflictPopoverRowId={state.setConflictPopoverRowId} onConflictAutoMove={props.onConflictAutoMove}
      onPushTomorrow={props.onPushTomorrow} onEdit={props.onEdit} onCardClick={props.onCardClick}
      onEventContextMenu={props.onEventContextMenu} onTaskToggle={props.onTaskToggle}
      onToggleComplete={props.onToggleComplete} onReschedule={props.onReschedule}
      completedEventIds={props.completedEventIds} selectedDate={props.selectedDate}
      isToday={props.isToday} getTag={props.getTag} styles={props.styles} sleepWindow={state.sleepWindow}
    />
  );
}
