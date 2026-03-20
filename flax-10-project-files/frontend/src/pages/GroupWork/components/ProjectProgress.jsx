import React, { useState } from "react";
import { motion } from "framer-motion";
import { getUserColor } from "../utils/priorityUtils";
import styles from "./ProjectProgress.module.css";

function ProgressSegments({ segments, hoveredSeg, setHoveredSeg }) {
  const transition = { duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.2 };
  
  return segments.map((seg, idx) => (
    <motion.div 
      key={seg.id ?? idx} 
      className={styles.progressSegment} 
      initial={{ width: 0 }}
      animate={{ width: `${seg.percentage}%` }}
      transition={transition}
      style={{ 
        background: seg.id === 'unassigned' ? '#c0b8b0' : getUserColor(seg.id), 
        opacity: hoveredSeg && hoveredSeg !== (seg.id ?? idx) ? 0.65 : 1,
        zIndex: segments.length - idx
      }} 
      onMouseEnter={() => setHoveredSeg(seg.id ?? idx)} 
      onMouseLeave={() => setHoveredSeg(null)} 
    />
  ));
}

export default function ProjectProgress({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const segments = taskStats.segments || [];
  const hovered = hoveredSeg !== null 
    ? segments.find(s => (s.id ?? s.name) === hoveredSeg) || segments[hoveredSeg] 
    : null;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBarOuter}>
        <div className={styles.progressBarInner}>
          <ProgressSegments segments={segments} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} />
        </div>
        {hovered && (
          <div className={styles.progressTooltip}>
            <span className={styles.tooltipDot} style={{ background: hovered.id === 'unassigned' ? '#c0b8b0' : getUserColor(hovered.id) }} />
            {hovered.tooltip || hovered.name}
          </div>
        )}
      </div>
      <div className={styles.statsText}>
        <span><strong>{taskStats.completed} / {taskStats.total}</strong> tasks complete</span>
        <span><strong>{taskStats.percent}%</strong> complete</span>
      </div>
    </div>
  );
}
