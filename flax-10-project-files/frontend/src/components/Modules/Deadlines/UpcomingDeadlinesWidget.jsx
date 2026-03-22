import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";

import styles from "../../../pages/Modules/MyModulesDashboard.module.css";
import {
  DEADLINE_TIER_ORDER,
  PRIORITY_PILL,
  TIER_ACCENT,
  getDaysLabel,
  getDueStatusClass,
  getUrgencyTier,
} from "./upcomingDeadlinesUtils";

const expandBodyVariants = {
  collapsed: { opacity: 0, height: 0 },
  expanded: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] },
  },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};

function WidgetHeader({ icon: Icon, title, count }) {
  return (
    <div className={styles.widgetHeader}>
      <div className={styles.widgetIconWrap}>
        <Icon size={17} strokeWidth={1.85} aria-hidden />
      </div>
      <span className={styles.widgetTitle}>{title}</span>
      {count > 0 ? <span className={styles.widgetCount}>{count}</span> : null}
    </div>
  );
}

function ShowMoreButton({ expanded, hiddenCount, onToggle }) {
  return (
    <motion.button
      type="button"
      className={styles.showMoreBtn}
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
    >
      {expanded ? (
        <>
          <ChevronUp size={14} strokeWidth={2.5} aria-hidden /> Show less
        </>
      ) : (
        <>
          <ChevronDown size={14} strokeWidth={2.5} aria-hidden /> +{" "}
          {hiddenCount} more
        </>
      )}
    </motion.button>
  );
}

function ModuleCodePill({ moduleCode, deadline, onSelectModule }) {
  if (!moduleCode) return null;

  if (onSelectModule) {
    return (
      <button
        type="button"
        className={styles.moduleCodePill}
        onClick={(e) => {
          e.stopPropagation();
          onSelectModule({
            code: moduleCode,
            id: deadline.module_id ?? deadline.module ?? null,
          });
        }}
      >
        {moduleCode}
      </button>
    );
  }

  return (
    <Link
      to={`/modules?code=${encodeURIComponent(moduleCode)}`}
      className={styles.moduleCodePill}
      onClick={(e) => e.stopPropagation()}
    >
      {moduleCode}
    </Link>
  );
}

function DeadlineRow({
  deadline,
  interactiveRows,
  onSelectDeadline,
  onSelectModule,
}) {
  const due = deadline.start_due_date;
  const tier = getUrgencyTier(due);
  const daysLabel = getDaysLabel(due);
  const title = deadline.assessment_title || deadline.title || "Assignment";
  const moduleCode = deadline.module_code || "";
  const typeLabel = (deadline.deadline_type || "assessment").toUpperCase();
  const urgentGlow = tier === "overdue" || tier === "critical";
  const pill = PRIORITY_PILL[tier];
  const dueCls = getDueStatusClass(tier);

  const interactiveProps = interactiveRows
    ? {
        role: "button",
        tabIndex: 0,
        onClick: () => onSelectDeadline?.(deadline),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectDeadline?.(deadline);
          }
        },
      }
    : {};

  return (
    <motion.div
      className={`${styles.deadlineRow} ${tier === "overdue" ? styles.rowOverdue : ""} ${tier === "critical" ? styles.rowCritical : ""} ${urgentGlow ? styles.rowUrgentGlow : ""}`}
      style={{
        "--deadline-row-accent": TIER_ACCENT[tier],
        cursor: interactiveRows ? "pointer" : "default",
      }}
      variants={itemVariants}
      {...interactiveProps}
    >
      <div className={styles.deadlineRowLeft}>
        <div className={styles.deadlinePills}>
          <ModuleCodePill
            moduleCode={moduleCode}
            deadline={deadline}
            onSelectModule={onSelectModule}
          />
          <span className={styles.typePill}>{typeLabel}</span>
        </div>
        <span className={styles.deadlineTitle}>{title}</span>
      </div>
      <div className={styles.deadlineRowRight}>
        {pill ? (
          <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>
            {pill.marks} {pill.label}
          </span>
        ) : null}
        <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
          {tier === "overdue" || tier === "critical" || tier === "urgent" ? (
            <Clock size={11} className={styles.duePillIcon} />
          ) : null}
          {daysLabel}
        </span>
      </div>
    </motion.div>
  );
}

export function UpcomingDeadlinesWidget({
  deadlines = [],
  title = "Upcoming Deadlines",
  initialShown = 4,
  embedded = false,
  interactiveRows = false,
  onSelectDeadline,
  onSelectModule,
  emptyMessage = "No upcoming deadlines",
  emptySub = "You're all caught up — enjoy the calm.",
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const list = [...(deadlines || [])].filter(
      (deadline) => deadline?.start_due_date,
    );
    list.sort((a, b) => {
      const aTier = getUrgencyTier(a.start_due_date);
      const bTier = getUrgencyTier(b.start_due_date);
      if (DEADLINE_TIER_ORDER[aTier] !== DEADLINE_TIER_ORDER[bTier]) {
        return DEADLINE_TIER_ORDER[aTier] - DEADLINE_TIER_ORDER[bTier];
      }
      return (
        new Date(a.start_due_date).getTime() -
        new Date(b.start_due_date).getTime()
      );
    });
    return list;
  }, [deadlines]);

  if (!Array.isArray(deadlines)) return null;

  const initial = sorted.slice(0, initialShown);
  const extra = sorted.slice(initialShown);
  const hiddenCount = extra.length;

  return (
    <motion.div
      className={`${styles.widget} ${embedded ? styles.widgetEmbedded : ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <WidgetHeader icon={AlertCircle} title={title} count={sorted.length} />
      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{emptyMessage}</p>
          <p className={styles.emptySub}>{emptySub}</p>
        </div>
      ) : (
        <>
          <motion.div
            className={styles.widgetList}
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            {initial.map((deadline) => (
              <DeadlineRow
                key={deadline.id}
                deadline={deadline}
                interactiveRows={interactiveRows}
                onSelectDeadline={onSelectDeadline}
                onSelectModule={onSelectModule}
              />
            ))}
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  className={styles.expandableRows}
                  variants={expandBodyVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  <motion.div
                    className={styles.expandableRowsInner}
                    initial="hidden"
                    animate="visible"
                    variants={listVariants}
                  >
                    {extra.map((deadline) => (
                      <DeadlineRow
                        key={deadline.id}
                        deadline={deadline}
                        interactiveRows={interactiveRows}
                        onSelectDeadline={onSelectDeadline}
                        onSelectModule={onSelectModule}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
          {hiddenCount > 0 ? (
            <ShowMoreButton
              expanded={expanded}
              hiddenCount={hiddenCount}
              onToggle={() => setExpanded((prev) => !prev)}
            />
          ) : null}
        </>
      )}
    </motion.div>
  );
}
