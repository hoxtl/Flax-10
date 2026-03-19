import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./DeadlinesWidget.module.css";
import EmptyStateCard from "./EmptyStateCard";

const MAX_SHOWN = 3;

function getDayCount(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  return Math.floor(ms / 86400000);
}

function getUrgencyTier(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0)   return "overdue";
  if (days <= 2)  return "critical";
  if (days <= 5)  return "urgent";
  if (days <= 14) return "upcoming";
  return "distant";
}

function getDaysLabel(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0) {
    const over = Math.abs(days);
    return over === 0 ? "Overdue" : over === 1 ? "1d overdue" : `${over}d overdue`;
  }
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

const TIER_TEXT = {
  overdue: "var(--home-urgency-danger)",
  critical: "var(--home-urgency-warning)",
  urgent: "var(--home-urgency-warning)",
  upcoming: "var(--home-urgency-neutral)",
  distant: "var(--home-urgency-muted)",
};

const TIER_ACCENT = {
  overdue: "var(--home-urgency-danger)",
  critical: "var(--home-urgency-warning)",
  urgent: "var(--home-urgency-warning)",
  upcoming: "var(--home-urgency-neutral)",
  distant: "var(--home-urgency-neutral-border)",
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const rowVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

export function DeadlinesWidget({ deadlines = [], onSelectDeadline, onSelectModule, row = 1 }) {
  const maxShown = row === 1 ? 3 : 6;
  const { sorted, totalCount } = useMemo(() => {
    const list = [...(deadlines || [])].filter((d) => d.start_due_date);
    list.sort((a, b) => {
      const aOver = getUrgencyTier(a.start_due_date) === "overdue";
      const bOver = getUrgencyTier(b.start_due_date) === "overdue";
      if (aOver !== bOver) return aOver ? -1 : 1;
      return new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime();
    });
    return { sorted: list.slice(0, maxShown), totalCount: list.length };
  }, [deadlines, maxShown]);

  if (!Array.isArray(deadlines)) return null;

  const hiddenCount = totalCount - MAX_SHOWN;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={baseStyles.widgetHeader}>
        <div className={baseStyles.headerIconWrap}>
          <AlertCircle className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={baseStyles.headerTitle}>Deadlines</span>
      </div>

      {sorted.length === 0 ? (
        <EmptyStateCard
          message="No deadlines need attention."
          sub="Upcoming coursework and exams will show up here."
        />
      ) : (
        <motion.div
          className={styles.list}
          role="list"
          initial="hidden"
          animate="visible"
          variants={listVariants}
        >
          {sorted.map((d, idx) => (
            <DeadlineRow
              key={d.id}
              deadline={d}
              isLast={idx === sorted.length - 1 && hiddenCount <= 0}
              onSelect={() => onSelectDeadline?.(d)}
              onSelectModule={onSelectModule}
            />
          ))}
        </motion.div>
      )}

      <div className={styles.footer}>
        <Link to="/modules?filter=enrolled" className={styles.footerLinkMuted}>
          View my modules
          <ArrowRight size={11} strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function DeadlineRow({ deadline, isLast, onSelect, onSelectModule }) {
  const due  = deadline.start_due_date;
  const tier = getUrgencyTier(due);
  const daysLabel  = getDaysLabel(due);
  const title      = deadline.assessment_title || deadline.title || "Assignment";
  const moduleCode = deadline.module_code || "";
  const typeLabel = (deadline.deadline_type || "assessment").toUpperCase();
  const textColor = TIER_TEXT[tier] || "var(--home-urgency-muted)";
  const rowAccent = TIER_ACCENT[tier] || "var(--home-urgency-neutral-border)";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      className={`${styles.row} ${tier === "overdue" ? styles.rowOverdue : ""} ${tier === "critical" ? styles.rowCritical : ""} ${isLast ? styles.rowLast : ""}`}
      style={{ "--deadline-row-accent": rowAccent }}
      variants={rowVariants}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); }
      }}
    >
      <div className={styles.rowLeft}>
        <div className={styles.rowTopPills}>
          {moduleCode && (
            <button
              type="button"
              className={styles.moduleCodePill}
              onClick={(e) => {
                e.stopPropagation();
                onSelectModule?.({ code: moduleCode, id: deadline.module_id ?? deadline.module ?? null });
              }}
            >
              {moduleCode}
            </button>
          )}
          <span className={styles.deadlineTypePill}>{typeLabel}</span>
        </div>
        <span className={styles.rowTitle} title={title}>{title}</span>
      </div>
      <div className={styles.rowRight}>
        <span className={styles.daysLabel} style={{ color: textColor }}>{daysLabel}</span>
      </div>
    </motion.div>
  );
}
