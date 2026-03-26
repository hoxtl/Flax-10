/*
 * Presentational parts for the suggested readings section.
 */

import { useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { FileText, Calendar, Clock, Timer, ChevronDown } from "lucide-react";

import EmptyState from "../../../components/common/empty_state/EmptyState";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";

import { convertReadingToTask } from "../../../api/readingApi";

import AllTasksCompleteCard from "./AllTasksCompleteCard";
import { SECTION_BODY_ANIM } from "../constants/taskAnimations";
import sectionStyles from "./TaskFeedSections.module.css";
import styles from "./SuggestedReadingsSection.module.css";

function estimateMinutes(pageCount, avgMinPerPage) {
  return pageCount ? Math.round(pageCount * (avgMinPerPage ?? 2.0)) : null;
}

function formatDeadline(deadline) {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function ReadingCardInfo({ reading, avgMinPerPage }) {
  const deadline = formatDeadline(reading.deadline);
  const readMinutes = estimateMinutes(reading.page_count, avgMinPerPage);
  const infoItems = [
    reading.page_count ? { icon: <FileText size={11} strokeWidth={2} />, label: `${reading.page_count} pages` } : null,
    deadline ? { icon: <Calendar size={11} strokeWidth={2} />, label: `Due ${deadline}` } : null,
    readMinutes ? { icon: <Clock size={11} strokeWidth={2} />, label: `${readMinutes} min to read` } : null,
  ].filter(Boolean);
  return <div className={styles.rowInfos}>{infoItems.map((item) => <span key={item.label} className={styles.rowInfo}>{item.icon} {item.label}</span>)}</div>;
}

function ReadingCardHint() {
  return <p className={styles.rowHint}><Timer size={11} strokeWidth={2} />Complete reading tasks with the study timer for personalised predictions</p>;
}

function ReadingCardButton({ added, loading, onAdd }) {
  return <PrimaryButton size="small" pill onClick={onAdd} disabled={added || loading} variant={added ? "secondary" : "primary"}>{added ? "✓ Added" : loading ? "Adding…" : "+ Add as task"}</PrimaryButton>;
}

function useAddReadingTask(onAdded) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const handleAdd = async (readingId) => {
    if (loading || added) return;
    setLoading(true);
    try {
      await convertReadingToTask(readingId);
      setAdded(true);
      onAdded(readingId);
    } finally {
      setLoading(false);
    }
  };
  return { loading, added, handleAdd };
}

export function SuggestedReadingCard({ reading, onAdded, avgMinPerPage }) {
  const addState = useAddReadingTask(onAdded);
  return (
    <div className={`${styles.row} ${addState.added ? styles.rowAdded : ""}`}>
      <div className={styles.rowLeft}>
        <p className={styles.rowTitle}>{reading.title}</p>
        <ReadingCardInfo reading={reading} avgMinPerPage={avgMinPerPage} />
        <ReadingCardHint />
      </div>
      <ReadingCardButton added={addState.added} loading={addState.loading} onAdd={() => addState.handleAdd(reading.id)} />
    </div>
  );
}

function SuggestedReadingsHeaderMeta({ speedData }) {
  if (!speedData) return null;
  return <span className={styles.headerMeta}>{speedData.is_personalised ? `⚡ ${speedData.avg_min_per_page.toFixed(1)} min/page` : "Average speed estimate"}</span>;
}

function SuggestedReadingsHeaderCount({ count, collapsed }) {
  return (
    <span className={sectionStyles.sectionStatsChip}>
      <span className={sectionStyles.sectionCountWrap}><span className={sectionStyles.sectionCountPill} aria-label={`${count} suggested readings`}>{count}</span></span>
      <span className={sectionStyles.sectionChevronBtn} aria-hidden><Motion.span className={sectionStyles.sectionChevron} animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}><ChevronDown size={16} /></Motion.span></span>
    </span>
  );
}

export function SuggestedReadingsHeader({ count, collapsed, onToggle, speedData }) {
  return (
    <button type="button" className={sectionStyles.sectionHeader} onClick={onToggle} aria-expanded={!collapsed}>
      <span className={sectionStyles.sectionIcon}>📚</span>
      <span className={sectionStyles.sectionTitle}>Suggested reading list</span>
      <SuggestedReadingsHeaderMeta speedData={speedData} />
      <SuggestedReadingsHeaderCount count={count} collapsed={collapsed} />
    </button>
  );
}

function SuggestedReadingsList({ readings, onAdded, avgMinPerPage }) {
  return <div className={styles.rows}>{readings.map((reading) => <SuggestedReadingCard key={reading.id} reading={reading} onAdded={onAdded} avgMinPerPage={avgMinPerPage} />)}</div>;
}

function SuggestedReadingsCompletionState({ activeListLabel }) {
  return <AllTasksCompleteCard message="All caught up on readings!" sub={`No suggested readings left for ${activeListLabel} right now.`} />;
}

function SuggestedReadingsEmptyState({ activeListLabel }) {
  return <div className={styles.neutralEmptyState}><EmptyState icon="📚" title="No suggested readings right now." description={`We’ll show extra reading recommendations for ${activeListLabel} here when they’re available.`} /></div>;
}

export function SuggestedReadingsBody({ activeListLabel, readings, pendingTasks, completedTasks, onAdded, avgMinPerPage }) {
  if (readings.length === 0 && completedTasks.length > 0 && pendingTasks.length === 0) return <SuggestedReadingsCompletionState activeListLabel={activeListLabel} />;
  if (readings.length === 0) return <SuggestedReadingsEmptyState activeListLabel={activeListLabel} />;
  return <SuggestedReadingsList readings={readings} onAdded={onAdded} avgMinPerPage={avgMinPerPage} />;
}

export function SuggestedReadingsCollapse({ collapsed, children }) {
  return <AnimatePresence initial={false}>{!collapsed && <Motion.div key="suggested-readings-body" {...SECTION_BODY_ANIM} style={{ overflow: "hidden" }}>{children}</Motion.div>}</AnimatePresence>;
}
