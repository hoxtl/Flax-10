/**
 * Plan timeline free window row (gap >= 30min).
 * Context-aware:
 *   transit          → campus transit warning (no study suggestion)
 *   transit-partial  → transit note + remaining study tasks
 *   personal         → rest/breather nudge
 *   evening          → wind-down nudge
 *   study (default)  → responsive deadline-driven header + task suggestions
 *     30–59 min → short window: 1 task
 *     60+  min  → full window: up to 2 tasks
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getTasksThatFitGap, taskDurationMins } from "../../utils/taskUtils";
import { CAMPUS_DISPLAY } from "../../utils/planTimelineRows";
import { formatHour12h } from "../../utils/dateFormatUtils";
import { Sparkles } from "lucide-react";

function durationLabel(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatDueLabel(task) {
  if (!task?.due_date) return null;
  const due = new Date(task.due_date);
  const now = new Date();
  const diff = due - now;
  if (diff < 0) return "overdue";
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `due in ${h}h`;
  const d = Math.floor(diff / 86400000);
  return `due in ${d}d`;
}

/** Build a concise gap header based on context + upcoming task deadline. */
function buildStudyHeader(suggestedTask, durLabel) {
  if (!suggestedTask?.due_date) return `${durLabel} free`;
  const due = new Date(suggestedTask.due_date);
  const now = new Date();
  const diffMs = due - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const diffH = Math.floor(diffMs / 3600000);
  const title = suggestedTask.title?.length > 22
    ? suggestedTask.title.slice(0, 20) + "…"
    : suggestedTask.title;
  if (diffMs < 0) return `${title} — overdue`;
  if (diffH < 12) return `${title} due in ${diffH}h`;
  if (diffDays === 0) return `${title} due today`;
  if (diffDays === 1) return `${title} due tomorrow`;
  if (diffDays <= 3) return `${title} due in ${diffDays}d`;
  return `${durLabel} free`;
}

function deadlineDueLabel(deadline) {
  if (!deadline?.start_due_date) return null;
  const ms = new Date(deadline.start_due_date) - Date.now();
  if (ms <= 0) return "overdue";
  const d = Math.ceil(ms / 86400000);
  return d === 1 ? "due tomorrow" : `due in ${d}d`;
}

