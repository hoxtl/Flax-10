/*
 * GroupWork overview stats cards.
 */

import StatStrip from "../../../components/common/stat_strip/StatStrip";
import { useCountUp } from "../../../hooks/useCountUp";
import styles from "./GroupWorkStats.module.css";
import { getNextDeadline, getProgressStats } from "../utils/projectStatsUtils";

function buildDeadlineStatItem(deadline, deadlineCountRef) {
    return {
        key: "next-deadline",
        label: "Upcoming deadlines",
        value: deadline.project ? deadline.days : "--",
        valueRef: deadline.project ? deadlineCountRef : undefined,
        tooltip: deadline.project ? deadline.project.name : undefined,
        tone: deadline.project ? "danger" : undefined,
    };
}
const GroupWorkStats = ({ projects }) => {
    const safeProjects = projects || [];
    const progress = getProgressStats(safeProjects);
    const deadline = getNextDeadline(safeProjects);
    const projectCountRef = useCountUp(safeProjects.length, 1200);
    const deadlineCountRef = useCountUp(deadline.project ? deadline.days : 0, 1200);
    const progressCountRef = useCountUp(progress.percent, 1200);
    const items = [
        { key: "active-projects", label: "Active projects", value: safeProjects.length, valueRef: projectCountRef },
        buildDeadlineStatItem(deadline, deadlineCountRef),
        { key: "overall-progress", label: "Overall progress", value: progress.percent, valueRef: progressCountRef, suffix: "%", tone: progress.percent > 0 ? "success" : undefined },
    ];
    return <StatStrip className={styles.statsStrip} items={items} />;
};

export default GroupWorkStats;
