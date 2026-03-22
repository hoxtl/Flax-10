/*
 * GroupWork project progress bar.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import StatStrip from "../../../components/common/StatStrip/StatStrip";
import { useCountUp } from "../../../hooks/useCountUp";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import styles from "./ProjectProgress.module.css";

function buildSegmentStyle(segment, hoveredSeg, hoveredKey) {
    return {
        background: segment.color || (segment.id === "unassigned" ? "#c0b8b0" : "#7BB38E"),
        opacity: hoveredSeg && hoveredSeg !== hoveredKey ? 0.65 : 1,
    };
}

function ProgressSegments({ segments, hoveredSeg, setHoveredSeg }) {
    return segments.map((segment, index) => <ProgressSegment key={segment.id ?? index} segment={segment} index={index} segments={segments} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />);
}

function ProgressSegment({ segment, index, segments, hoveredSeg, setHoveredSeg }) {
    const hoveredKey = segment.id ?? index;
    return (
        <motion.div style={{ height: "100%", flex: "0 0 auto", zIndex: segments.length - index }} initial={{ width: "0%" }} animate={{ width: `${segment.percentage}%` }} transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <Tooltip content={segment.tooltip || segment.name} wrapperClassName={styles.segmentTooltipWrap}>
                <div className={styles.progressSegment} style={buildSegmentStyle(segment, hoveredSeg, hoveredKey)} onMouseEnter={() => setHoveredSeg(hoveredKey)} onMouseLeave={() => setHoveredSeg(null)} aria-label={`${segment.name} segment`} />
            </Tooltip>
        </motion.div>
    );
}

export default function ProjectProgress({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const percentRef = useCountUp(taskStats.percent || 0, 1000);
  const completedRef = useCountUp(taskStats.completed || 0, 1000);
  const remaining = Math.max((taskStats.total || 0) - (taskStats.completed || 0), 0);
  const remainingRef = useCountUp(remaining, 1000);
  return (
    <div className={styles.progressContainer}>
      <StatStrip items={buildProjectStats(taskStats, percentRef, completedRef, remainingRef)} className={styles.projectStatsStrip} />
      <div className={styles.progressBarOuter}>
        <div className={styles.progressBarInner}>
          <ProgressSegments segments={taskStats.segments || []} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />
        </div>
      </div>
    </div>
  );
}

function buildProjectStats(taskStats, percentRef, completedRef, remainingRef) {
  const remaining = Math.max((taskStats.total || 0) - (taskStats.completed || 0), 0);
  return [
    { key: "overall", value: taskStats.percent || 0, suffix: "%", label: "Overall", tone: "accent", valueRef: percentRef },
    { key: "complete", value: taskStats.completed || 0, label: "Tasks complete", tone: "success", valueRef: completedRef },
    { key: "remaining", value: remaining, label: "Remaining", tone: "danger", valueRef: remainingRef },
  ];
}
