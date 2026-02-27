/**
 * Plan timeline single event row (non-overlapping).
 */

import { Link } from "react-router-dom";
import { CalendarClock, RotateCw, Pencil } from "lucide-react";
import { formatTime, fmtDurationShort } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getTaskEmoji } from "../../../../utils/emojiMapping";

const MODULE_ACCENTS = ["#8C9A86", "#7B9BAD", "#A08B72", "#9A8CB0", "#8B9E6F", "#B07A7A", "#7AABB0"];

function getAccentColor(moduleCode) {
  return moduleCode ? MODULE_ACCENTS[moduleCode.charCodeAt(0) % MODULE_ACCENTS.length] : MODULE_ACCENTS[0];
}

export function PlanEventRow({
  row,
  rows,
  taskLists,
  conflictPopoverRowId,
  conflictPopoverRef,
  setConflictPopoverRowId,
  onConflictAutoMove,
  onEdit,
  onCardClick,
  onHarvestToggle,
  onToggleComplete,
  onReschedule,
  completedEventIds,
  selectedDate,
  isToday,
  styles,
}) {
  const { item, isPast, active, matchTask, isOverlap, isRoutine, moduleCode, durationMins } = row;
  const startTimeStr = item.start_time ? formatTime(item.start_time) : "";
  const endTimeStr = item.end_time && item.end_time !== item.start_time ? formatTime(item.end_time) : "";
  const titleClean = stripEmojiFromTitle(item.title);
  const showConflictPopover = conflictPopoverRowId === row.id;
  const nextFreeRow = isOverlap && onConflictAutoMove && rows.find((r) => r.type === "free" && r.gapStartMins >= row.endMins && r.minutes >= durationMins);
  const propMinHeight = durationMins > 0 ? Math.max(80, Math.min(durationMins * 1.4, 200)) : 80;
  const accentColor = getAccentColor(moduleCode);

  const handleConflictCardClick = () => {
    if (isOverlap) {
      setConflictPopoverRowId((id) => (id === row.id ? null : row.id));
      return;
    }
    if (onCardClick) onCardClick(item, matchTask);
    else onEdit?.(item, item.tag);
  };

  const handleAutoReschedule = () => {
    if (!nextFreeRow || !onConflictAutoMove) return;
    const start = getGapStartDate(selectedDate, nextFreeRow.gapStartMins);
    const end = new Date(start.getTime() + durationMins * 60000);
    onConflictAutoMove(item, start, end);
    setConflictPopoverRowId(null);
  };

  return (
    <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: propMinHeight }}>
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{startTimeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        <span key={`node-${row.id}-${getTaskEmoji(item.title, item.start_time)}`} className={styles.planTimelineNode} aria-hidden>
          {getTaskEmoji(item.title, item.start_time)}
        </span>
      </div>
      <div className={styles.planTimelineCardWrap} ref={showConflictPopover ? conflictPopoverRef : undefined}>
        <div
          role="button"
          tabIndex={0}
          className={`${styles.planTimelineCard} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isOverlap ? styles.planTimelineCardOverlap : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
          onClick={handleConflictCardClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConflictCardClick(); } }}
          title={item.end_time ? `${item.title} — ${startTimeStr} – ${endTimeStr}` : `${item.title} — ${startTimeStr}`}
          style={{ "--card-accent": accentColor }}
        >
          <div className={styles.planTimelineCardAccent} aria-hidden />
          <div className={styles.planTimelineCardBody}>
            <div className={styles.planTimelineCardTimeStack}>
              <div className={styles.planTimelineCardTimeRow}>
                <span className={styles.planTimelineCardTimeSlot}>
                  {startTimeStr}{item.end_time && endTimeStr !== startTimeStr ? ` – ${endTimeStr}` : ""}
                </span>
                <div className={styles.planTimelineCardTagsSlot}>
                  {isOverlap && (
                    <>
                      <span className={styles.planTimelineTimeConflictBadge}><span className={styles.planTimelineConflictIcon} aria-hidden>⚠️</span> Time conflict</span>
                      <button type="button" className={styles.planTimelineRescheduleBtn} onClick={(e) => { e.stopPropagation(); setConflictPopoverRowId((id) => (id === row.id ? null : row.id)); }} aria-label="Reschedule to next free window" title="Reschedule">
                        <CalendarClock size={14} strokeWidth={2} aria-hidden />
                        <span>Reschedule</span>
                      </button>
                    </>
                  )}
                  {moduleCode && (
                    <Link to={matchTask ? `/tasks?list=${matchTask.task_list}&module=${encodeURIComponent(moduleCode)}` : `/tasks?module=${encodeURIComponent(moduleCode)}`} className={styles.planTimelineModulePillLink} onClick={(e) => e.stopPropagation()}>
                      <span className={styles.planTimelineModulePill}>{moduleCode}</span>
                    </Link>
                  )}
                  {!moduleCode && matchTask?.task_list != null && (
                    <Link to={`/tasks?list=${matchTask.task_list}`} className={styles.planTimelineModulePillLink} onClick={(e) => e.stopPropagation()}>
                      <span className={styles.planTimelineModulePill}>{(taskLists || []).find((l) => String(l.id) === String(matchTask.task_list))?.name || "List"}</span>
                    </Link>
                  )}
                </div>
              </div>
              <span className={styles.planTimelineCardTitle}>{titleClean || item.title}</span>
            </div>
          </div>
          {durationMins > 0 && <span className={styles.planTimelineCardDurationPill}>{fmtDurationShort(durationMins)}</span>}
          {matchTask && onHarvestToggle && (
            <button type="button" className={styles.planTimelineCardCheck} onClick={(e) => { e.stopPropagation(); onHarvestToggle(matchTask, !matchTask.completed); }} aria-label={matchTask.completed ? "Mark incomplete" : "Mark done"} aria-pressed={matchTask.completed}>
              {matchTask.completed ? "✓" : ""}
            </button>
          )}
          {!matchTask && onToggleComplete && (
            <button type="button" className={`${styles.planTimelineEventCheck} ${completedEventIds.has(row.id) ? styles.planTimelineEventCheckDone : ""}`} onClick={(e) => { e.stopPropagation(); onToggleComplete(row.id); }} aria-label={completedEventIds.has(row.id) ? "Mark incomplete" : "Mark complete"} title={completedEventIds.has(row.id) ? "Completed" : "Mark as done"}>
              {completedEventIds.has(row.id) ? "✓" : ""}
            </button>
          )}
          {isPast && !completedEventIds.has(row.id) && !matchTask?.completed && onReschedule && isToday(selectedDate) && (
            <button type="button" className={styles.planTimelineMissedBtn} onClick={(e) => { e.stopPropagation(); onReschedule(item); }} title="Reschedule this missed session">
              Reschedule?
            </button>
          )}
        </div>
        {showConflictPopover && (
          <div className={styles.planTimelineConflictPopover}>
            <div className={styles.planTimelineConflictPopoverTitle}>Resolve conflict</div>
            <button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={handleAutoReschedule} disabled={!nextFreeRow}>
              <RotateCw size={14} strokeWidth={2} aria-hidden />
              <span>{nextFreeRow ? "Auto-Reschedule to Next Gap" : "No free window"}</span>
            </button>
            <button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={() => { onEdit?.(item, item.tag); setConflictPopoverRowId(null); }}>
              <Pencil size={14} strokeWidth={2} aria-hidden />
              <span>Manually Adjust</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
