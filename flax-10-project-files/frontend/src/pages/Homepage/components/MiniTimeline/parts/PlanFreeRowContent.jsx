/*
 * Context-specific free-row content for the mini timeline.
 */

import { taskDurationMins } from "../../../utils/taskUtils";
import { CAMPUS_DISPLAY } from "../../../utils/planTimelineRows";
import {
  formatGapDuration,
  getGapRecommendationTitle,
} from "../helpers/gapRowUtils";

function isOverdue(task) {
  return Boolean(task?.due_date && new Date(task.due_date) < new Date());
}

function isUrgent(task) {
  return String(task?.priority || "").toLowerCase() === "urgent";
}

function withUrgencyEmoji(task) {
  const title = getGapRecommendationTitle(task);
  return isOverdue(task) || isUrgent(task) ? `❗ ${title}` : title;
}

function SkipButton({ styles, task, onSkipTask }) {
  if (!onSkipTask || !task?.id) return null;
  return (
    <button
      type="button"
      className={styles.planTimelineGapSkipBtn}
      onClick={() => onSkipTask(task.id)}
      aria-label={`Skip ${task.title}`}
      title="Skip — show next suggestion"
    >
      ✕
    </button>
  );
}

function StartButton({ styles, task, onStartTask }) {
  return (
    <button
      type="button"
      className={styles.planTimelineGapStartBtnSm}
      onClick={() => onStartTask(task)}
      aria-label={`Start ${task.title}`}
    >
      Slot in →
    </button>
  );
}

function TransitBody({ styles, gapContext, durationLabel }) {
  const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
  const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
  return (
    <div className={styles.planTimelineGapTransit}>
      <span className={styles.planTimelineGapTransitIcon} aria-hidden>
        ↗
      </span>
      <div className={styles.planTimelineGapTransitBody}>
        <span className={styles.planTimelineGapTransitLabel}>
          {from} → {to}
        </span>
        <span className={styles.planTimelineGapTransitMeta}>
          ~{gapContext.transitMins}m travel · {durationLabel} gap
        </span>
      </div>
    </div>
  );
}

function TransitPartialTask({ styles, task, onSkipTask, onStartTask }) {
  if (!task) return null;
  return (
    <div className={styles.planTimelineGapShortTaskRow}>
      <span
        className={styles.planTimelineGapTaskTitle}
        title={withUrgencyEmoji(task)}
      >
        {withUrgencyEmoji(task)}
      </span>
      <span className={styles.planTimelineGapTaskMeta}>
        {taskDurationMins(task)}m
      </span>
      <SkipButton styles={styles} task={task} onSkipTask={onSkipTask} />
      <StartButton styles={styles} task={task} onStartTask={onStartTask} />
    </div>
  );
}

function TransitPartialBody({
  styles,
  gapContext,
  assignedTask,
  onSkipTask,
  onStartTask,
}) {
  const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
  const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
  return (
    <div className={styles.planTimelineGapTransitPartial}>
      <div className={styles.planTimelineGapTransitPartialTop}>
        <span className={styles.planTimelineGapTransitIcon} aria-hidden>
          ↗
        </span>
        <span className={styles.planTimelineGapTransitLabel}>
          {from} → {to} (~{gapContext.transitMins}m)
        </span>
        <span className={styles.planTimelineGapTransitPartialFree}>
          {formatGapDuration(gapContext.freeAfterTransit || 0)} free after
        </span>
      </div>
      <TransitPartialTask
        styles={styles}
        task={assignedTask}
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    </div>
  );
}

function PassiveGapBody({ styles, durationLabel, label }) {
  return (
    <div
      className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}
    >
      <span className={styles.planTimelineGapRail} aria-hidden />
      <div className={styles.planTimelineGapMain}>
        <span className={styles.planTimelineGapLeadDot} aria-hidden />
        <span className={styles.planTimelineGapShortDur}>
          {durationLabel}
          <span className={styles.planTimelineGapFreeWord}> free</span>
        </span>
        <span className={styles.planTimelineGapSeparator} aria-hidden>
          ·
        </span>
        <span className={styles.planTimelineGapNoTasks}>{label}</span>
      </div>
      <span className={styles.planTimelineGapRail} aria-hidden />
    </div>
  );
}

function StudyActions({ styles, task, onSkipTask, onStartTask }) {
  if (!task) return <span className={styles.planTimelineGapRail} aria-hidden />;
  return (
    <>
      <span className={styles.planTimelineGapRail} aria-hidden />
      <div className={styles.planTimelineGapActions}>
        <span className={styles.planTimelineGapTaskMeta}>
          ({taskDurationMins(task)}m)
        </span>
        <SkipButton styles={styles} task={task} onSkipTask={onSkipTask} />
        <StartButton styles={styles} task={task} onStartTask={onStartTask} />
      </div>
    </>
  );
}

export function PlanFreeRowContent({
  styles,
  gapContext,
  durationLabel,
  assignedTask,
  candidateTask,
  isBestGap,
  onSkipTask,
  onStartTask,
}) {
  if (gapContext.type === "transit")
    return (
      <TransitBody
        styles={styles}
        gapContext={gapContext}
        durationLabel={durationLabel}
      />
    );
  if (gapContext.type === "transit-partial")
    return (
      <TransitPartialBody
        styles={styles}
        gapContext={gapContext}
        assignedTask={assignedTask}
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    );
  if (gapContext.type === "personal")
    return (
      <PassiveGapBody
        styles={styles}
        durationLabel={durationLabel}
        label="Short breather"
      />
    );
  if (gapContext.type === "evening")
    return (
      <PassiveGapBody
        styles={styles}
        durationLabel={durationLabel}
        label="Reset"
      />
    );
  return (
    <div
      className={`${styles.planTimelineGapShortWindow} ${candidateTask ? styles.planTimelineGapShortWindowFeatured : ""} ${isBestGap ? styles.planTimelineGapShortWindowBest : ""} ${!candidateTask ? styles.planTimelineGapShortWindowNoActions : ""}`.trim()}
    >
      <span className={styles.planTimelineGapRail} aria-hidden />
      <div className={styles.planTimelineGapMain}>
        <span className={styles.planTimelineGapLeadDot} aria-hidden />
        <span className={styles.planTimelineGapShortDur}>
          {durationLabel}
          <span className={styles.planTimelineGapFreeWord}> free</span>
        </span>
        <span className={styles.planTimelineGapSeparator} aria-hidden>
          ·
        </span>
        <span
          className={styles.planTimelineGapSuggestionText}
          title={
            candidateTask ? withUrgencyEmoji(candidateTask) : "Short breather"
          }
        >
          {candidateTask ? withUrgencyEmoji(candidateTask) : "Short breather"}
        </span>
      </div>
      <StudyActions
        styles={styles}
        task={candidateTask}
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    </div>
  );
}
