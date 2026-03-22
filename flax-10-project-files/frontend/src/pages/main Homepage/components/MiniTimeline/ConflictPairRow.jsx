/*
 * Grouped row for overlapping events in the mini timeline.
 */

import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { isDuringSleepWindow } from "../../../../components/Settings/hooks/useSleepWarning";
import { isLecture } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getConflictTimeLabel } from "./helpers/conflictRowUtils";
import { getEventAccentColor } from "./helpers/eventAccent";
import { ConflictActions, ConflictCard } from "./parts/ConflictPairParts";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

const PRIORITY_ORDER = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function getMovableRows(items, rows, rowEndMins) {
  const movableWithGap = items.find((itemRow) => !itemRow.isReadOnly && rows.find((row) => row.type === "free" && row.gapStartMins >= rowEndMins && row.minutes >= itemRow.durationMins));
  const movable = movableWithGap || items.find((itemRow) => !itemRow.isReadOnly) || null;
  const freeRow = movableWithGap ? rows.find((row) => row.type === "free" && row.gapStartMins >= rowEndMins && row.minutes >= movableWithGap.durationMins) : null;
  return { movable, freeRow };
}

function enrichItemRows(items, getTag, sleepWindow) {
  return items.map((itemRow) => ({ ...itemRow, isReadOnly: isReadOnlyEvent(itemRow.item), accent: getEventAccentColor(itemRow.item.title, getTag?.(itemRow.item.tag)?.name ?? itemRow.item.tag_name ?? ""), isSleepTime: Boolean(itemRow.item.start_time && isDuringSleepWindow(sleepWindow?.sleepTime || "23:00", sleepWindow?.wakeTime || "07:00", new Date(itemRow.item.start_time))) }));
}

function handleActivate(event, itemRow, onCardClick, onEdit) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (onCardClick) return onCardClick(itemRow.item, null, rect);
  if (!itemRow.isReadOnly) onEdit?.(itemRow.item, itemRow.item.tag);
}

export function ConflictPairRow({ row, rows, onConflictAutoMove, onPushTomorrow, onCardClick, onEventContextMenu, onEdit, getTag, styles, selectedDate, sleepWindow }) {
  const items = enrichItemRows(row.items, getTag, sleepWindow);
  const { movable, freeRow } = getMovableRows(items, rows, row.endMins);
  const onAutoMove = () => freeRow && movable && onConflictAutoMove && onConflictAutoMove(movable.item, getGapStartDate(selectedDate, freeRow.gapStartMins), new Date(getGapStartDate(selectedDate, freeRow.gapStartMins).getTime() + movable.durationMins * 60000));
  return <TimelineRowLayout row={row} styles={styles}><TimelineGutter row={row} styles={styles} timeLabel={getConflictTimeLabel(row)} /><TimelineSpineCell styles={styles} /><div className={styles.planTimelineConflictPairWrap}><div className={styles.planTimelineConflictPairCards}>{items.map((itemRow) => <ConflictCard key={itemRow.id} itemRow={itemRow} styles={styles} accent={itemRow.accent} isSleepTime={itemRow.isSleepTime} onContextMenu={(event) => !itemRow.isReadOnly && (event.preventDefault(), event.stopPropagation(), onEventContextMenu?.(itemRow.item, event.clientX, event.clientY))} onActivate={(event) => handleActivate(event, itemRow, onCardClick, onEdit)} onMoveTomorrow={() => onPushTomorrow?.(itemRow.item)} canMoveTomorrow={!freeRow && onPushTomorrow && !itemRow.isReadOnly} />)}</div><ConflictActions styles={styles} items={items} freeRow={freeRow} movable={movable} onAutoMove={onAutoMove} onEdit={onEdit} /></div></TimelineRowLayout>;
}

export function getConflictPriorityRank(item) {
  return PRIORITY_ORDER[(item?.priority || "low").toLowerCase()] ?? 0;
}

function getEventDurationMins(item) {
  const start = new Date(item?.start_time);
  const rawEnd = item?.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
  const durationMins = Math.round((rawEnd - start) / 60000);
  return Math.max(25, durationMins || 25);
}

export function getMoveTomorrowWindow(item) {
  const start = new Date(item.start_time);
  const durationMins = getEventDurationMins(item);
  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  const end = new Date(nextDay.getTime() + durationMins * 60000);
  return { start: nextDay, end };
}

function isLectureTaggedEvent(item) {
  const tagName = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  return tagName === "lecture" || isLecture(item);
}

export function getConflictResolutionPlan({ row, rows, selectedDate, canRelocateEvent = () => true }) {
  const orderedItems = [...(row?.items || [])].sort((a, b) => {
    const priorityDiff = getConflictPriorityRank(b.item) - getConflictPriorityRank(a.item);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.item.start_time) - new Date(b.item.start_time);
  });

  const movableCandidates = [...orderedItems].reverse().filter((entry) => !isReadOnlyEvent(entry.item)).filter((entry) => !isLectureTaggedEvent(entry.item));
  if (!movableCandidates.length) return null;

  const candidateWithGap = movableCandidates.find((entry) => {
    const freeRow = rows.find((freeEntry) => freeEntry.type === "free" && freeEntry.gapStartMins >= row.endMins && freeEntry.minutes >= entry.durationMins);
    if (!freeRow) return false;
    const start = getGapStartDate(selectedDate, freeRow.gapStartMins);
    const end = new Date(start.getTime() + entry.durationMins * 60000);
    return canRelocateEvent(entry.item, start, end);
  });

  if (candidateWithGap) return buildAutoArrangePlan(candidateWithGap, row, rows, selectedDate);
  return buildTomorrowPlan(movableCandidates, canRelocateEvent);
}

function buildAutoArrangePlan(candidateWithGap, row, rows, selectedDate) {
  const freeRow = rows.find((freeEntry) => freeEntry.type === "free" && freeEntry.gapStartMins >= row.endMins && freeEntry.minutes >= candidateWithGap.durationMins);
  const start = getGapStartDate(selectedDate, freeRow.gapStartMins);
  const end = new Date(start.getTime() + candidateWithGap.durationMins * 60000);
  return { type: "auto-arrange", event: candidateWithGap.item, start, end, freeRow, movable: candidateWithGap };
}

function buildTomorrowPlan(movableCandidates, canRelocateEvent) {
  const tomorrowCandidate = movableCandidates.find((entry) => {
    const window = getMoveTomorrowWindow(entry.item);
    return canRelocateEvent(entry.item, window.start, window.end);
  });
  return tomorrowCandidate ? { event: tomorrowCandidate.item, movable: tomorrowCandidate, ...getMoveTomorrowWindow(tomorrowCandidate.item) } : null;
}
