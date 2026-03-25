/*
 * Reusable subcomponents for event rows in the mini timeline.
 */

import { Link } from "react-router-dom";
import { AlertTriangle, Pencil, RotateCw } from "lucide-react";
import { fmtDurationShort } from "../../../utils/dateFormatUtils";
import Badge from "../../../../../components/common/Badge/Badge";

function ListPill({ taskLists, taskListId }) {
  const label = (taskLists || []).find((list) => String(list.id) === String(taskListId))?.name || "List";
  return <Link to={`/tasks?list=${taskListId}`} onClick={(event) => event.stopPropagation()}><Badge tone="default" pill>{label}</Badge></Link>;
}

function ModulePill({ styles, moduleCode, accentColor }) {
  const style = { background: `${accentColor}22`, borderColor: `${accentColor}55`, color: accentColor };
  return <span className={styles.planTimelineModulePill} style={style}>{moduleCode}</span>;
}

export function EventTagSlot({ styles, isOverlap, isReadOnly, rowId, moduleCode, matchTask, taskLists, accentColor, onToggleConflictPopover }) {
  return <div className={styles.planTimelineCardTagsSlot}>{isOverlap ? <><span className={styles.planTimelineTimeConflictBadge}><AlertTriangle size={11} strokeWidth={2.5} aria-hidden />Conflict</span>{isReadOnly ? null : <button type="button" className={styles.planTimelineRescheduleBtn} onClick={(event) => { event.stopPropagation(); onToggleConflictPopover(rowId); }} aria-label="Reschedule to next free window" title="Reschedule"><RotateCw size={13} strokeWidth={2} aria-hidden /><span>Fix it</span></button>}</> : null}{moduleCode ? <ModulePill styles={styles} moduleCode={moduleCode} accentColor={accentColor} /> : null}{!moduleCode && matchTask?.task_list != null ? <ListPill taskLists={taskLists} taskListId={matchTask.task_list} /> : null}</div>;
}

export function EventDuration({ styles, durationMins }) {
  if (durationMins <= 0) return null;
  return <span className={styles.planTimelineCardDurationPill}>{fmtDurationShort(durationMins)}</span>;
}

export function ConflictPopover({ styles, nextFreeRow, onAutoReschedule, onMoveTomorrow, onEdit }) {
  return <div className={styles.planTimelineConflictPopover}><div className={styles.planTimelineConflictPopoverTitle}>Resolve conflict</div><button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={onAutoReschedule} disabled={!nextFreeRow}><RotateCw size={13} strokeWidth={2} aria-hidden /><span>{nextFreeRow ? "Auto-move to next gap" : "No free window"}</span></button>{!nextFreeRow ? <button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={onMoveTomorrow} disabled={!onMoveTomorrow}><span>→ Move to tomorrow</span></button> : null}<button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={onEdit}><Pencil size={13} strokeWidth={2} aria-hidden /><span>Manually adjust</span></button></div>;
}
