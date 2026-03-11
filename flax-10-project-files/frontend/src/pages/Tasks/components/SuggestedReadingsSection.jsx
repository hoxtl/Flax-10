import {useState, useEffect} from "react";
import { getSuggestedReadings, getReadingSpeed } from "../../../api/readingApi";
import { FileText, Calendar, Clock, Timer } from "lucide-react";
import { convertReadingToTask } from "../../../api/readingApi";
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
    <div className={styles.rowIn}>
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
    <button className={`${styles.addBtn} ${added ? styles.addBtnDone : ""}`} onClick={handleAdd} disabled={added || loading}>
      {added ? "✓ Added" : loading ? "Adding…" : "+ Add as task"}
    </button>
  );
}

export default function SuggestedReadingCard({ reading, onAdded, avgMinPerPage }) {
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