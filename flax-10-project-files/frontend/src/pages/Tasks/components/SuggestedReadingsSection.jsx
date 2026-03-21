/*
 * Suggested readings section for reading lists on the tasks page.
 */

import { useState, useEffect, useMemo } from "react";
import { getSuggestedReadings, getReadingSpeed } from "../../../api/readingApi";

import sectionStyles from "./TaskFeedSections.module.css";
import { isReadingList, matchesReadingList, getReadingListLabel } from "../utils/readingListUtils";
import styles from "./SuggestedReadingsSection.module.css";
import { SuggestedReadingsHeader, SuggestedReadingsBody, SuggestedReadingsCollapse } from "./SuggestedReadingsSectionParts";

function useSuggestedReadings(taskCount) {
  const [readings, setReadings] = useState([]);
  const [speedData, setSpeedData] = useState(null);
  useEffect(() => {
    async function load() {
      const [readingsData, speed] = await Promise.all([getSuggestedReadings(), getReadingSpeed()]);
      setReadings(readingsData || []);
      setSpeedData(speed);
    }
    load().catch(() => {
      setReadings([]);
      setSpeedData(null);
    });
  }, [taskCount]);
  return { readings, setReadings, speedData };
}

function useFilteredSuggestedReadings(activeList, readings) {
  return useMemo(() => {
    if (!activeList || !isReadingList(activeList)) return readings;
    return readings.filter((reading) => matchesReadingList(reading, activeList));
  }, [activeList, readings]);
}

export default function SuggestedReadingsSection({ activeList, onTaskAdded, taskCount, pendingTasks = [], completedTasks = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const { readings, setReadings, speedData } = useSuggestedReadings(taskCount);
  const filteredReadings = useFilteredSuggestedReadings(activeList, readings);
  const handleAdded = (readingId) => { setReadings((prev) => prev.filter((reading) => reading.id !== readingId)); onTaskAdded?.(); };

  return (
    <div className={`${sectionStyles.section} ${styles.section}`}>
      <SuggestedReadingsHeader count={filteredReadings.length} collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} speedData={speedData} />
      <SuggestedReadingsCollapse collapsed={collapsed}>
        <div className={`${sectionStyles.sectionBody} ${styles.body}`}>
          <SuggestedReadingsBody activeListLabel={getReadingListLabel(activeList)} readings={filteredReadings} pendingTasks={pendingTasks} completedTasks={completedTasks} onAdded={handleAdded} avgMinPerPage={speedData?.avg_min_per_page} />
        </div>
      </SuggestedReadingsCollapse>
    </div>
  );
}
