/**
 * Plan timeline single event row (non-overlapping).
 * Design A — Minimal Editorial: coloured left-border accent by event type, no emoji nodes.
 */

import { Link } from "react-router-dom";
import { RotateCw, Pencil, AlertTriangle } from "lucide-react";
import { formatTime, fmtDurationShort } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";

/* Event type → accent colour mapping (seed data: Lecture, Routine, Practical, Study Session,
   Meeting, Gym, Wellness, KCLSU society events) */
const EVENT_ACCENTS = {
  lecture:  "#84A98C", // sage green — Lecture: module_name
  routine:  "#A0A09A", // slate     — Breakfast / Lunch / Dinner
  wellness: "#C0714E", // terracotta — Gym / Yoga / Run
  study:    "#7B9BAD", // steel blue — Study Session / Library
  social:   "#9A8CB0", // lavender  — KCLSU / Society / Social
  meeting:  "#B8956A", // warm amber — Meeting / Seminar / Tutor
  default:  "#A08B72", // warm brown — everything else
};

function getEventTypeKey(title, tagName) {
  const t = (title || "").toLowerCase();
  const tn = (tagName || "").toLowerCase();
  if (tn === "lecture" || /^lecture:/i.test(title)) return "lecture";
  if (tn === "routine" || /^(breakfast|lunch|dinner)$/i.test(title.trim())) return "routine";
  if (tn === "gym" || tn === "wellness" || /\b(gym|yoga|run|pilates|swim|detox)\b/.test(t))
    return "wellness";
  if (tn === "study session" || /\b(study|library|review|revision|maughan)\b/.test(t))
    return "study";
  if (tn === "meeting" || /\b(meeting|seminar|tutorial|office hours|tutor)\b/.test(t))
    return "meeting";
  if (/kclsu|society|social|flatmates|friends|girls/i.test(t)) return "social";
  return "default";
}

