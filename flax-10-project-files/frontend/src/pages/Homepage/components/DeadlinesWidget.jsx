/**
 * Deadlines widget for Intelligence Row — header, deadline rows (module + type pills, days on right), footer.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CheckCircle } from "lucide-react";
import { useModuleModal } from "../../../context/ModuleModalContext";
import styles from "./DeadlinesWidget.module.css";

/** Urgency: "critical" <3d, "urgent" 3-7d, "warning" 7-14d, "ok" >14d */
function getUrgencyTier(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  const days = ms / 86400000;
  if (days < 0) return "critical";
  if (days < 3) return "critical";
  if (days < 7) return "urgent";
  if (days < 14) return "warning";
  return "ok";
}

/** Right-side label: "9 days", "1 day", "Today", "Overdue" */
function getDaysLabel(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  const days = Math.floor(ms / 86400000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function DeadlinesWidget({
  deadlines = [],
  onSelectDeadline,
}) {
  const { openModuleModal } = useModuleModal();
  const sorted = useMemo(() => {
    const list = [...deadlines].filter((d) => d.start_due_date);
    list.sort((a, b) => new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime());
    return list.slice(0, 3);
  }, [deadlines]);

  if (!Array.isArray(deadlines)) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ClipboardList className={styles.headerIcon} size={18} strokeWidth={1.5} aria-hidden />
          <span className={styles.headerTitle}>Upcoming Deadlines</span>
          {sorted.length > 0 && (
            <span className={styles.headerBadge}>{sorted.length}</span>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            <CheckCircle size={18} className={styles.emptyTitleIcon} aria-hidden /> All caught up!
          </p>
          <p className={styles.emptySubtitle}>No upcoming deadlines</p>
        </div>
      ) : (
        <div className={styles.list} role="list">
          {sorted.map((d) => (
            <DeadlineRow
              key={d.id}
              deadline={d}
              onSelect={() => onSelectDeadline?.(d)}
              onOpenModule={openModuleModal}
            />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <Link to="/modules?filter=enrolled" className={styles.footerBtn}>
          View my modules →
        </Link>
      </div>
    </div>
  );
}

function DeadlineRow({ deadline, onSelect, onOpenModule }) {
  const due = deadline.start_due_date;
  const tier = getUrgencyTier(due);
  const title = deadline.assessment_title || deadline.title || "Assignment";
  const moduleCode = deadline.module_code || "";
  const typeLabel = deadline.deadline_type
    ? deadline.deadline_type.charAt(0).toUpperCase() + deadline.deadline_type.slice(1)
    : "";
  const daysLabel = getDaysLabel(due);
  const moduleIdOrCode = deadline.module_id ?? deadline.module ?? moduleCode || null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.row} ${styles[`rowTier_${tier}`]}`}
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
          {moduleCode &&
            (moduleIdOrCode && onOpenModule ? (
              <button
                type="button"
                className={styles.pill}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModule(moduleIdOrCode);
                }}
                aria-label={`Open module ${moduleCode}`}
              >
                {moduleCode}
              </button>
            ) : (
              <span className={styles.pill}>{moduleCode}</span>
            ))}
          {typeLabel && <span className={styles.pill}>{typeLabel}</span>}
        </div>
      </div>
      <span className={`${styles.daysLabel} ${styles[`daysLabel_${tier}`]}`}>{daysLabel}</span>
    </div>
  );
}