export function PlanFreeRow({
  row,
  suggestableTasks,
  deadlineSuggestions = [],
  onQuickStart,
  selectedDate,
  taskLists,
  styles,
  slotPopoverRef,
  slotPopoverRowId,
  setSlotPopoverRowId,
}) {
  const gapContext = row.gapContext || { type: "study" };
  const { suggested: suggestedTask, top3: top3Tasks } = getTasksThatFitGap(
    suggestableTasks || [],
    gapContext.type === "transit-partial" ? (gapContext.freeAfterTransit ?? row.minutes) : row.minutes,
  );
  const gapStartDate = getGapStartDate(selectedDate, row.gapStartMins);
  const isBestWindow = row.minutes >= 60;
  const durLabel = durationLabel(row.minutes);
  const timeStr = formatHour12h(
    Math.floor(DAY_START_HOUR + row.gapStartMins / 60),
    row.gapStartMins % 60
  );

  function startTask(task) {
    if (onQuickStart) onQuickStart(gapStartDate, row.minutes, task);
  }

  /* ── Transit: entire gap is travel time ── */
  if (gapContext.type === "transit") {
    const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
    const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span className={`${styles.planTimelineNode} ${styles.planTimelineNodeTransit}`} aria-hidden />
        </div>
        <div className={styles.planTimelineGapTransit}>
          <span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span>
          <div className={styles.planTimelineGapTransitBody}>
            <span className={styles.planTimelineGapTransitLabel}>
              {from} → {to}
            </span>
            <span className={styles.planTimelineGapTransitMeta}>
              ~{gapContext.transitMins}m travel · {durLabel} gap
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Transit-partial: travel + some study time ── */
  if (gapContext.type === "transit-partial") {
    const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
    const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
    const freeLabel = durationLabel(gapContext.freeAfterTransit || 0);
    const top1 = top3Tasks[0] || null;
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span className={`${styles.planTimelineNode} ${styles.planTimelineNodeTransit}`} aria-hidden />
        </div>
        <div className={styles.planTimelineGapTransitPartial}>
          <div className={styles.planTimelineGapTransitPartialTop}>
            <span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span>
            <span className={styles.planTimelineGapTransitLabel}>{from} → {to} (~{gapContext.transitMins}m)</span>
            <span className={styles.planTimelineGapTransitPartialFree}>{freeLabel} free after</span>
          </div>
          {top1 && (
            <div className={styles.planTimelineGapShortTaskRow}>
              <span className={styles.planTimelineGapTaskTitle} title={top1.title}>{top1.title}</span>
              <span className={styles.planTimelineGapTaskMeta}>{taskDurationMins(top1)}m</span>
              <button
                type="button"
                className={styles.planTimelineGapStartBtnSm}
                onClick={() => startTask(top1)}
                aria-label={`Start ${top1.title}`}
              >
                Slot in →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Personal: between social/routine/leisure events ── */
  if (gapContext.type === "personal") {
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={styles.planTimelineGapPersonal}>
          <span className={styles.planTimelineGapPersonalDur}>{durLabel} free</span>
        </div>
      </div>
    );
  }

  /* ── Evening: wind-down ── */
  if (gapContext.type === "evening") {
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={styles.planTimelineGapEvening}>
          <span className={styles.planTimelineGapEveningDur}>{durLabel} free</span>
        </div>
      </div>
    );
  }

  /* ── 60+ min: Study window ── */
  if (isBestWindow) {
    const top2 = top3Tasks.slice(0, 2);
    const header = buildStudyHeader(suggestedTask, durLabel);
    const topDeadline = deadlineSuggestions[0] ?? null;
    const revisionBlockMins = Math.min(Math.ceil(row.minutes / 25) * 25, 90);
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span
            className={`${styles.planTimelineNode} ${styles.planTimelineNodeBestWindow}`}
            aria-hidden
          />
        </div>
        <div className={styles.planTimelineGapBestWindow}>
          {/* Suggested panel header */}
          <div className={styles.planTimelineGapBestWindowHeader}>
            <div className={styles.planTimelineGapSuggestedHeaderLeft}>
              <Sparkles size={13} style={{ color: "#C4A46D", flexShrink: 0 }} aria-hidden />
              <span className={styles.planTimelineGapSuggestedLabel}>Suggested</span>
            </div>
            <span className={styles.planTimelineGapBestWindowDur}>{durLabel} free</span>
          </div>
          {/* Deadline suggestion */}
          {topDeadline && (
            <div className={styles.planTimelineGapSuggestedItem}>
              <div className={styles.planTimelineGapSuggestedItemLeft}>
                <span className={styles.planTimelineGapSuggestedDot} style={{ background: "#C4946D" }} />
                <span className={styles.planTimelineGapSuggestedItemTitle} title={topDeadline.assessment_title || topDeadline.title}>
                  {topDeadline.assessment_title || topDeadline.title}
                  {topDeadline.module_code ? ` · ${topDeadline.module_code}` : ""}
                </span>
                {deadlineDueLabel(topDeadline) && (
                  <span className={styles.planTimelineGapSuggestedItemCtx}>
                    · {deadlineDueLabel(topDeadline)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.planTimelineGapSlotInBtn}
                onClick={() => startTask({
                  title: `Revision: ${topDeadline.assessment_title || topDeadline.title}`,
                  estimated_blocks: Math.round(revisionBlockMins / 25),
                })}
                aria-label={`Slot in revision for ${topDeadline.assessment_title || topDeadline.title}`}
              >
                Slot in →
              </button>
            </div>
          )}
          {top2.map((task) => {
            const due = formatDueLabel(task);
            const mins = taskDurationMins(task);
            const isOverdue = due === "overdue";
            return (
              <div key={task.id ?? task.title} className={styles.planTimelineGapSuggestedItem}>
                <div className={styles.planTimelineGapSuggestedItemLeft}>
                  <span className={styles.planTimelineGapSuggestedDot} style={{ background: isOverdue ? "#C4746D" : "#C4A46D" }} />
                  <span className={styles.planTimelineGapSuggestedItemTitle} title={task.title}>
                    {task.title}
                  </span>
                  <span className={styles.planTimelineGapSuggestedItemCtx}>
                    · {mins}m{due ? ` · ${due}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.planTimelineGapSlotInBtn}
                  onClick={() => startTask(task)}
                  aria-label={`Slot in ${task.title}`}
                >
                  Slot in →
                </button>
              </div>
            );
          })}
          {!topDeadline && top2.length === 0 && (
            <span className={styles.planTimelineGapNoTasks}>{durLabel} to use however you like</span>
          )}
        </div>
      </div>
    );
  }

  /* ── 30–59 min: Short study window ── */
  const topDeadlineShort = deadlineSuggestions[0] ?? null;
  return (
    <div
      className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
      style={{ marginTop: row.spacingBeforePx || 0 }}
    >
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{timeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        <span className={styles.planTimelineNode} aria-hidden />
      </div>
      <div className={styles.planTimelineGapShortWindow}>
        <span className={styles.planTimelineGapShortDur}>{durLabel} window</span>
        {topDeadlineShort && !suggestedTask ? (
          <div className={styles.planTimelineGapShortTaskRow}>
            <div className={styles.planTimelineGapDeadlineInfo}>
              <span className={styles.planTimelineGapDeadlineChip}>
                {deadlineDueLabel(topDeadlineShort)}
              </span>
              <span className={styles.planTimelineGapTaskTitle}>
                {topDeadlineShort.assessment_title || topDeadlineShort.title}
              </span>
            </div>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask({
                title: `Revision: ${topDeadlineShort.assessment_title || topDeadlineShort.title}`,
                estimated_blocks: Math.max(1, Math.round(row.minutes / 25)),
              })}
              aria-label={`Schedule revision for ${topDeadlineShort.assessment_title || topDeadlineShort.title}`}
            >
              Schedule →
            </button>
          </div>
        ) : suggestedTask ? (
          <div className={styles.planTimelineGapShortTaskRow}>
            <span
              className={styles.planTimelineGapTaskTitle}
              title={suggestedTask.title}
            >
              {suggestedTask.title}
            </span>
            <span className={styles.planTimelineGapTaskMeta}>
              {taskDurationMins(suggestedTask)}m
            </span>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask(suggestedTask)}
              aria-label={`Start ${suggestedTask.title}`}
            >
              Slot in →
            </button>
          </div>
        ) : (
          <span className={styles.planTimelineGapNoTasks}>Catch your breath</span>
        )}
      </div>
    </div>
  );
}
