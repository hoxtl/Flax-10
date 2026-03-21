/*
 * GroupWork project progress bar.
 */

import { useState } from "react";
import { getUserColor } from "../utils/priorityUtils";
import styles from "./ProjectProgress.module.css";

function ProgressSegments({ segments, hoveredSeg, setHoveredSeg }) {
  return segments.map((segment, index) => <ProgressSegment key={segment.id ?? index} segment={segment} index={index} segments={segments} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />);
}

function ProgressSegment({ segment, index, segments, hoveredSeg, setHoveredSeg }) {
  return <div className={styles.progressSegment} style={buildSegmentStyle(segment, index, segments, hoveredSeg)} onMouseEnter={() => setHoveredSeg(segment.id ?? index)} onMouseLeave={() => setHoveredSeg(null)} />;
}

function buildSegmentStyle(segment, index, segments, hoveredSeg) {
  return {
    width: `${segment.percentage}%`,
    background: segment.id === "unassigned" ? "#c0b8b0" : getUserColor(segment.id),
    opacity: hoveredSeg && hoveredSeg !== (segment.id ?? index) ? 0.65 : 1,
    zIndex: segments.length - index,
  };
}

export default function ProjectProgress({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const hovered = getHoveredSegment(taskStats.segments || [], hoveredSeg);
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBarOuter}>
        <div className={styles.progressBarInner}>
          <ProgressSegments segments={taskStats.segments || []} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />
        </div>
        {hovered && <ProgressTooltip segment={hovered} />}
      </div>
      <ProgressStats taskStats={taskStats} />
    </div>
  );
}

function getHoveredSegment(segments, hoveredSeg) {
  if (hoveredSeg === null) return null;
  return segments.find((segment) => (segment.id ?? segment.name) === hoveredSeg) || segments[hoveredSeg];
}

function ProgressTooltip({ segment }) {
  return (
    <div className={styles.progressTooltip}>
      <span className={styles.tooltipDot} style={{ background: segment.id === "unassigned" ? "#c0b8b0" : getUserColor(segment.id) }} />
      {segment.tooltip || segment.name}
    </div>
  );
}

function ProgressStats({ taskStats }) {
  return (
    <div className={styles.statsText}>
      <span><strong>{taskStats.completed} / {taskStats.total}</strong> tasks complete</span>
      <span><strong>{taskStats.percent}%</strong> complete</span>
    </div>
  );
}