function getEventAccentColor(title, tagName) {
  return EVENT_ACCENTS[getEventTypeKey(title, tagName)] || EVENT_ACCENTS.default;
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
  getTag,
  styles,
}) {
  const { item, isPast, active, matchTask, isOverlap, isRoutine, moduleCode, durationMins } = row;
  const startTimeStr = item.start_time ? formatTime(item.start_time) : "";
  const endTimeStr =
    item.end_time && item.end_time !== item.start_time ? formatTime(item.end_time) : "";
  const titleClean = stripEmojiFromTitle(item.title);
  const showConflictPopover = conflictPopoverRowId === row.id;
  const nextFreeRow =
    isOverlap && onConflictAutoMove
      ? rows.find(
          (r) => r.type === "free" && r.gapStartMins >= row.endMins && r.minutes >= durationMins,
        )
      : null;
  const propMinHeight = durationMins > 0 ? Math.max(56, Math.min(durationMins * 1.2, 180)) : 56;

  /* Event type accent — terracotta for conflicts, otherwise type-based */
  const tagName = getTag?.(item.tag)?.name ?? item.tag_name ?? "";
  const accentColor = isOverlap ? "#C0714E" : getEventAccentColor(item.title, tagName);

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
    <div
      className={`${styles.planTimelineRow} ${isPast && !active ? styles.planTimelineRowPast : ""}`}
      style={{ marginTop: row.spacingBeforePx || 0, minHeight: propMinHeight }}
    >
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{startTimeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        {/* Minimal dot node — color matches card accent */}
        <span
          className={`${styles.planTimelineNode} ${styles.planTimelineNodeDot}`}
          style={{ "--node-color": accentColor }}
          aria-hidden
        />
      </div>
      <div
        className={styles.planTimelineCardWrap}
        ref={showConflictPopover ? conflictPopoverRef : undefined}
      >
        <div
          role="button"
          tabIndex={0}
          className={`${styles.planTimelineCard} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isOverlap ? styles.planTimelineCardOverlap : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
          onClick={handleConflictCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleConflictCardClick();
            }
          }}
          title={
            item.end_time
              ? `${item.title} — ${startTimeStr} – ${endTimeStr}`
              : `${item.title} — ${startTimeStr}`
          }
          style={{ "--card-accent": accentColor }}
        >
          {/* Coloured left-border accent */}
          <div className={styles.planTimelineCardAccent} aria-hidden />
          <div className={styles.planTimelineCardBody}>
            <div className={styles.planTimelineCardTimeStack}>
              <div className={styles.planTimelineCardTimeRow}>
                <span className={styles.planTimelineCardTimeSlot}>
                  {startTimeStr}
                  {item.end_time && endTimeStr !== startTimeStr ? ` – ${endTimeStr}` : ""}
                </span>
                <div className={styles.planTimelineCardTagsSlot}>
                  {isOverlap && (
                    <>
                      <span className={styles.planTimelineTimeConflictBadge}>
                        <AlertTriangle size={11} strokeWidth={2.5} aria-hidden />
                        Conflict
                      </span>
                      <button
                        type="button"
                        className={styles.planTimelineRescheduleBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConflictPopoverRowId((id) => (id === row.id ? null : row.id));
                        }}
                        aria-label="Reschedule to next free window"
                        title="Reschedule"
                      >
                        <RotateCw size={13} strokeWidth={2} aria-hidden />
                        <span>Fix it</span>
                      </button>
                    </>
                  )}
                  {moduleCode && (
                    <Link
                      to={
                        matchTask
                          ? `/tasks?list=${matchTask.task_list}&module=${encodeURIComponent(moduleCode)}`
                          : `/tasks?module=${encodeURIComponent(moduleCode)}`
                      }
                      className={styles.planTimelineModulePillLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={styles.planTimelineModulePill}
                        style={{ background: `${accentColor}22`, borderColor: `${accentColor}55`, color: accentColor }}
                      >
                        {moduleCode}
                      </span>
                    </Link>
                  )}
                  {!moduleCode && matchTask?.task_list != null && (
                    <Link
                      to={`/tasks?list=${matchTask.task_list}`}
                      className={styles.planTimelineModulePillLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className={styles.planTimelineModulePill}>
                        {(taskLists || []).find((l) => String(l.id) === String(matchTask.task_list))
                          ?.name || "List"}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              <span className={styles.planTimelineCardTitle}>{titleClean || item.title}</span>
            </div>
          </div>
          {durationMins > 0 && (
            <span className={styles.planTimelineCardDurationPill}>
              {fmtDurationShort(durationMins)}
            </span>
          )}
          {matchTask && onHarvestToggle && (
            <button
              type="button"
              className={styles.planTimelineCardCheck}
              onClick={(e) => {
                e.stopPropagation();
                onHarvestToggle(matchTask, !matchTask.completed);
              }}
              aria-label={matchTask.completed ? "Mark incomplete" : "Mark done"}
              aria-pressed={matchTask.completed}
            >
              {matchTask.completed ? "✓" : ""}
            </button>
          )}
          {!matchTask && onToggleComplete && (
            <button
              type="button"
              className={`${styles.planTimelineEventCheck} ${completedEventIds.has(row.id) ? styles.planTimelineEventCheckDone : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(row.id);
              }}
              aria-label={
                completedEventIds.has(row.id) ? "Mark incomplete" : "Mark complete"
              }
              title={completedEventIds.has(row.id) ? "Completed" : "Mark as done"}
            >
              {completedEventIds.has(row.id) ? "✓" : ""}
            </button>
          )}
          {isPast &&
            !completedEventIds.has(row.id) &&
            !matchTask?.completed &&
            onReschedule &&
            isToday(selectedDate) && (
              <button
                type="button"
                className={styles.planTimelineMissedBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(item);
                }}
                title="Reschedule this missed session"
              >
                Reschedule?
              </button>
            )}
        </div>
        {showConflictPopover && (
          <div className={styles.planTimelineConflictPopover}>
            <div className={styles.planTimelineConflictPopoverTitle}>Resolve conflict</div>
            <button
              type="button"
              className={styles.planTimelineConflictPopoverBtn}
              onClick={handleAutoReschedule}
              disabled={!nextFreeRow}
            >
              <RotateCw size={13} strokeWidth={2} aria-hidden />
              <span>{nextFreeRow ? "Auto-move to next gap" : "No free window"}</span>
            </button>
            <button
              type="button"
              className={styles.planTimelineConflictPopoverBtn}
              onClick={() => {
                onEdit?.(item, item.tag);
                setConflictPopoverRowId(null);
              }}
            >
              <Pencil size={13} strokeWidth={2} aria-hidden />
              <span>Manually adjust</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
