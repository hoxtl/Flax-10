import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle2 } from "lucide-react";
import { ModulePill, TypePill, getModulePillColors } from "./ModulePill";
import styles from "./DeadlinesWidget.module.css";

const MAX_SHOWN = 3;

function getUrgencyTier(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  const days = ms / 86400000;
  if (days < 0) return "overdue";
  if (days < 3) return "critical";
  if (days < 7) return "urgent";
  if (days < 14) return "warning";
  return "ok";
}

function getDaysLabel(dueDate) {
  const due = new Date(dueDate);
  const ms = due.getTime() - Date.now();
  const days = Math.floor(ms / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  const weekday = due.toLocaleDateString("en-GB", { weekday: "short" });
  const day = due.getDate();
  const month = due.toLocaleDateString("en-GB", { month: "short" });
  return `${days}d · ${weekday} ${day} ${month}`;
}

function getDaysOverdue(dueDate) {
  const ms = Date.now() - new Date(dueDate).getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) return "Overdue";
  if (days === 1) return "1d overdue";
  return `${days}d overdue`;
}

const listVariants = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
};

export function DeadlinesWidget({ deadlines = [], onSelectDeadline, onSelectModule }) {
  const { sorted, totalCount } = useMemo(() => {
    const list = [...(deadlines || [])].filter((d) => d.start_due_date);
    list.sort((a, b) => {
      const aOver = getUrgencyTier(a.start_due_date) === "overdue";
      const bOver = getUrgencyTier(b.start_due_date) === "overdue";
      if (aOver !== bOver) return aOver ? -1 : 1;
      return new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime();
    });
    return { sorted: list.slice(0, MAX_SHOWN), totalCount: list.length };
  }, [deadlines]);

  if (!Array.isArray(deadlines)) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Calendar className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
          <span className={styles.headerLabel}>Upcoming Deadlines</span>
        </div>
        {totalCount > 0 && (
          <span className={styles.headerBadge}>{totalCount}</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={28} strokeWidth={1.25} className={styles.emptyIcon} aria-hidden />
          <p className={styles.emptyTitle}>All caught up</p>
          <p className={styles.emptySubtitle}>No upcoming deadlines</p>
        </div>
      ) : (
        <motion.div
          className={styles.list}
          role="list"
          initial="hidden"
          animate="visible"
          variants={listVariants}
        >
          {sorted.map((d) => (
            <DeadlineRow
              key={d.id}
              deadline={d}
              onSelect={() => onSelectDeadline?.(d)}
              onSelectModule={onSelectModule}
            />
          ))}
        </motion.div>
      )}

      <div className={styles.footer}>
        <Link to="/modules?filter=enrolled" className={styles.footerBtn}>
          View my modules →
        </Link>
      </div>
    </div>
  );
}

function DeadlineRow({ deadline, onSelect, onSelectModule }) {
  const due = deadline.start_due_date;
  const tier = getUrgencyTier(due);
  const isOverdue = tier === "overdue";
  const isToday = getDaysLabel(due) === "Today";

  const title = deadline.assessment_title || deadline.title || "Assignment";
  const moduleCode = deadline.module_code || "";
  const typeLabel = deadline.deadline_type
    ? deadline.deadline_type.charAt(0).toUpperCase() + deadline.deadline_type.slice(1)
    : "";
  const daysLabel = getDaysLabel(due);

  const tasksDone = deadline.tasks_done ?? null;
  const tasksTotal = deadline.tasks_total ?? null;
  const hasTaskProgress = tasksDone !== null && tasksTotal !== null && tasksTotal > 0;

  const rowClass = [
    styles.row,
    styles[`rowTier_${tier}`],
    isToday ? styles.rowTier_todayPulse : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      role="button"
      tabIndex={0}
      className={rowClass}
      variants={rowVariants}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className={styles.rowBody}>
        <p className={styles.rowTitle}>{title}</p>
        <div className={styles.rowPills}>
          {moduleCode && (
            <ModulePill
              moduleCode={moduleCode}
              asButton
              onClick={(e) => {
                e.stopPropagation();
                onSelectModule?.({
                  code: moduleCode,
                  id: deadline.module_id ?? deadline.module ?? null,
                });
              }}
            />
          )}
          {typeLabel && (
            <TypePill
              typeLabel={typeLabel}
              accentColor={moduleCode ? getModulePillColors(moduleCode).accent : undefined}
            />
          )}
        </div>
      </div>

      <div className={styles.rowRight}>
        {isOverdue ? (
          <span className={styles.overdueChip}>{getDaysOverdue(due)}</span>
        ) : (
          <span className={`${styles.daysLabel} ${styles[`daysLabel_${tier}`]}`}>
            {daysLabel}
          </span>
        )}
        {hasTaskProgress && (
          <span className={styles.taskHint}>{tasksDone}/{tasksTotal} tasks</span>
        )}
      </div>
    </motion.div>
  );
}
