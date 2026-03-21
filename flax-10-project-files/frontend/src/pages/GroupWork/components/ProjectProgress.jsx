/*
 * GroupWork project progress bar.
 */

import { useState } from "react";
import StatStrip from "../../../components/common/StatStrip/StatStrip";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import styles from "./ProjectProgress.module.css";

function ProgressSegments({ segments, hoveredSeg, setHoveredSeg }) {
  return segments.map((segment, index) => <ProgressSegment key={segment.id ?? index} segment={segment} index={index} segments={segments} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />);
}

function ProgressSegment({ segment, index, segments, hoveredSeg, setHoveredSeg }) {
  const hoveredKey = segment.id ?? index;
  return (
    <Tooltip content={segment.name} wrapperClassName={styles.segmentTooltipWrap}>
      <div
        className={styles.progressSegment}
        style={buildSegmentStyle(segment, index, segments, hoveredSeg)}
        onMouseEnter={() => setHoveredSeg(hoveredKey)}
        onMouseLeave={() => setHoveredSeg(null)}
        aria-label={`${segment.name} segment`}
      />
    </Tooltip>
  );
}

function buildSegmentStyle(segment, index, segments, hoveredSeg) {
  return {
    width: `${segment.percentage}%`,
    background: segment.color || (segment.id === "unassigned" ? "#c0b8b0" : "#7BB38E"),
    opacity: hoveredSeg && hoveredSeg !== (segment.id ?? index) ? 0.65 : 1,
    zIndex: segments.length - index,
  };
}

export default function ProjectProgress({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  return (
    <div className={styles.progressContainer}>
      <StatStrip items={buildProjectStats(taskStats)} className={styles.projectStatsStrip} />
      <div className={styles.progressBarOuter}>
        <div className={styles.progressBarInner}>
          <ProgressSegments segments={taskStats.segments || []} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />
        </div>
      </div>
    </div>
  );
}

function buildProjectStats(taskStats) {
  const remaining = Math.max((taskStats.total || 0) - (taskStats.completed || 0), 0);
  return [
    { key: "overall", value: `${taskStats.percent || 0}%`, label: "Overall", tone: "accent" },
    { key: "complete", value: taskStats.completed || 0, label: "Tasks complete", tone: "success" },
    { key: "remaining", value: remaining, label: "Remaining", tone: "danger" },
  ];
}
