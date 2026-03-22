import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import {
  getSuggestedReadings,
  convertReadingToTask,
} from "../../api/readingApi";
import { createTask } from "../../api/taskApi";
import { UpcomingDeadlinesWidget } from "../../components/Modules/Deadlines/UpcomingDeadlinesWidget";
import {
  PRIORITY_PILL,
  TIER_ACCENT,
  getDayCount,
  getDaysLabel,
  getDueStatusClass,
  getUrgencyTier,
} from "../../components/Modules/Deadlines/upcomingDeadlinesUtils";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";
import { useCountUp } from "../../hooks/useCountUp";
import { useToast } from "../../context/ToastContext";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import StatStrip from "../../components/common/StatStrip/StatStrip";
import { TaskInfoModal } from "../Tasks/components/TaskInfoModal";
import SmartNudge from "./SmartNudge";
import ReadingsPanel from "./ReadingsPanel";
import styles from "./MyModulesDashboard.module.css";

const DEADLINES_INITIAL_SHOWN = 4;
const READINGS_INITIAL_SHOWN = 4;

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
      {count > 0 && <span className={styles.widgetCount}>{count}</span>}
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

function DeadlinesPanel({ deadlines }) {
  return (
    <UpcomingDeadlinesWidget
      deadlines={deadlines}
      initialShown={DEADLINES_INITIAL_SHOWN}
    />
  );
}

function AddToTaskButton({
  readingId,
  onAdded,
  className = "",
  variant = "primary",
}) {
  const [state, setState] = useState("idle");
  const toast = useToast();
  const handleAdd = async (e) => {
    e.stopPropagation();
    if (state !== "idle") return;
    setState("loading");
    try {
      await convertReadingToTask(readingId);
      setState("added");
      onAdded?.(readingId);
      toast?.("Reading added to tasks!");
    } catch {
      setState("idle");
      toast?.("Failed to add reading.", { variant: "error" });
    }
  };
  if (state === "added")
    return <span className={styles.addedLabel}>✓ Added</span>;
  return (
    <PrimaryButton
      className={className}
      variant={variant}
      size="small"
      pill
      onClick={handleAdd}
      disabled={state === "loading"}
    >
      {state === "loading" ? "Adding…" : "+ Add to tasks"}
    </PrimaryButton>
  );
}

function deadlineToTask(deadline) {
  const tier = deadline?.start_due_date
    ? getUrgencyTier(deadline.start_due_date)
    : "upcoming";
  const priority =
    tier === "overdue" || tier === "critical"
      ? "high"
      : tier === "urgent"
        ? "medium"
        : "low";

  return {
    title:
      deadline?.assessment_title ||
      deadline?.title ||
      deadline?.module_code ||
      "Assignment",
    description: deadline?.description || "",
    priority,
    due_date: deadline?.start_due_date || null,
    module: deadline?.module ?? null,
    module_code: deadline?.module_code || null,
    module_name: deadline?.module_name || null,
    task_list: null,
    estimated_blocks: 1,
  };
}

function AddDeadlineToTaskButton({
  deadline,
  onAdded,
  className = "",
  variant = "secondary",
}) {
  const [state, setState] = useState("idle");
  const toast = useToast();

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (state !== "idle") return;
    setState("loading");
    try {
      await createTask(deadlineToTask(deadline));
      setState("added");
      onAdded?.(deadline?.id);
      toast?.("Deadline added to tasks!");
    } catch {
      setState("idle");
      toast?.("Failed to add deadline.", { variant: "error" });
    }
  };

  if (state === "added")
    return <span className={styles.addedLabel}>✓ Added</span>;

  return (
    <PrimaryButton
      className={className}
      variant={variant}
      size="small"
      pill
      onClick={handleAdd}
      disabled={state === "loading"}
    >
      {state === "loading" ? "Adding…" : "+ Add to tasks"}
    </PrimaryButton>
  );
}

function readingToTask(reading) {
  const pages =
    reading.page_count ||
    (reading.end_page && reading.start_page
      ? reading.end_page - reading.start_page + 1
      : null);
  return {
    title: reading.title,
    description: "",
    priority: "medium",
    due_date: reading.deadline || reading.due_date || null,
    module_code: reading.module_code || null,
    module_name: reading.module_name || null,
    reading_chapter: reading.chapter || null,
    reading_start_page: reading.start_page || null,
    reading_end_page: reading.end_page || null,
    reading_page_count: pages,
    page_count: pages,
    estimated_blocks: null,
  };
}

