/*
 * Type-based row renderer for the mini timeline.
 */

import { ConflictPairRow } from "./ConflictPairRow";
import { HourMarkRow } from "./HourMarkRow";
import { NowRow } from "./NowRow";
import { PlanEventRow } from "./PlanEventRow";
import { PlanFreeRow } from "./PlanFreeRow";
import { TinyGapRow } from "./TinyGapRow";

function renderStaticRow(row, styles, attachNowRow) {
  if (row.type === "hourMark") return <HourMarkRow row={row} styles={styles} />;
  if (row.type === "tinyGap") return <TinyGapRow row={row} styles={styles} />;
  return <NowRow row={row} styles={styles} nowRowRef={attachNowRow} />;
}

function renderFreeRow(row, props) {
  return <PlanFreeRow row={row} deadlineSuggestions={props.gapDeadlineFallbacks[row.id] ? [props.gapDeadlineFallbacks[row.id]] : []} onQuickStart={props.onQuickStart} selectedDate={props.selectedDate} styles={props.styles} slotPopoverRef={props.slotPopoverRef} slotPopoverRowId={props.slotPopoverRowId} setSlotPopoverRowId={props.setSlotPopoverRowId} isBestGap={row.id === props.bestFreeRowId} assignedTask={props.assignedGapTasks.map[row.id] || null} nextAssignedTask={props.assignedGapTasks.nextMap[row.id] || null} onSkipTask={(taskId) => props.onSkipGapTask(row.id, taskId)} />;
}

function renderConflictRow(row, rows, props) {
  return <ConflictPairRow row={row} rows={rows} onConflictAutoMove={props.onConflictAutoMove} onPushTomorrow={props.onPushTomorrow} onCardClick={props.onCardClick} onEventContextMenu={props.onEventContextMenu} onEdit={props.onEdit} getTag={props.getTag} styles={props.styles} selectedDate={props.selectedDate} sleepWindow={props.sleepWindow} />;
}

function renderEventRow(row, rows, props) {
  return <PlanEventRow row={row} rows={rows} taskLists={props.taskLists} conflictPopoverRowId={props.conflictPopoverRowId} conflictPopoverRef={props.conflictPopoverRef} setConflictPopoverRowId={props.setConflictPopoverRowId} onConflictAutoMove={props.onConflictAutoMove} onPushTomorrow={props.onPushTomorrow} onEdit={props.onEdit} onCardClick={props.onCardClick} onEventContextMenu={props.onEventContextMenu} getTag={props.getTag} styles={props.styles} sleepWindow={props.sleepWindow} selectedDate={props.selectedDate} />;
}

export function MiniTimelineRowRenderer({ row, rows, props }) {
  if (row.type === "hourMark" || row.type === "tinyGap" || row.type === "now") return renderStaticRow(row, props.styles, props.attachNowRow);
  if (row.type === "free") return renderFreeRow(row, props);
  if (row.type === "eventGroup") return renderConflictRow(row, rows, props);
  return renderEventRow(row, rows, props);
}
