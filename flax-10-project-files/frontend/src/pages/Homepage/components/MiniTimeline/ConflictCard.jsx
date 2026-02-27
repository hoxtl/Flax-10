/**
 * Single card in plan timeline event group (overlapping events).
 */

import { Link } from "react-router-dom";
import { CalendarClock, RotateCw, Pencil } from "lucide-react";
import { formatTime, fmtDurationShort } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";

export function ConflictCard({
  r,
  rows,
  taskLists,
  conflictPopoverRowId,
  conflictPopoverRef,
  setConflictPopoverRowId,
  onConflictAutoMove,
  onEdit,
  getTag,
  styles,
  selectedDate,
}) {
  const { item, isPast, active, matchTask, isRoutine, moduleCode, durationMins } = r;
  const startTimeStr = item.start_time ? formatTime(item.start_time) : "";
  const endTimeStr = item.end_time && item.end_time !== item.start_time ? formatTime(item.end_time) : "";
  const titleClean = stripEmojiFromTitle(item.title);
  const showConflictPopover = conflictPopoverRowId === r.id;
  const nextFreeRow = onConflictAutoMove && rows.find((fr) => fr.type === "free" && fr.gapStartMins >= r.endMins && fr.minutes >= durationMins);

  const handleConflictCardClick = () => setConflictPopoverRowId((id) => (id === r.id ? null : r.id));
  const handleAutoReschedule = () => {
    if (!nextFreeRow || !onConflictAutoMove) return;
    const start = getGapStartDate(selectedDate, nextFreeRow.gapStartMins);
    const end = new Date(start.getTime() + durationMins * 60000);
    onConflictAutoMove(item, start, end);
    setConflictPopoverRowId(null);
  };

  return (
    <div key={r.id} className={styles.planTimelineConflictCardWrap} ref={showConflictPopover ? conflictPopoverRef : undefined}>
      <div
        role="button"
        tabIndex={0}
        className={`${styles.planTimelineCard} ${styles.planTimelineCardConflict} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
        onClick={handleConflictCardClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConflictCardClick(); } }}
        title={item.end_time ? `${item.title} — ${startTimeStr} – ${endTimeStr}` : `${item.title} — ${startTimeStr}`}
      >
        <div className={styles.planTimelineCardBody}>
          <div className={styles.planTimelineCardTimeStack}>
            <div className={styles.planTimelineCardTimeRow}>
              <span className={styles.planTimelineCardTimeSlot}>
                {startTimeStr}{item.end_time && endTimeStr !== startTimeStr ? ` – ${endTimeStr}` : ""}
              </span>
              <div className={styles.planTimelineCardTagsSlot}>
                <span className={styles.planTimelineTimeConflictBadge}><span className={styles.planTimelineConflictIcon} aria-hidden>⚠️</span> Time conflict</span>
                <button type="button" className={styles.planTimelineRescheduleBtn} onClick={(e) => { e.stopPropagation(); setConflictPopoverRowId((id) => (id === r.id ? null : r.id)); }} aria-label="Reschedule" title="Reschedule">
                  <CalendarClock size={14} strokeWidth={2} aria-hidden />
                  <span>Reschedule</span>
                </button>
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
  );
}
