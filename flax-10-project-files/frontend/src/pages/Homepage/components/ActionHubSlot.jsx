/**
 * Action Hub slot content — Today's tasks (overdue + due today).
 * Clean card layout: summary chips → task rows → progress bar CTA.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import EmptyStateCard from "../../../components/EmptyStateCard";

const VISIBLE_COUNT = 4;

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
  handleActionHubComplete,
  actionHubRef,
  hasTimerSession,
  onStartFocus,
}) {
  const visibleList = showAllActionHubTasks
    ? actionHubList
    : actionHubList.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, actionHubList.length - VISIBLE_COUNT);

  const dueTodayCount = actionHubItemsOnly.filter(
    (i) => !i.completed && i.actionHubStatus !== "overdue"
  ).length;

  return (
    <div ref={actionHubRef} className={styles.actionHubSlotRoot}>
      {/* Summary chips */}
      {isToday && (actionHubOverdueCount > 0 || dueTodayCount > 0) && (
        <div className={styles.actionHubSummaryRow}>
          {actionHubOverdueCount > 0 && (
            <span className={styles.actionHubSummaryOverdue}>
              {actionHubOverdueCount} overdue
            </span>
          )}
          {dueTodayCount > 0 && (
            <span className={styles.actionHubSummaryDue}>
              {dueTodayCount} due today
            </span>
          )}
        </div>
      )}

      {actionHubItemsOnly.length > 0 ? (
        <>
          <motion.ul className={styles.actionHubCardList} layout>
            {visibleList.map((t) => {
              const isOverdue = t.actionHubStatus === "overdue";
              const isNow = t.actionHubStatus === "now";
              const moduleLabel = getTaskCategoryPill ? getTaskCategoryPill(t) : null;
              const borderClass = isOverdue
                ? styles.actionHubCardOverdue
                : isNow
                  ? styles.actionHubCardNow
                  : t.completed
                    ? styles.actionHubCardCompleted
                    : styles.actionHubCardBorderFlax;

              return (
                <motion.li
                  key={t.id}
                  layout
                  className={`${styles.actionHubCard} ${borderClass}`}
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
                      className={`${styles.actionHubCheckboxBoxRound} ${
                        t.completed ? styles.actionHubCheckboxChecked : ""
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

                  <div className={styles.actionHubCardMeta}>
                    {(moduleLabel || (isNow && !t.completed) || (isOverdue && !t.completed)) && (
                      <div className={styles.actionHubCardTags}>
                        {moduleLabel && (
                          <span className={styles.actionHubModulePill}>{moduleLabel}</span>
                        )}
                        {isNow && !t.completed && (
                          <span className={styles.actionHubTagNow}>NEXT</span>
                        )}
                        {isOverdue && !t.completed && (
                          <span className={styles.actionHubOverdueTag}>LATE</span>
                        )}
                      </div>
                    )}
                    <span
                      className={`${styles.actionHubCardTitle} ${
                        t.completed ? styles.actionHubCardTitleCompleted : ""
                      }`}
                      title={t.title}
                    >
                      {t.title}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>

          {hiddenCount > 0 && (
            <button
              type="button"
              className={styles.actionHubSeeAllBtn}
              onClick={() => setShowAllActionHubTasks((v) => !v)}
            >
              {showAllActionHubTasks ? "Show less" : `+ ${hiddenCount} more`}
            </button>
          )}

          {!hasTimerSession && onStartFocus && (
            <button type="button" className={styles.actionHubFocusCta} onClick={onStartFocus}>
              ▶ Start a focus session
            </button>
          )}

          {/* Bottom bar: slim progress + CTA */}
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
