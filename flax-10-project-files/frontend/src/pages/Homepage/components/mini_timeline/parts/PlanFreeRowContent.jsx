/*
 * Context-specific free-row content for the mini timeline.
 */

import { taskDurationMins } from "../../../utils/taskUtils";
import { CAMPUS_DISPLAY } from "../../../utils/planTimelineRows";
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/PlanFreeRowContent.jsx
import {
  formatGapDuration,
  getGapRecommendationTitle,
} from "../helpers/gapRowUtils";
=======
import { formatGapDuration, getGapRecommendationTitle } from "../helpers/gapRowUtils";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent.jsx

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
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/PlanFreeRowContent.jsx
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
=======
  return <button type="button" className={styles.planTimelineGapSkipBtn} onClick={() => onSkipTask(task.id)} aria-label={`Skip ${task.title}`} title="Skip — show next suggestion">✕</button>;
}

function StartButton({ styles, task, onStartTask }) {
  return <button type="button" className={styles.planTimelineGapStartBtnSm} onClick={() => onStartTask(task)} aria-label={`Start ${task.title}`}>Slot in →</button>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent.jsx
}

function TransitBody({ styles, gapContext, durationLabel }) {
  const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
  const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/PlanFreeRowContent.jsx
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
=======
  return <div className={styles.planTimelineGapTransit}><span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span><div className={styles.planTimelineGapTransitBody}><span className={styles.planTimelineGapTransitLabel}>{from} → {to}</span><span className={styles.planTimelineGapTransitMeta}>~{gapContext.transitMins}m travel · {durationLabel} gap</span></div></div>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent.jsx
}

function TransitPartialTask({ styles, task, onSkipTask, onStartTask }) {
  if (!task) return null;
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/PlanFreeRowContent.jsx
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
  return (
    <div className={styles.planTimelineGapTransitPartial}>
      <TransitPartialTop styles={styles} gapContext={gapContext} />
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
    <div className={getPassiveGapClassName(styles)}>
      <span className={styles.planTimelineGapRail} aria-hidden />
      <PassiveGapMain styles={styles} durationLabel={durationLabel} label={label} />
      <span className={styles.planTimelineGapRail} aria-hidden />
    </div>
  );
=======
  return <div className={styles.planTimelineGapShortTaskRow}><span className={styles.planTimelineGapTaskTitle} title={withUrgencyEmoji(task)}>{withUrgencyEmoji(task)}</span><span className={styles.planTimelineGapTaskMeta}>{taskDurationMins(task)}m</span><SkipButton styles={styles} task={task} onSkipTask={onSkipTask} /><StartButton styles={styles} task={task} onStartTask={onStartTask} /></div>;
}

function TransitPartialBody({ styles, gapContext, assignedTask, onSkipTask, onStartTask }) {
  const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
  const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
  return <div className={styles.planTimelineGapTransitPartial}><div className={styles.planTimelineGapTransitPartialTop}><span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span><span className={styles.planTimelineGapTransitLabel}>{from} → {to} (~{gapContext.transitMins}m)</span><span className={styles.planTimelineGapTransitPartialFree}>{formatGapDuration(gapContext.freeAfterTransit || 0)} free after</span></div><TransitPartialTask styles={styles} task={assignedTask} onSkipTask={onSkipTask} onStartTask={onStartTask} /></div>;
}

function PassiveGapBody({ styles, durationLabel, label }) {
  return <div className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}><span className={styles.planTimelineGapRail} aria-hidden /><div className={styles.planTimelineGapMain}><span className={styles.planTimelineGapLeadDot} aria-hidden /><span className={styles.planTimelineGapShortDur}>{durationLabel} free</span><span className={styles.planTimelineGapSeparator} aria-hidden>·</span><span className={styles.planTimelineGapNoTasks}>{label}</span></div><span className={styles.planTimelineGapRail} aria-hidden /></div>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent.jsx
}

function StudyActions({ styles, task, onSkipTask, onStartTask }) {
  if (!task) return <span className={styles.planTimelineGapRail} aria-hidden />;
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/PlanFreeRowContent.jsx
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
  const passiveLabel = getPassiveGapLabel(gapContext.type);
  if (gapContext.type === "transit") return <TransitBody styles={styles} gapContext={gapContext} durationLabel={durationLabel} />;
  if (gapContext.type === "transit-partial") return <TransitPartialBody styles={styles} gapContext={gapContext} assignedTask={assignedTask} onSkipTask={onSkipTask} onStartTask={onStartTask} />;
  if (passiveLabel) return <PassiveGapBody styles={styles} durationLabel={durationLabel} label={passiveLabel} />;
  return <StudyGapBody styles={styles} candidateTask={candidateTask} durationLabel={durationLabel} isBestGap={isBestGap} onSkipTask={onSkipTask} onStartTask={onStartTask} />;
}

