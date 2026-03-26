/*
 * Attendance segment detail panel.
 */

import { useState } from "react";
import SegmentDetailHeader from "./SegmentDetailHeader";
import SegmentDetailList from "./SegmentDetailList";
import styles from "./AttendanceDetailPanel.module.css";

export default function SegmentDetailPanel({ segmentLabel, events, onToggleStatus, onClose, className = "" }) {
  const [toggling, setToggling] = useState({});
  return <SegmentDetailPanelContent className={className} segmentLabel={segmentLabel} events={events} toggling={toggling} setToggling={setToggling} onToggleStatus={onToggleStatus} onClose={onClose} />;
}

function SegmentDetailPanelContent({ className, segmentLabel, events, toggling, setToggling, onToggleStatus, onClose }) {
  const panelClassName = className ? `${styles.detailPanel} ${className}` : styles.detailPanel;
  const handleToggleStatus = (eventId, attended) => toggleDetailStatus(eventId, attended, onToggleStatus, setToggling);

  return (
    <div className={panelClassName}>
      <SegmentDetailHeader segmentLabel={segmentLabel} count={events.length} onClose={onClose} />
      <ul className={styles.detailList}><SegmentDetailList events={events} toggling={toggling} onToggleStatus={handleToggleStatus} /></ul>
    </div>
  );
}

async function toggleDetailStatus(eventId, attended, onToggleStatus, setToggling) {
  setToggling((current) => ({ ...current, [eventId]: true }));
  try {
    await onToggleStatus?.(eventId, !attended);
  } finally {
    setToggling((current) => ({ ...current, [eventId]: false }));
  }
}
