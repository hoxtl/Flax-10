/**
 * Plan timeline free window row (gap >= 30min).
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getTasksThatFitGap } from "../../utils/taskUtils";

function getGapContext(gapStartMins, minutes) {
  const gapHour = DAY_START_HOUR + Math.floor(gapStartMins / 60);
  if (gapHour < 12) return minutes >= 60 ? "Deep Work" : "Lecture Review";
  if (gapHour < 17) return minutes >= 60 ? "Assignment" : "Email / Admin";
  return "Review Notes";
}

function getConversationalLabel(minutes) {
  const durationStr = minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ""}`.trim()
    : `${minutes}m`;
  if (minutes >= 60) return `${durationStr} free`;
  if (minutes >= 30) return `${durationStr} window`;
  return `${durationStr} break`;
}

export function PlanFreeRow({ row, suggestableTasks, onQuickStart, selectedDate, taskLists, styles, slotPopoverRef, slotPopoverRowId, setSlotPopoverRowId }) {
  const durationStr = row.minutes >= 60
    ? `${Math.floor(row.minutes / 60)}h ${row.minutes % 60 ? `${row.minutes % 60}m` : ""}`.trim()
    : `${row.minutes}m`;
  const { suggested: suggestedTask, top3: top3Tasks } = getTasksThatFitGap(suggestableTasks || [], row.minutes);
  const gapStartDate = getGapStartDate(selectedDate, row.gapStartMins);
  const showSlotPopover = slotPopoverRowId === row.id;
  const gapContext = getGapContext(row.gapStartMins, row.minutes);
  const conversationalLabel = getConversationalLabel(row.minutes);

  return (
    <div
      key={row.id}
      className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
      style={{ marginTop: row.spacingBeforePx || 0 }}
    >
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>
          {String(Math.floor(DAY_START_HOUR + row.gapStartMins / 60)).padStart(2, "0")}:{String(row.gapStartMins % 60).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        <span className={styles.planTimelineNode} aria-hidden />
      </div>
      <div
        className={`${styles.planTimelineFreeWindow} ${styles.planTimelineFreeWindowDashed}`}
        ref={showSlotPopover ? slotPopoverRef : undefined}
      >
        <span className={styles.planTimelineGapContextChip}>{gapContext}</span>
        {suggestedTask ? (
          <span className={styles.planTimelineGapSlotCta} title={suggestedTask.title}>
            <strong>{suggestedTask.title}</strong>
          </span>
        ) : (
          <span className={styles.planTimelineFreeWindowDuration} title={conversationalLabel}>
            {conversationalLabel}
          </span>
        )}
        <span className={styles.planTimelineGapPlusIcon} aria-hidden>+</span>
        {onQuickStart && (
          <div className={styles.planTimelineFreeWindowActions}>
            <button
              type="button"
              className={styles.planTimelineFreeBtnQuickSlot}
              onClick={(e) => { e.stopPropagation(); setSlotPopoverRowId((id) => (id === row.id ? null : row.id)); }}
              aria-label="Choose a task to slot"
              title="Slot task"
            >
              +
            </button>
          </div>
        )}
        {showSlotPopover && top3Tasks.length > 0 && (
          <div className={styles.planTimelineSlotPopover}>
            <div className={styles.planTimelineSlotPopoverTitle}>Slot a task</div>
            {top3Tasks.map((t) => (
              <button
                key={t.id ?? t.title}
                type="button"
                className={styles.planTimelineSlotPopoverItem}
                onClick={(e) => { e.stopPropagation(); onQuickStart(gapStartDate, row.minutes, t); setSlotPopoverRowId(null); }}
              >
                <span className={styles.planTimelineSlotPopoverItemTitle} title={t.title}>{t.title}</span>
                <span className={styles.planTimelineSlotPopoverItemMeta}>{(t.estimated_blocks || 1) * 25}m</span>
              </button>
            ))}
          </div>
        )}
        {showSlotPopover && top3Tasks.length === 0 && (
          <div className={styles.planTimelineSlotPopover}>
            <div className={styles.planTimelineSlotPopoverTitle}>Slot a task</div>
            <div className={styles.planTimelineSlotPopoverEmpty}>No tasks fit this window.</div>
          </div>
        )}
      </div>
    </div>
  );
}
