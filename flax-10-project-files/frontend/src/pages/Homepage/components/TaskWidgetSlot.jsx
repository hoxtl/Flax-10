/**
 * Task widget slot — Today's tasks with stagger animation, ring progress, on-track status.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { CheckSquare, Check } from "lucide-react";
import EmptyStateCard from "../../../components/EmptyStateCard";
import AllTasksCompleteCard from "../../../components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { getModulePillColors } from "./ModulePill";

const VISIBLE_COUNT = 5;

const CATEGORY_COLOURS = {
  UNIVERSITY: { bg: "#EDF4FC", text: "#4A6D8C", dot: "#7BA3C4" },
  HEALTH:     { bg: "#EFF7F0", text: "#4A7C5A", dot: "#7BB38E" },
  PERSONAL:   { bg: "#F5F0E8", text: "#736048", dot: "#A89279" },
  WORK:       { bg: "#FFF4EE", text: "#8C5D3F", dot: "#C49070" },
  FINANCE:    { bg: "#F0EDE8", text: "#6B6048", dot: "#A89070" },
  STUDY:      { bg: "#F3F0FF", text: "#5B4A8A", dot: "#8B7BB8" },
  default:    { bg: "#F5F0E8", text: "#736048", dot: "#A89279" },
};

const MODULE_CODE_RE = /^[A-Z]{2,4}\d{3,4}$/;

function getCategoryStyle(label) {
  if (!label) return CATEGORY_COLOURS.default;
  const key = label.toUpperCase().trim();
  if (MODULE_CODE_RE.test(key)) {
    const c = getModulePillColors(key);
    return { bg: c.bg, text: c.text, dot: c.accent };
  }
  return CATEGORY_COLOURS[key] || CATEGORY_COLOURS.default;
}

function getRingColor(pct) {
  if (pct >= 70) return "#5A8C6A";
  if (pct >= 30) return "#C4904A";
  return "#A86060";
}

function getTrackStatus(items) {
  if (!items || items.length === 0) return null;
  const pct = items.filter((t) => t.completed).length / items.length;
  if (pct >= 0.8) return "ahead";
  if (pct >= 0.4) return "on-track";
  return "behind";
}

function getEstTime(items) {
  const incomplete = items.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;
  const totalMin = incomplete.reduce((sum, t) => sum + (t.estimated_minutes || 25), 0);
  if (totalMin < 60) return `~${totalMin}m left`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `~${h}h ${m}m left` : `~${h}h left`;
}

const RING_R = 11;
const RING_CIRC = 2 * Math.PI * RING_R;

const TRACK_CONFIG = {
  ahead:        { label: "Ahead",    dot: "#5A8C6A", text: "#4A7C5A", bg: "#EFF7F0" },
  "on-track":   { label: "On Track", dot: "#C4904A", text: "#8C6D3F", bg: "#FFF4EE" },
  behind:       { label: "Behind",   dot: "#A86060", text: "#7A4A4A", bg: "#F5E8E8" },
};

const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } },
};

export function TaskWidgetSlot({
  styles,
  displayName,
  isToday,
  taskWidgetOverdueCount,
  taskWidgetSpineCompletedPct,
  taskWidgetItemsOnly,
  taskWidgetList,
  showAllTaskWidgetTasks,
  setShowAllTaskWidgetTasks,
  getTaskCategoryPill,
  getTaskCategoryColor,
  handleTaskWidgetComplete,
  taskWidgetRef,
  hasTimerSession,
  onStartFocus,
}) {
  const visibleList = showAllTaskWidgetTasks ? taskWidgetList : taskWidgetList.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, taskWidgetList.length - VISIBLE_COUNT);
  const completedCount = taskWidgetItemsOnly.filter((i) => i.completed).length;
  const allTasksDone = taskWidgetItemsOnly.length > 0 && taskWidgetItemsOnly.every((t) => t.completed);
  const clearMessage = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);

  const ringPct = taskWidgetItemsOnly.length > 0 ? (completedCount / taskWidgetItemsOnly.length) * 100 : 0;
  const ringOffset = RING_CIRC - (ringPct / 100) * RING_CIRC;
  const ringColor = getRingColor(ringPct);

  const trackStatus = getTrackStatus(taskWidgetItemsOnly);
  const estTime = getEstTime(taskWidgetItemsOnly);
  const trackConfig = trackStatus ? TRACK_CONFIG[trackStatus] : null;

  const metaStr =
    taskWidgetItemsOnly.length > 0 && !allTasksDone
      ? `${taskWidgetItemsOnly.filter((i) => !i.completed).length} due · ${Math.round(taskWidgetSpineCompletedPct)}% done`
      : null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {allTasksDone ? (
        <motion.div
          key="all-done"
          className={styles.taskWidgetSlotAllDoneWrap}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <AllTasksCompleteCard
            emoji="🎉"
            message={clearMessage}
            sub={`${taskWidgetItemsOnly.length} task${taskWidgetItemsOnly.length !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`}
          >
            <Link to="/tasks?open=fullPlanning" className={styles.taskWidgetPlanTomorrowPill}>
              Plan tomorrow →
            </Link>
          </AllTasksCompleteCard>
        </motion.div>
      ) : (
        <motion.div
          key="tasks"
          ref={taskWidgetRef}
          className={styles.taskWidgetSlotRoot}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {taskWidgetItemsOnly.length > 0 ? (
            <>
              <div className={styles.taskWidgetSlotHeader}>
                <div className={styles.taskWidgetSlotHeaderLeft}>
                  <CheckSquare className={styles.taskWidgetSlotIcon} size={18} strokeWidth={1.5} aria-hidden />
                  <div className={styles.taskWidgetSlotTitleBlock}>
                    <h3 className={styles.taskWidgetSlotTitle}>Today&apos;s Tasks</h3>
                    {metaStr && <span className={styles.taskWidgetSlotMeta}>{metaStr}</span>}
                  </div>
                </div>
                <div className={styles.taskWidgetSlotHeaderRight}>
                  <div className={styles.taskWidgetRingWrap}>
                    <svg className={styles.taskWidgetRingSvg} viewBox="0 0 28 28" aria-hidden>
                      <circle className={styles.taskWidgetRingTrack} cx="14" cy="14" r={RING_R} />
                      <motion.circle
                        className={styles.taskWidgetRingFill}
                        cx="14"
                        cy="14"
                        r={RING_R}
                        stroke={ringColor}
                        strokeDasharray={RING_CIRC}
                        initial={{ strokeDashoffset: RING_CIRC }}
                        animate={{ strokeDashoffset: ringOffset }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </svg>
                  </div>
                  <span className={styles.taskWidgetDonutCount}>
                    {completedCount}<span>/{taskWidgetItemsOnly.length} done</span>
                  </span>
                </div>
              </div>

              {trackConfig && (
                <div className={styles.taskWidgetTrackRow}>
                  <span
                    className={styles.trackStatusPill}
                    style={{ background: trackConfig.bg, color: trackConfig.text }}
                  >
                    <span className={styles.trackStatusDot} style={{ background: trackConfig.dot }} />
                    {trackConfig.label}
                  </span>
                  {estTime && <span className={styles.taskWidgetEstTime}>{estTime}</span>}
                </div>
              )}

              <motion.ul
                className={styles.taskWidgetTaskList}
                variants={listVariants}
                initial="initial"
                animate="animate"
                layout
              >
                {visibleList.map((t) => {
                  const status = t.taskWidgetStatus ?? t.actionHubStatus;
                  const isOverdue = status === "overdue";
                  const isNow = status === "now";
                  const categoryLabel = getTaskCategoryPill ? getTaskCategoryPill(t) : null;
                  const catStyle = categoryLabel ? getCategoryStyle(categoryLabel) : null;

                  return (
                    <motion.li
                      key={t.id}
                      layout
                      variants={itemVariants}
                      className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${t.completed ? styles.taskWidgetTaskRowDone : ""}`}
                    >
                      <button
                        type="button"
                        className={styles.taskWidgetCheckbox}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskWidgetComplete(t);
                        }}
                        aria-label={t.completed ? "Mark incomplete" : `Complete ${t.title}`}
                      >
                        <motion.span
                          className={`${styles.taskWidgetCheckboxCircle} ${t.completed ? styles.taskWidgetCheckboxCircleChecked : ""}`}
                          aria-hidden
                          animate={t.completed ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          {t.completed && <Check size={10} strokeWidth={3} />}
                        </motion.span>
                      </button>

                      <span
                        className={`${styles.taskWidgetTaskTitle} ${t.completed ? styles.taskWidgetTaskTitleDone : ""}`}
                        title={t.title}
                      >
                        {t.title}
                      </span>

                      <div className={styles.taskWidgetTaskRight}>
                        {categoryLabel && catStyle && !t.completed && (
                          <span
                            className={styles.taskWidgetCategoryPill}
                            style={{ background: catStyle.bg, color: catStyle.text }}
                          >
                            <span
                              className={styles.taskWidgetCategoryDot}
                              style={{ background: catStyle.dot }}
                            />
                            {categoryLabel}
                          </span>
                        )}
                        {isNow && !t.completed && (
                          <span className={styles.taskWidgetTaskTagNext}>▸ NEXT</span>
                        )}
                        {isOverdue && !t.completed && (
                          <span className={styles.taskWidgetTaskTagLate}>LATE</span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  className={styles.taskWidgetMoreText}
                  onClick={() => setShowAllTaskWidgetTasks((v) => !v)}
                >
                  {showAllTaskWidgetTasks ? "Show less" : `+ ${hiddenCount} more`}
                </button>
              )}

              <div className={`${styles.taskWidgetBottomRow} ${styles.taskWidgetManageFooter}`}>
                <Link to="/tasks" className={styles.taskWidgetManageLink}>
                  Manage all →
                </Link>
              </div>
            </>
          ) : (
            <EmptyStateCard
              displayName={displayName}
              sub={null}
              message="All caught up for today."
              action={
                <Link to="/tasks" className={styles.taskWidgetLink}>
                  Add a task →
                </Link>
              }
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
