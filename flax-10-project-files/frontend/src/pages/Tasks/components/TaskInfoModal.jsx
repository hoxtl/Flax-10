/**
 * Modal showing a read-only summary of a task's details.
 */

import { Clock, Flag, Zap, List, BookOpen, MousePointer2, ClipboardList, X } from "lucide-react";

import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import { PRIORITY_LABELS, formatDueDate, formatFocusBlocks } from "../utils/taskCardUtils";
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

function ReadingSpeedRows({ task, speedData }) {
  const pageCount = task.reading_page_count ?? task.page_count ?? null;
  if (!pageCount) return null;
  return (
    <>
      <InfoRow icon={<BookOpen size={14} strokeWidth={2} />} label="Pages" value={`${pageCount} pages`} full />
      <InfoRow icon={<Zap size={14} strokeWidth={2} />} label="Reading speed"
        value={speedData?.is_personalised ? `${speedData.avg_min_per_page.toFixed(1)} min/page` : "Complete a task with the timer to personalise"} full
      />
    </>
  );
}

function InfoGridSection({ task, listName, dueFormatted, due, speedData }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow icon={<Flag size={14} strokeWidth={2} />} label="Priority" value={PRIORITY_LABELS[task.priority] || task.priority || "—"} />
      <InfoRow icon={<Zap size={14} strokeWidth={2} />} label="Sessions" value={formatFocusBlocks(task.estimated_blocks)} />
      <ReadingSpeedRows task={task} speedData={speedData} />
      <InfoRow icon={<Clock size={14} strokeWidth={2} />} label="Due date" value={dueFormatted || due?.label || "—"} full />
      {listName && (
        <div className={styles.infoRowFull}>
          <span className={styles.infoLabel}><List size={14} strokeWidth={2} /> List</span>
          <span className={styles.infoVal}><span className={styles.infoListDot} />{listName}</span>
        </div>
      )}
      {task.module_code && (
        <InfoRow icon={<BookOpen size={14} strokeWidth={2} />} label="Module" value={`${task.module_code}${task.module_name ? ` — ${task.module_name}` : ""}`} full />
      )}
    </div>
  );
}

function InfoModalBody({ task, listName, speedData }) {
  const due = formatDueDate(task.due_date);
  const dueFormatted = task.due_date
    ? new Date(task.due_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;
  return (
    <div className={styles.infoModalBody}>
      <InfoHero task={task} />
      <InfoGridSection task={task} listName={listName} dueFormatted={dueFormatted} due={due} speedData={speedData} />
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

export function TaskInfoModal({ task, listName, onClose }) {
  const [speedData, setSpeedData] = useState(null);
  const pageCount = task.reading_page_count ?? task.page_count ?? null;

  useEffect(() => {
    if (!pageCount) return;
    getReadingSpeed().then(setSpeedData).catch(() => setSpeedData(null));
  }, [pageCount]);

  return (
      <StandardModal
        onClose={onClose}
        hideHeader
        size="md"
        modalClassName={styles.infoModal}
        contentClassName={styles.infoModalContent}
        backdropClassName={styles.modalBackdrop}
      >
        <div className={styles.infoModalAccent} aria-hidden />
        <InfoModalHeader onClose={onClose} />
        <InfoModalBody task={task} listName={listName} speedData={speedData} />
        <InfoModalFooter onClose={onClose} />
      </StandardModal>
  );
}