function ReadingRow({ reading, isMostUrgent, onReadingAdded, onSelect }) {
  const dueDate = reading.deadline || reading.due_date;
  const daysLabel = dueDate ? getDaysLabel(dueDate) : null;
  const tier = dueDate ? getUrgencyTier(dueDate) : "distant";
  const urgentGlow =
    isMostUrgent && dueDate && (tier === "overdue" || tier === "critical");
  const moduleName = reading.module_name || "";
  const pill = PRIORITY_PILL[tier];
  const dueCls = getDueStatusClass(tier);
  return (
    <motion.div
      className={`${styles.readingRow} ${styles.readingRowClickable} ${tier === "overdue" ? styles.rowOverdue : ""} ${tier === "critical" ? styles.rowCritical : ""} ${urgentGlow ? styles.rowUrgentGlow : ""}`}
      style={{ "--deadline-row-accent": TIER_ACCENT[tier], cursor: "pointer" }}
      variants={itemVariants}
      onClick={() => onSelect?.(reading)}
    >
      <div className={styles.readingRowLeft}>
        <span className={styles.readingTitle}>
          {moduleName
            ? `${moduleName}: ${reading.title.replace(new RegExp(`^${moduleName}:\\s*`, "i"), "")}`
            : reading.title}
        </span>
      </div>
      <div className={styles.readingRowRight}>
        {pill && (
          <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>
            {pill.marks} {pill.label}
          </span>
        )}
        {daysLabel && (
          <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
            {(tier === "overdue" ||
              tier === "critical" ||
              tier === "urgent") && (
              <Clock size={11} className={styles.duePillIcon} />
            )}
            {daysLabel}
          </span>
        )}
        <AddToTaskButton
          readingId={reading.id}
          onAdded={onReadingAdded}
          className={styles.readingAddButton}
        />
      </div>
    </motion.div>
  );
}

function useStatItems(modules, enrollments, deadlineCount, readingCount) {
    const enrolledCount = useMemo(() => countEnrolled(modules, enrollments), [modules, enrollments]);
    const enrolledRef = useCountUp(enrolledCount, 1200);
    const deadlinesRef = useCountUp(deadlineCount, 1200);
    const readingsRef = useCountUp(readingCount, 1200);
    return [
        { key: 'enrolled-modules', label: 'Enrolled modules', value: enrolledCount, valueRef: enrolledRef },
        { key: 'upcoming-deadlines', label: 'Upcoming assignment deadlines', value: deadlineCount, valueRef: deadlinesRef, tone: deadlineCount > 0 ? 'danger' : undefined },
        { key: 'readings-to-do', label: 'Readings to do', value: readingCount, valueRef: readingsRef },
    ];
}

export default function MyModulesDashboard({ modules, enrollments }) {
  const [deadlines, setDeadlines] = useState([]);
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    getUpcomingDeadlines()
      .then((list) => setDeadlines(list || []))
      .catch(() => setDeadlines([]));
    getSuggestedReadings()
      .then((list) => setReadings(list || []))
      .catch(() => setReadings([]));
  }, []);

  const handleReadingAdded = useCallback((readingId) => {
    setReadings((prev) => prev.filter((r) => r.id !== readingId));
  }, []);

  const enrolledCount = useMemo(() => {
    if (!modules || !enrollments) return 0;
    return modules.filter((m) => isEnrolledIn(m.id, enrollments)).length;
  }, [modules, enrollments]);
  const enrolledRef = useCountUp(enrolledCount, 1200);
  const deadlinesRef = useCountUp(deadlines.length, 1200);
  const readingsRef = useCountUp(readings.length, 1200);

  return (
    <motion.div
      className={styles.dashboard}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <SmartNudge
        deadlines={deadlines}
        readings={readings}
        onReadingAdded={handleReadingAdded}
      />
      <StatStrip
        items={[
          {
            key: "enrolled-modules",
            label: "Enrolled modules",
            value: enrolledCount,
            valueRef: enrolledRef,
          },
          {
            key: "upcoming-deadlines",
            label: "Upcoming assignment deadlines",
            value: deadlines.length,
            valueRef: deadlinesRef,
          },
          {
            key: "readings-to-do",
            label: "Readings to do",
            value: readings.length,
            valueRef: readingsRef,
          },
        ]}
      />
      <div className={styles.widgetRow}>
        <DeadlinesPanel deadlines={deadlines} />
        <ReadingsPanel
          readings={readings}
          onReadingAdded={handleReadingAdded}
        />
      </div>
    </motion.div>
  );
}
