/*
 * Read-only task detail modal with reading context and summary rows.
 */

import { Clock, Flag, Zap, List, BookOpen, MousePointer2, ClipboardList, X } from "lucide-react";

<<<<<<< HEAD
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import StandardModal from "../../../components/common/standard_modal/StandardModal";
=======
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { PRIORITY_LABELS, formatDueDate, formatFocusBlocks } from "../utils/taskCardUtils";
import { isReadingListName } from "../utils/readingListUtils";
import styles from "./TaskInfoModal.module.css";

import { useState, useEffect } from "react";
import { getReadingSpeed } from "../../../api/readingApi";

function InfoRow({ icon, label, value, full = false }) {
  return (
    <div className={full ? styles.infoRowFull : styles.infoRow}>
      <span className={styles.infoLabel}>{icon} {label}</span>
      <span className={`${styles.infoVal} ${full ? "" : styles.infoValPill}`}>{value}</span>
    </div>
  );
}

function InfoHero({ task }) {
  return (
    <div className={styles.infoHero}>
      <p className={styles.infoHeroTitle}>{task.title || "—"}</p>
      {(task.description || "").trim() && <p className={styles.infoHeroDesc}>{task.description}</p>}
    </div>
  );
}

function getPageRange(task, pageCount) {
  if (task.reading_start_page && task.reading_end_page) {
    return `pp. ${task.reading_start_page}–${task.reading_end_page}`;
  }
  return pageCount ? `${pageCount} pages` : null;
}

function buildReadingPills(task, speedData, showReadingContext) {
  const pageCount = task.reading_page_count ?? task.page_count ?? null;
  const pageRange = getPageRange(task, pageCount);
  const speedText = speedData?.avg_min_per_page ? `${speedData.avg_min_per_page.toFixed(1)} min/page` : null;
  if (!showReadingContext && !pageCount && !task.reading_chapter) return [];
  return showReadingContext
    ? [
        { label: "Chapter", value: task.reading_chapter || "—" },
        { label: "Pages", value: pageRange || "—" },
        { label: "Speed", value: speedText || "—" },
      ]
    : [
        task.reading_chapter ? { label: "Chapter", value: task.reading_chapter } : null,
        pageRange ? { label: "Pages", value: pageRange } : null,
        speedText ? { label: "Speed", value: speedText } : null,
      ].filter(Boolean);
}

function ReadingPillRow({ task, speedData, showReadingContext }) {
  const pills = buildReadingPills(task, speedData, showReadingContext);
  if (pills.length === 0) return null;
  return (
    <div className={styles.readingPillRow}>
      {pills.map((pill) => (
        <span key={pill.label} className={styles.readingDetailPill}>
          <span className={styles.readingDetailLabel}>{pill.label}</span>
          <span className={styles.readingDetailValue}>{pill.value}</span>
        </span>
      ))}
    </div>
  );
}

function getModuleLabel(task) {
<<<<<<< HEAD
  return task.module_code && task.module_name ? `${task.module_code} — ${task.module_name}` : task.module_code || task.module_name;
=======
  return task.module_code && task.module_name ? `${task.module_code} — ${task.module_name}` : task.module_code || task.module_name || "—";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function ListInfoRow({ listName }) {
  if (!listName) return null;
  return <div className={styles.infoRowFull}><span className={styles.infoLabel}><List size={14} strokeWidth={2} /> List</span><span className={styles.infoVal}><span className={styles.infoListDot} />{listName}</span></div>;
}

function ModuleInfoRow({ task }) {
  if (!task.module_code && !task.module_name) return null;
  return <InfoRow icon={<BookOpen size={14} strokeWidth={2} />} label="Module" value={getModuleLabel(task)} full />;
}

function InfoGridSection({ task, listName, dueFormatted, due }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow icon={<Flag size={14} strokeWidth={2} />} label="Priority" value={PRIORITY_LABELS[task.priority] || task.priority || "—"} />
      <InfoRow icon={<Zap size={14} strokeWidth={2} />} label="Sessions" value={formatFocusBlocks(task.estimated_blocks)} />
      <InfoRow icon={<Clock size={14} strokeWidth={2} />} label="Due date" value={dueFormatted || due?.label || "—"} full />
      <ListInfoRow listName={listName} />
      <ModuleInfoRow task={task} />
    </div>
  );
}

function InfoModalBody({ task, listName, speedData }) {
  const due = formatDueDate(task.due_date);
  const dueFormatted = task.due_date
    ? new Date(task.due_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;
  const showReadingContext = isReadingListName(listName);
  return (
    <div className={styles.infoModalBody}>
      <InfoHero task={task} />
      <ReadingPillRow task={task} speedData={speedData} showReadingContext={showReadingContext} />
      <InfoGridSection task={task} listName={listName} dueFormatted={dueFormatted} due={due} />
    </div>
  );
}

function InfoModalHeader({ onClose }) {
  return (
    <div className={styles.infoModalHeader}>
      <ClipboardList size={20} strokeWidth={1.5} className={styles.infoModalIcon} aria-hidden />
      <div className={styles.infoModalHeaderText}>
        <h3 className={styles.infoModalTitle}>Task details</h3>
        <p className={styles.infoModalSub}>Quick glance</p>
      </div>
      <button type="button" className={styles.infoModalClose} onClick={onClose} aria-label="Close">
        <X size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

function InfoModalFooter({ onClose }) {
  return (
    <div className={styles.infoModalFooter}>
      <span className={styles.infoHint}><MousePointer2 size={12} strokeWidth={2} /> Right-click the task to edit or delete</span>
      <PrimaryButton variant="ghost" pill onClick={onClose}>Close</PrimaryButton>
    </div>
  );
}

function useReadingSpeedData(task, listName) {
  const [speedData, setSpeedData] = useState(null);
  const pageCount = task.reading_page_count ?? task.page_count ?? null;
  const showReadingContext = isReadingListName(listName);
  useEffect(() => {
    if (!pageCount && !showReadingContext) return;
    getReadingSpeed().then(setSpeedData).catch(() => setSpeedData(null));
  }, [pageCount, showReadingContext]);
  return speedData;
}

export function TaskInfoModal({ task, listName, onClose }) {
  const speedData = useReadingSpeedData(task, listName);
  return (
    <StandardModal onClose={onClose} hideHeader size="md" modalClassName={styles.infoModal} contentClassName={styles.infoModalContent} backdropClassName={styles.modalBackdrop}>
      <div className={styles.infoModalAccent} aria-hidden />
      <InfoModalHeader onClose={onClose} />
      <InfoModalBody task={task} listName={listName} speedData={speedData} />
      <InfoModalFooter onClose={onClose} />
    </StandardModal>
  );
}
