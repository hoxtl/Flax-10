import React, { useState } from "react";
import { motion } from "framer-motion";
import MemberAvatar, { getDisplayName } from "./MemberAvatar";
import styles from "./ProjectRow.module.css";

const THEMES = {
  red: { pill: styles.daysRed, ring: "#ef4444" },
  orange: { pill: styles.daysOrange, ring: "#f97316" },
  yellow: { pill: styles.daysYellow, ring: "#eab308" },
  green: { pill: styles.daysGreen, ring: "#22c55e" },
  blue: { pill: styles.daysBlue, ring: "#3b82f6" },
  grey: { pill: styles.daysGrey || "", ring: "#94a3b8" },
};

function getProjectTheme(daysLeft) {
  if (daysLeft === null) return THEMES.blue;
  if (daysLeft <= 7) return THEMES.red;
  if (daysLeft <= 14) return THEMES.orange;
  if (daysLeft <= 30) return THEMES.yellow;
  return THEMES.green;
}

function ProgressCircle({ percent, ringColor }) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r={radius} stroke="var(--border)" strokeWidth="3" fill="none" />
      <motion.circle 
        cx="12" cy="12" r={radius} 
        stroke={ringColor} strokeWidth="3" fill="none" 
        strokeDasharray={circumference} 
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        strokeLinecap="round" 
        transform="rotate(-90 12 12)" 
      />
    </svg>
  );
}

export default function ProjectRow({ project, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateObj = project.deadline ? new Date(project.deadline) : null;
  const dateString = dateObj ? dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "--";
  const daysLeft = dateObj ? Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const theme = getProjectTheme(daysLeft);
  const totalTasks = project.task_count || 0;
  const completedTasks = project.completed_task_count || 0;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const members = project.members || [];
  
  return (
    <div className={styles.projectRowContainer}>
      <div className={styles.projectRow} onClick={() => setIsExpanded(!isExpanded)}>
        <ProjectInfo project={project} members={members} />
        <ProjectMeta dateString={dateString} daysLeft={daysLeft} theme={theme} percent={percent} isExpanded={isExpanded} />
      </div>
      {isExpanded && <ProjectAccordion project={project} percent={percent} completedTasks={completedTasks} totalTasks={totalTasks} onClick={onClick} />}
    </div>
  );
}

function ProjectInfo({ project, members }) {
    const avatarsToShow = members.slice(0, 3);
    const remainingCount = members.length > 3 ? members.length - 3 : 0;

    return (
        <div className={styles.projectInfoArea}>
            <div className={styles.projectIcon}>
                {project.name ? project.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className={styles.projectText}>
                <div className={styles.projectName}>{project.name}</div>
                {project.module_name && <div className={styles.projectModule}>{project.module_name}</div>}
                <div className={styles.avatarStack}>
                    {avatarsToShow.map((m, i) => (
                        <div key={m.id} className={styles.avatarWrapper} style={{ zIndex: 10 - i }} title={getDisplayName(m)}>
                            <MemberAvatar member={m} size={24} />
                        </div>
                    ))}
                    {remainingCount > 0 && <div className={styles.avatarPill}>+{remainingCount}</div>}
                </div>
            </div>
        </div>
    );
}

function ProjectMeta({ dateString, daysLeft, theme, percent, isExpanded }) {
    return (
        <div className={styles.projectMetaArea}>
            <div className={styles.deadlineInfo}>
                <div className={styles.deadlineDate}>{dateString}</div>
                {daysLeft !== null && (
                    <div className={`${styles.daysPill} ${theme.pill}`}>
                        {daysLeft < 0 ? 'Past due' : `${daysLeft} days`}
                    </div>
                )}
            </div>
            <div className={styles.progressCircleContainer}>
                <ProgressCircle percent={percent} ringColor={theme.ring} />
            </div>
            <div className={isExpanded ? styles.arrowIconUp : styles.arrowIcon}>↑</div>
        </div>
    );
}

function ProjectAccordion({ project, percent, completedTasks, totalTasks, onClick }) {
    return (
        <div className={styles.projectAccordion}>
            <div className={styles.accordionStats}>
                <StatBlock label="COMPLETION" value={`${percent}%`} />
                <StatBlock label="MEMBERS" value={project.member_count || 1} />
                <StatBlock label="TASKS DONE" value={`${completedTasks}/${totalTasks}`} />
            </div>
            <div className={styles.accordionActions}>
                <button className={styles.btnOpen} onClick={(e) => { e.stopPropagation(); onClick(); }}>Open project →</button>
            </div>
        </div>
    );
}

function StatBlock({ label, value }) {
    return (
        <div className={styles.statBlock}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue}>{value}</span>
        </div>
    );
}
