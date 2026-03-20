import {useState, useEffect, useMemo} from "react";
import { getSuggestedReadings, getReadingSpeed } from "../../../api/readingApi";
import { FileText, Calendar, Clock, Timer, ChevronDown } from "lucide-react";
import { convertReadingToTask } from "../../../api/readingApi";
import { AnimatePresence, motion } from "framer-motion";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import AllTasksCompleteCard from "./AllTasksCompleteCard";
import sectionStyles from "./TaskFeedSections.module.css";
import { isReadingList, matchesReadingList, parseReadingListName } from "../utils/readingListUtils";
import styles from "./SuggestedReadingsSection.module.css";

export function useSuggestedReadings(taskCount) {
    const [readings, setReadings] = useState([]);
    const [speedData, setSpeedData] = useState(null);

    useEffect(() => { async function load() {
      const [readingsData, speed] = await Promise.all([getSuggestedReadings(), getReadingSpeed()]);
      setReadings(readingsData || []); setSpeedData(speed);
    }
    load().catch(() => {
      setReadings([]); setSpeedData(null);
    });
  }, [taskCount]);

  return {readings, setReadings, speedData};
}

function estimateMinutes(pageCount, avgMinPerPage) {
  if (!pageCount) return null;
  return Math.round(pageCount * (avgMinPerPage ?? 2.0));
}

function formatDeadline(deadline) {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short",
  });
}

function ReadingCardInfo({ reading, avgMinPerPage }) {
  const deadline = formatDeadline(reading.deadline);
  const estimatedMinutes = estimateMinutes(reading.page_count, avgMinPerPage);
  return (
    <div className={styles.rowInfos}>
      {reading.page_count && (<span className={styles.rowInfo}><FileText size={11} strokeWidth={2} /> {reading.page_count} pages</span>)}
      {deadline && (<span className={styles.rowInfo}><Calendar size={11} strokeWidth={2} /> Due {deadline}</span>)}
      {estimatedMinutes && (<span className={styles.rowInfo}><Clock size={11} strokeWidth={2} /> {estimatedMinutes} min to read</span>)}
    </div>
  );
}

function ReadingCardHint() {
  return (
    <p className={styles.rowHint}>
      <Timer size={11} strokeWidth={2} /> Complete reading task with the study timer for personalised predictions
    </p>
  );
}

function ReadingCardButton({ added, loading, handleAdd }) {
  return (
    <PrimaryButton 
      size="small" pill onClick={handleAdd} disabled={added || loading} variant={added ? "secondary" : "primary"}
    >
      {added ? "✓ Added" : loading ? "Adding…" : "+ Add as task"}
    </PrimaryButton>
  );
}

export function SuggestedReadingCard({ reading, onAdded, avgMinPerPage }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (loading || added) return;
    setLoading(true);
    try {
      await convertReadingToTask(reading.id);
      setAdded(true);
      onAdded(reading.id);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={`${styles.row} ${added ? styles.rowAdded : ""}`}>
      <div className={styles.rowLeft}>
        <p className={styles.rowTitle}>{reading.title}</p>
        <ReadingCardInfo reading={reading} avgMinPerPage={avgMinPerPage} />
        <ReadingCardHint />
      </div>
      <ReadingCardButton added={added} loading={loading} handleAdd={handleAdd} />
    </div>
  );
}

const SECTION_BODY_ANIM = {
  initial: { height: 0, opacity: 0, y: -4 },
  animate: { height: "auto", opacity: 1, y: 0 },
  exit: { height: 0, opacity: 0, y: -4 },
  transition: {
    height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    opacity: { duration: 0.2, ease: "easeOut" },
    y: { duration: 0.2, ease: "easeOut" },
  },
};

function getReadingListLabel(activeList) {
  if (!activeList) return "this reading list";
  const parsed = parseReadingListName(activeList.name);
  return [parsed.moduleCode, parsed.moduleName].filter(Boolean).join(" ") || parsed.label || "this reading list";
}

function SuggestedReadingsHeader({ count, collapsed, onToggle, speedData }) {
  return (
    <button type="button" className={sectionStyles.sectionHeader} onClick={onToggle} aria-expanded={!collapsed}>
      <span className={sectionStyles.sectionIcon}>📚</span>
      <span className={sectionStyles.sectionTitle}>Suggested Reading List</span>
      {speedData && (
        <span className={styles.headerMeta}>
          {speedData.is_personalised ? `⚡ ${speedData.avg_min_per_page.toFixed(1)} min/page` : "Average speed estimate"}
        </span>
      )}
      <span className={sectionStyles.sectionStatsChip}>
        <span className={sectionStyles.sectionCountWrap}>
          <span className={sectionStyles.sectionCountPill} aria-label={`${count} suggested readings`}>
            {count}
          </span>
        </span>
        <span className={sectionStyles.sectionChevronBtn} aria-hidden>
          <motion.span
            className={sectionStyles.sectionChevron}
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ChevronDown size={16} />
          </motion.span>
        </span>
      </span>
    </button>
  );
}

function SuggestedReadingsList({ readings, onAdded, avgMinPerPage }) {
  return (
    <div className={styles.rows}>
      {readings.map((r) => (
        <SuggestedReadingCard key={r.id} reading={r} onAdded={onAdded} avgMinPerPage={avgMinPerPage} />
      ))}
    </div>
  );
}

function SuggestedReadingsBody({
  activeList,
  readings,
  pendingTasks,
  completedTasks,
  onAdded,
  avgMinPerPage,
}) {
  const showCompletionState = readings.length === 0 && completedTasks.length > 0 && pendingTasks.length === 0;
  const activeListLabel = getReadingListLabel(activeList);

  if (showCompletionState) {
    return (
      <AllTasksCompleteCard
        message="All caught up on readings!"
        sub={`No suggested readings left for ${activeListLabel} right now.`}
      />
    );
  }

  if (readings.length === 0) {
    return (
      <div className={styles.neutralEmptyState}>
        <EmptyState
          icon="📚"
          title="No suggested readings right now."
          description={`We’ll show extra reading recommendations for ${activeListLabel} here when they’re available.`}
        />
      </div>
    );
  }

  return <SuggestedReadingsList readings={readings} onAdded={onAdded} avgMinPerPage={avgMinPerPage} />;
}

export default function SuggestedReadingsSection({ activeList, onTaskAdded, taskCount, pendingTasks = [], completedTasks = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const { readings, setReadings, speedData } = useSuggestedReadings(taskCount);
  const filteredReadings = useMemo(() => {
    if (!activeList || !isReadingList(activeList)) return readings;
    return readings.filter((reading) => matchesReadingList(reading, activeList));
  }, [activeList, readings]);

  const handleAdded = (readingId) => {
    setReadings((prev) => prev.filter((r) => r.id !== readingId));
    onTaskAdded?.();
  };

  return (
    <div className={`${sectionStyles.section} ${styles.section}`}>
      <SuggestedReadingsHeader
        count={filteredReadings.length}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        speedData={speedData}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div key="suggested-readings-body" {...SECTION_BODY_ANIM} style={{ overflow: "hidden" }}>
            <div className={`${sectionStyles.sectionBody} ${styles.body}`}>
              <SuggestedReadingsBody
                activeList={activeList}
                readings={filteredReadings}
                pendingTasks={pendingTasks}
                completedTasks={completedTasks}
                onAdded={handleAdded}
                avgMinPerPage={speedData?.avg_min_per_page}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
