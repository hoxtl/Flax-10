import {useState, useEffect} from "react";
import { getSuggestedReadings, getReadingSpeed } from "../../../api/readingApi";
import { FileText, Calendar, Clock, Timer } from "lucide-react";
import { convertReadingToTask } from "../../../api/readingApi";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import styles from "./SuggestedReadingsSection.module.css";

export function useSuggestedReadings(taskCount) {
    const [readings, setReadings] = useState([]);
    const [allAdded, setAllAdded] = useState(false);
    const [speedData, setSpeedData] = useState(null);

    useEffect(() => { async function load() {
      const [readingsData, speed] = await Promise.all([getSuggestedReadings(), getReadingSpeed()]);
      setReadings(readingsData || []); setSpeedData(speed); setAllAdded(false);
    }
    load().catch(() => {
      setReadings([]); setSpeedData(null);
    });
  }, [taskCount]);

  return {readings, setReadings, allAdded, setAllAdded, speedData, setSpeedData};
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
      {reading.module_code && (<span className={styles.rowInfoPill}>{reading.module_code}</span> )}
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
    await convertReadingToTask(reading.id);
    setAdded(true); onAdded(reading.id); setLoading(false);
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

function EmptyReadings({allAdded, readings, onAdded, avgMinPerPage}) {
  if (allAdded || readings.length === 0) {
    return <EmptyState icon="🎉" title="All caught up on readings!" description="No suggested readings left - check back when your teacher adds more." />;
  }
    return <SuggestedReadingsList readings={readings} onAdded={onAdded} avgMinPerPage={avgMinPerPage} />;
}

function SuggestedReadingsHeader({ readings, speedData }) {
  return (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.sectionIcon}>📚</span>
          <span className={styles.sectionTitle}>Suggested Readings</span>
          {readings.length > 0 && <span className={styles.sectionPill}>{readings.length}</span>}
        </div>
        {speedData && (
          <span className={styles.speedTag}>
            {speedData.is_personalised ? `⚡ ${speedData.avg_min_per_page.toFixed(1)} min/page` : "Estimates based on average speed"}
          </span>
        )}
      </div>
      <div className={styles.cardDivider} />
    </>
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

export default function SuggestedReadingsSection({ onTaskAdded, taskCount }) {
  const { readings, setReadings, allAdded, setAllAdded, speedData } = useSuggestedReadings(taskCount);
  const handleAdded = (readingId) => {
    setReadings((prev) => {
      const next = prev.filter((r) => r.id !== readingId);
      if (next.length === 0) setAllAdded(true);
      return next;
    });
    onTaskAdded?.();
  };
  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <SuggestedReadingsHeader readings={readings} speedData={speedData} />
        <EmptyReadings allAdded={allAdded} readings={readings} onAdded={handleAdded} avgMinPerPage={speedData?.avg_min_per_page} />
      </div>
    </div>
  );
}