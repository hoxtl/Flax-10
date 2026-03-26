/*
 * Plan timeline single-event row.
 */

import { formatTime12h } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { isReadOnlyEvent } from "../../../../components/calendar/utils/eventUtils";
import { doesEventOverlapSleepWindow } from "../../../../components/settings/hooks/useSleepWarning";
import { getEventAccentColor } from "./helpers/eventAccent";
import { ConflictPopover, EventDuration, EventTagSlot } from "./parts/PlanEventRowParts";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

function getNextFreeRow(rows, row, durationMins) {
  return rows.find((candidate) => candidate.type === "free" && candidate.gapStartMins >= row.endMins && candidate.minutes >= durationMins) || null;
}

function getEventMeta(row, rows, getTag, sleepWindow) {
  const { item, durationMins } = row;
  const startTime = item.start_time ? formatTime12h(item.start_time) : "";
  const endTime = item.end_time && item.end_time !== item.start_time ? formatTime12h(item.end_time) : "";
  const tagName = getTag?.(item.tag)?.name ?? item.tag_name ?? "";
  return {
    startTime,
    endTime,
    title: stripEmojiFromTitle(item.title) || item.title,
    nextFreeRow: getNextFreeRow(rows, row, durationMins),
    accentColor: row.isOverlap ? "var(--event-accent-social)" : getEventAccentColor(item.title, tagName),
    isSleepTime: doesEventOverlapSleepWindow(
      sleepWindow?.sleepTime || "23:00",
      sleepWindow?.wakeTime || "07:00",
      item.start_time,
      item.end_time,
    ),
  };
}

function getCardClassName(styles, row) {
  return [styles.planTimelineCard, row.active ? styles.planTimelineCardNow : "", row.isPast ? styles.planTimelineCardPast : "", row.isOverlap ? styles.planTimelineCardOverlap : "", row.isRoutine ? styles.planTimelineCardRoutine : "", row.durationMins > 0 ? styles.planTimelineCardWithDuration : ""].filter(Boolean).join(" ");
}

function handleCardActivation(event, item, matchTask, isReadOnly, isOverlap, onCardClick, onEdit, onToggleConflict) {
  if (isOverlap && !isReadOnly) return onToggleConflict();
  if (onCardClick) return onCardClick(item, matchTask, event.currentTarget.getBoundingClientRect());
  if (!isReadOnly) onEdit?.(item, item.tag, event.currentTarget.getBoundingClientRect());
}

function getConflictHandlers({ item, durationMins, nextFreeRow, selectedDate, onConflictAutoMove, onPushTomorrow, onEdit, setConflictPopoverRowId }) {
  return {
    onAutoReschedule: () => nextFreeRow && onConflictAutoMove && (onConflictAutoMove(item, getGapStartDate(selectedDate, nextFreeRow.gapStartMins), new Date(getGapStartDate(selectedDate, nextFreeRow.gapStartMins).getTime() + durationMins * 60000)), setConflictPopoverRowId(null)),
    onMoveTomorrow: onPushTomorrow ? () => (onPushTomorrow(item), setConflictPopoverRowId(null)) : null,
    onEdit: () => (onEdit?.(item, item.tag), setConflictPopoverRowId(null)),
  };
}

export function PlanEventRow({ row, rows, taskLists, conflictPopoverRowId, conflictPopoverRef, setConflictPopoverRowId, onConflictAutoMove, onPushTomorrow, onEdit, onCardClick, onEventContextMenu, getTag, styles, sleepWindow, selectedDate }) {
  const isReadOnly = isReadOnlyEvent(row.item);
  const meta = getEventMeta(row, rows, getTag, sleepWindow);
  const showConflictPopover = conflictPopoverRowId === row.id && !isReadOnly;
  const minHeight = row.durationMins > 0 ? Math.max(56, Math.min(row.durationMins * 1.2, 180)) : 56;
  const onToggleConflict = () => setConflictPopoverRowId((currentId) => currentId === row.id ? null : row.id);
  const handlers = getConflictHandlers({ item: row.item, durationMins: row.durationMins, nextFreeRow: meta.nextFreeRow, selectedDate, onConflictAutoMove, onPushTomorrow, onEdit, setConflictPopoverRowId });
  const cardStyle = { '--card-accent': meta.accentColor, cursor: isReadOnly ? 'pointer' : undefined };
  return <TimelineRowLayout row={row} styles={styles} minHeight={minHeight} rowClassName={row.isPast && !row.active ? styles.planTimelineRowPast : ""}><TimelineGutter row={row} styles={styles} timeLabel={meta.startTime} /><TimelineSpineCell styles={styles} /><div className={styles.planTimelineCardWrap} ref={showConflictPopover ? conflictPopoverRef : undefined}><div role="button" tabIndex={0} className={getCardClassName(styles, row)} onContextMenu={(event) => !isReadOnly && (event.preventDefault(), event.stopPropagation(), onEventContextMenu?.(row.item, event.clientX, event.clientY))} onClick={(event) => handleCardActivation(event, row.item, row.matchTask, isReadOnly, row.isOverlap, onCardClick, onEdit, onToggleConflict)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), handleCardActivation(event, row.item, row.matchTask, isReadOnly, row.isOverlap, onCardClick, onEdit, onToggleConflict))} style={cardStyle}><div className={styles.planTimelineCardAccent} aria-hidden /><div className={styles.planTimelineCardBody}><div className={styles.planTimelineCardTimeStack}><div className={styles.planTimelineCardTimeRow}><span className={styles.planTimelineCardTimeSlot}>{meta.startTime}{row.item.end_time && meta.endTime !== meta.startTime ? ` – ${meta.endTime}` : ""}</span><EventTagSlot styles={styles} isOverlap={row.isOverlap} isReadOnly={isReadOnly} rowId={row.id} moduleCode={row.moduleCode} matchTask={row.matchTask} taskLists={taskLists} accentColor={meta.accentColor} onToggleConflictPopover={onToggleConflict} /></div><div className={styles.planTimelineCardTitleRow}><span className={styles.planTimelineCardTitle}>{meta.title}</span>{meta.isSleepTime ? <span className={styles.planTimelineSleepBadge} title="Scheduled during sleep hours" aria-label="Scheduled during sleep hours">😴</span> : null}</div></div></div><EventDuration styles={styles} durationMins={row.durationMins} /></div>{showConflictPopover ? <ConflictPopover styles={styles} nextFreeRow={meta.nextFreeRow} onAutoReschedule={handlers.onAutoReschedule} onMoveTomorrow={handlers.onMoveTomorrow} onEdit={handlers.onEdit} /> : null}</div></TimelineRowLayout>;
}
