/**
 * Action Hub slot content — Today's tasks (overdue + due today).
 * Compact row layout: checkbox + title + tag pill, no card borders.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import EmptyStateCard from "../../../components/EmptyStateCard";

const VISIBLE_COUNT = 5;

function getTagStyle(colorVariant) {
  if (colorVariant === "sage") return { bg: "#e8f4f0", color: "#2d5f50" };
  return { bg: "#f5f2ef", color: "#6b5f57" };
}

export function ActionHubSlot({
  styles,
  displayName,
  isToday,
  actionHubOverdueCount,
  actionHubSpineCompletedPct,
  actionHubItemsOnly,
  actionHubList,
  showAllActionHubTasks,
  setShowAllActionHubTasks,
  floatingSeedTaskId,
  getTaskCategoryPill,
  getTaskCategoryColor,
  handleActionHubComplete,
  actionHubRef,
  hasTimerSession,
  onStartFocus,
}) {
  const visibleList = showAllActionHubTasks
    ? actionHubList
    : actionHubList.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, actionHubList.length - VISIBLE_COUNT);

  const allTasksDone =
    actionHubItemsOnly.length > 0 &&
    actionHubItemsOnly.every((t) => t.completed);

  if (allTasksDone) {
    return (
      <EmptyStateCard
        illustrationVariant="seedling"
        message="Every task done. Day complete!"
        sub={`${actionHubItemsOnly.length} task${actionHubItemsOnly.length !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`}
        action={
          <Link to="/tasks" className={styles.actionHubLink}>
            Plan tomorrow →
          </Link>
        }
      />
    );
  }

  return (
    <div ref={actionHubRef} className={styles.actionHubSlotRoot}>
      {actionHubItemsOnly.length > 0 ? (
        <>
          <motion.ul className={styles.actionHubTaskList} layout>
            {visibleList.map((t) => {
              const isOverdue = t.actionHubStatus === "overdue";
              const isNow = t.actionHubStatus === "now";
              const moduleLabel = getTaskCategoryPill ? getTaskCategoryPill(t) : null;
              const colorVariant = getTaskCategoryColor ? getTaskCategoryColor(t) : "flax";
              const tagStyle = moduleLabel ? getTagStyle(colorVariant) : null;

              return (
                <motion.li
                  key={t.id}
                  layout
                  className={`${styles.actionHubTaskRow} ${isOverdue ? styles.actionHubTaskRowOverdue : ""} ${t.completed ? styles.actionHubTaskRowDone : ""}`}
                >
                  <button
                    type="button"
                    className={styles.actionHubCheckbox}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionHubComplete(t);
                    }}
                    aria-label={t.completed ? "Mark incomplete" : `Complete ${t.title}`}
                  >
                    <span
                      className={`${styles.actionHubCheckboxCircle} ${
                        t.completed ? styles.actionHubCheckboxCircleChecked : ""
                      }`}
                      aria-hidden
                    >
                      {t.completed && "✓"}
                    </span>
                    {floatingSeedTaskId === t.id && (
                      <motion.span
                        className={styles.actionHubFloatingXp}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -24 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        aria-hidden
                      >
                        +50 XP
                      </motion.span>
                    )}
                  </button>

                  <span
                    className={`${styles.actionHubTaskTitle} ${
                      t.completed ? styles.actionHubTaskTitleDone : ""
                    }`}
                    title={t.title}
                  >
                    {t.title}
                  </span>

                  <div className={styles.actionHubTaskRight}>
                    {moduleLabel && tagStyle && (
                      <span
                        className={styles.actionHubTaskTag}
                        style={{ background: tagStyle.bg, color: tagStyle.color }}
                      >
                        {moduleLabel}
                      </span>
                    )}
                    {isNow && !t.completed && (
                      <span className={styles.actionHubTaskTagNext}>NEXT</span>
                    )}
                    {isOverdue && !t.completed && (
                      <span className={styles.actionHubTaskTagLate}>LATE</span>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>

          {hiddenCount > 0 && (
            <button
              type="button"
              className={styles.actionHubMoreText}
              onClick={() => setShowAllActionHubTasks((v) => !v)}
            >
              {showAllActionHubTasks ? "Show less" : `+ ${hiddenCount} more`}
            </button>
          )}

          {/* Footer: slim progress bar + done% + manage link */}
          <div className={styles.actionHubBottomBar}>
            <div className={styles.actionHubProgressTrackSlim}>
              <div
                className={styles.actionHubProgressFillSlim}
                style={{ width: `${actionHubSpineCompletedPct}%` }}
              />
            </div>
            <div className={styles.actionHubBottomRow}>
              <span className={styles.actionHubBottomPct}>
                {Math.round(actionHubSpineCompletedPct)}% done
              </span>
              <Link to="/tasks" className={styles.actionHubHeaderLink}>
                Manage all →
              </Link>
            </div>
          </div>
        </>
      ) : (
        <EmptyStateCard
          displayName={displayName}
          sub={null}
          message="All caught up for today."
          illustrationVariant="seedling"
          action={
            <Link to="/tasks" className={styles.actionHubLink}>
              Add a task →
            </Link>
          }
        />
      )}
    </div>
  );
}
