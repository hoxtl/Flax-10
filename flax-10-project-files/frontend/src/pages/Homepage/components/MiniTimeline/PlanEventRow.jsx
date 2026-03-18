/**
 * Plan timeline single event row (non-overlapping).
 * Design A — Minimal Editorial: coloured left-border accent by event type, no emoji nodes.
 */

import { Link } from "react-router-dom";
import { RotateCw, Pencil, AlertTriangle } from "lucide-react";
import { formatTime12h, fmtDurationShort } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { isDuringSleepWindow } from "../../../../components/Settings/hooks/useSleepWarning";

/* Event type → accent colour mapping */
const EVENT_ACCENTS = {
  lecture: "#7B9BAD", // dusty blue      — lectures/seminars/tutorials
  study: "#9A8CB0", // muted lavender  — study sessions/library/revision
  routine: "#B8956A", // warm amber      — meals/sleep
  wellness: "#7BB38E", // sage green      — gym/yoga/run/sport
  social: "#C0714E", // terracotta      — friends/coffee/pub/social
  society: "#C4906A", // warm dusty rose — KCLSU/society events
  meeting: "#A08B72", // warm brown      — meetings/office hours/tutor
  admin: "#C4A46D", // warm gold       — errands/laundry/medical/admin
  default: "#A08B72", // warm brown      — everything else
};

function getEventTypeKey(title, tagName) {
  const t = (title || "").toLowerCase();
  const tn = (tagName || "").toLowerCase();
  if (tn === "lecture" || /^lecture:/i.test(title)) return "lecture";
  if (tn === "routine" || /^(breakfast|lunch|dinner|sleep|brunch)$/i.test(t)) return "routine";
  if (tn === "wellness" || /\b(gym|yoga|run|pilates|swim|sport|exercise)\b/.test(t)) return "wellness";
  if (/kclsu|society/i.test(t) || tn === "society") return "society";
  if (/coffee|pub|cinema|birthday|facetime|restaurant|bar|flatmates|friends/i.test(t) || tn === "social") return "social";
  if (/\b(study|library|review|revision|coursework|essay|assignment)\b/.test(t) || /academic|study/i.test(tn)) return "study";
  if (/\b(meeting|seminar|tutorial|office hours|tutor)\b/.test(t)) return "meeting";
  if (/shop|tesco|laundry|clean|haircut|dentist|doctor|rent|bills/i.test(t) || tn === "admin") return "admin";
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
  onPushTomorrow,
  onEdit,
  onCardClick,
  onEventContextMenu,
  onTaskToggle,
  onToggleComplete,
  onReschedule,
  completedEventIds,
  selectedDate,
  isToday,
  getTag,
  styles,
  sleepWindow,
}) {
  const { item, isPast, active, matchTask, isOverlap, isRoutine, moduleCode, durationMins } = row;
  const startTimeStr = item.start_time ? formatTime12h(item.start_time) : "";
  const endTimeStr =
    item.end_time && item.end_time !== item.start_time ? formatTime12h(item.end_time) : "";
  const titleClean = stripEmojiFromTitle(item.title);
  const nextFreeRow =
    isOverlap && onConflictAutoMove
      ? rows.find(
        (r) => r.type === "free" && r.gapStartMins >= row.endMins && r.minutes >= durationMins,
      )
      : null;
  const propMinHeight = durationMins > 0 ? Math.max(56, Math.min(durationMins * 1.2, 180)) : 56;
  const isSleepTime =
    !!item.start_time &&
    isDuringSleepWindow(
      sleepWindow?.sleepTime || "23:00",
      sleepWindow?.wakeTime || "07:00",
      new Date(item.start_time),
    );

  /* Event type accent — terracotta for conflicts, otherwise type-based */
  const tagName = getTag?.(item.tag)?.name ?? item.tag_name ?? "";
  const accentColor = isOverlap ? "#C0714E" : getEventAccentColor(item.title, tagName);

  const isReadOnly = isReadOnlyEvent(item);
  const showConflictPopover = conflictPopoverRowId === row.id && !isReadOnly;

  const handleConflictCardClick = () => {
    if (isOverlap && !isReadOnly) {
      setConflictPopoverRowId((id) => (id === row.id ? null : row.id));
      return;
    }
    if (onCardClick) onCardClick(item, matchTask);
    else if (!isReadOnly) onEdit?.(item, item.tag);
  };

  const handleAutoReschedule = () => {
    if (!nextFreeRow || !onConflictAutoMove) return;
    const start = getGapStartDate(selectedDate, nextFreeRow.gapStartMins);
    const end = new Date(start.getTime() + durationMins * 60000);
    onConflictAutoMove(item, start, end);
    setConflictPopoverRowId(null);
  };

  const handleMoveTomorrow = () => {
    if (!onPushTomorrow) return;
    onPushTomorrow(item);
    setConflictPopoverRowId(null);
  };

  return (
    <div
      className={`${styles.planTimelineRow} ${isPast && !active ? styles.planTimelineRowPast : ""}`}
      style={{ marginTop: row.spacingBeforePx || 0, minHeight: propMinHeight }}
    >
      <div className={styles.planTimelineGutter}>
        {!row.hideTimeLabel ? <span className={styles.planTimelineTime}>{startTimeStr}</span> : null}
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div
        className={styles.planTimelineCardWrap}
        ref={showConflictPopover ? conflictPopoverRef : undefined}
      >
        <div
          role="button"
          tabIndex={0}
          className={`${styles.planTimelineCard} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isOverlap ? styles.planTimelineCardOverlap : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
          onContextMenu={(e) => {
            if (isReadOnly) return;
            e.preventDefault();
            e.stopPropagation();
            onEventContextMenu?.(item, e.clientX, e.clientY);
          }}
          onClick={(e) => {
            if (isReadOnly) return;
            if (isOverlap) {
              handleConflictCardClick();
              return;
            }
            if (onCardClick) {
              onCardClick(item, matchTask, e.currentTarget.getBoundingClientRect());
              return;
            }
            onEdit?.(item, item.tag, e.currentTarget.getBoundingClientRect());
          }}
          onKeyDown={(e) => {
            if (isReadOnly) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleConflictCardClick();
            }
          }}
          style={{ "--card-accent": accentColor, cursor: isReadOnly ? "default" : undefined }}
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
                      {!isReadOnly && (
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
                      )}
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
              <div className={styles.planTimelineCardTitleRow}>
                <span className={styles.planTimelineCardTitle}>{titleClean || item.title}</span>
                {isSleepTime && (
                  <span
                    className={styles.planTimelineSleepBadge}
                    title="Scheduled during sleep hours"
                    aria-label="Scheduled during sleep hours"
                  >
                    😴
                  </span>
                )}
              </div>
            </div>
          </div>
          {durationMins > 0 && (
            <span className={styles.planTimelineCardDurationPill}>
              {fmtDurationShort(durationMins)}
            </span>
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
            {!nextFreeRow && (
              <button
                type="button"
                className={styles.planTimelineConflictPopoverBtn}
                onClick={handleMoveTomorrow}
                disabled={!onPushTomorrow}
              >
                <span>→ Move to tomorrow</span>
              </button>
            )}
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
