/*
 * Student modules dashboard with stats, deadline overview, and reading queue.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { getSuggestedReadings } from "../../api/readingApi";
import { UpcomingDeadlinesWidget } from "../../components/Modules/Deadlines/UpcomingDeadlinesWidget";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";
import StatStrip from "../../components/Common/StatStrip/StatStrip";
import { useCountUp } from "../../hooks/useCountUp";
import ReadingsPanel from "./ReadingsPanel";
import SmartNudge from "./SmartNudge";
import styles from "./MyModulesDashboard.module.css";

function useDashboardData() {
  const [deadlines, setDeadlines] = useState([]);
  const [readings, setReadings] = useState([]);
  useEffect(() => {
    getUpcomingDeadlines().then((list) => setDeadlines(list || [])).catch(() => setDeadlines([]));
    getSuggestedReadings().then((list) => setReadings(list || [])).catch(() => setReadings([]));
  }, []);
  return { deadlines, readings, setReadings };
}

function countEnrolled(modules, enrollments) {
  if (!modules || !enrollments) return 0;
  return modules.filter((module) => isEnrolledIn(module.id, enrollments)).length;
}

function useStatItems(modules, enrollments, deadlines, readings) {
  const enrolledCount = useMemo(() => countEnrolled(modules, enrollments), [modules, enrollments]);
  const enrolledRef = useCountUp(enrolledCount, 1200);
  const deadlinesRef = useCountUp(deadlines.length, 1200);
  const readingsRef = useCountUp(readings.length, 1200);
  return [
    { key: "enrolled-modules", label: "Enrolled modules", value: enrolledCount, valueRef: enrolledRef },
    { key: "upcoming-deadlines", label: "Upcoming assignment deadlines", value: deadlines.length, valueRef: deadlinesRef },
    { key: "readings-to-do", label: "Readings to do", value: readings.length, valueRef: readingsRef },
  ];
}

function handleReadingAdded(setReadings, readingId) {
  setReadings((items) => items.filter((item) => item.id !== readingId));
}

export default function MyModulesDashboard({ modules, enrollments }) {
  const { deadlines, readings, setReadings } = useDashboardData();
  const statItems = useStatItems(modules, enrollments, deadlines, readings);
  return (
    <motion.div className={styles.dashboard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <SmartNudge deadlines={deadlines} readings={readings} onReadingAdded={(id) => handleReadingAdded(setReadings, id)} />
      <StatStrip items={statItems} />
      <div className={styles.widgetRow}>
        <UpcomingDeadlinesWidget deadlines={deadlines} initialShown={4} />
        <ReadingsPanel readings={readings} onReadingAdded={(id) => handleReadingAdded(setReadings, id)} />
      </div>
    </motion.div>
  );
}