function TransitPartialTop({ styles, gapContext }) {
  const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
  const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
  return (
    <div className={styles.planTimelineGapTransitPartialTop}>
      <span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span>
      <span className={styles.planTimelineGapTransitLabel}>{from} → {to} (~{gapContext.transitMins}m)</span>
      <span className={styles.planTimelineGapTransitPartialFree}>{formatGapDuration(gapContext.freeAfterTransit || 0)} free after</span>
    </div>
  );
}

function PassiveGapMain({ styles, durationLabel, label }) {
  return (
    <div className={styles.planTimelineGapMain}>
      <span className={styles.planTimelineGapLeadDot} aria-hidden />
      <GapDuration styles={styles} durationLabel={durationLabel} />
      <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
      <span className={styles.planTimelineGapNoTasks}>{label}</span>
    </div>
  );
}

function GapDuration({ styles, durationLabel }) {
  return (
    <span className={styles.planTimelineGapShortDur}>
      {durationLabel}
      <span className={styles.planTimelineGapFreeWord}> free</span>
    </span>
  );
}

function StudyGapBody({ styles, candidateTask, durationLabel, isBestGap, onSkipTask, onStartTask }) {
  return (
    <div className={getStudyGapClassName(styles, candidateTask, isBestGap)}>
      <span className={styles.planTimelineGapRail} aria-hidden />
      <StudyGapMain styles={styles} candidateTask={candidateTask} durationLabel={durationLabel} />
      <StudyActions styles={styles} task={candidateTask} onSkipTask={onSkipTask} onStartTask={onStartTask} />
    </div>
  );
}

function StudyGapMain({ styles, candidateTask, durationLabel }) {
  return (
    <div className={styles.planTimelineGapMain}>
      <span className={styles.planTimelineGapLeadDot} aria-hidden />
      <GapDuration styles={styles} durationLabel={durationLabel} />
      <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
      <StudyGapSuggestion styles={styles} candidateTask={candidateTask} />
    </div>
  );
}

function StudyGapSuggestion({ styles, candidateTask }) {
  const suggestion = candidateTask ? withUrgencyEmoji(candidateTask) : "Short breather";
  return <span className={styles.planTimelineGapSuggestionText} title={suggestion}>{suggestion}</span>;
}

function getPassiveGapLabel(type) {
  if (type === "personal") return "Short breather";
  return type === "evening" ? "Reset" : null;
}

function getPassiveGapClassName(styles) {
  return `${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`;
}

function getStudyGapClassName(styles, candidateTask, isBestGap) {
  return `${styles.planTimelineGapShortWindow} ${candidateTask ? styles.planTimelineGapShortWindowFeatured : ""} ${isBestGap ? styles.planTimelineGapShortWindowBest : ""} ${!candidateTask ? styles.planTimelineGapShortWindowNoActions : ""}`.trim();
=======
  return <><span className={styles.planTimelineGapRail} aria-hidden /><div className={styles.planTimelineGapActions}><span className={styles.planTimelineGapTaskMeta}>({taskDurationMins(task)}m)</span><SkipButton styles={styles} task={task} onSkipTask={onSkipTask} /><StartButton styles={styles} task={task} onStartTask={onStartTask} /></div></>;
}

export function PlanFreeRowContent({ styles, gapContext, durationLabel, assignedTask, candidateTask, isBestGap, onSkipTask, onStartTask }) {
  if (gapContext.type === "transit") return <TransitBody styles={styles} gapContext={gapContext} durationLabel={durationLabel} />;
  if (gapContext.type === "transit-partial") return <TransitPartialBody styles={styles} gapContext={gapContext} assignedTask={assignedTask} onSkipTask={onSkipTask} onStartTask={onStartTask} />;
  if (gapContext.type === "personal") return <PassiveGapBody styles={styles} durationLabel={durationLabel} label="Short breather" />;
  if (gapContext.type === "evening") return <PassiveGapBody styles={styles} durationLabel={durationLabel} label="Reset" />;
  return <div className={`${styles.planTimelineGapShortWindow} ${candidateTask ? styles.planTimelineGapShortWindowFeatured : ""} ${isBestGap ? styles.planTimelineGapShortWindowBest : ""} ${!candidateTask ? styles.planTimelineGapShortWindowNoActions : ""}`.trim()}><span className={styles.planTimelineGapRail} aria-hidden /><div className={styles.planTimelineGapMain}><span className={styles.planTimelineGapLeadDot} aria-hidden /><span className={styles.planTimelineGapShortDur}>{durationLabel} free</span><span className={styles.planTimelineGapSeparator} aria-hidden>·</span><span className={styles.planTimelineGapSuggestionText} title={candidateTask ? withUrgencyEmoji(candidateTask) : "Short breather"}>{candidateTask ? withUrgencyEmoji(candidateTask) : "Short breather"}</span></div><StudyActions styles={styles} task={candidateTask} onSkipTask={onSkipTask} onStartTask={onStartTask} /></div>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent.jsx
}
