import { useState, useEffect } from "react";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { getDeadlineCountdown, getDeadlineUrgency, formatDeadlineDateTime, DEADLINE_LABELS } from "./utils/deadlineUtils";
import styles from "./DeadlinesWidget.module.css";

export default function DeadlinesWidget() {
    const deadlines = useUpcomingDeadlines();
    if (!deadlines.length) return null;
    return (
        <div className={styles.widget}>
            <span className={styles.heading}>Upcoming Deadlines</span>
            {deadlines.map(deadline => <DeadlineRow key={deadline.id} deadline={deadline} />)}
        </div>
    );
}

function useUpcomingDeadlines() {
    const [deadlines, setDeadlines] = useState([]);
    useEffect(() => {
        getUpcomingDeadlines().then(setDeadlines).catch(() => {});
    }, []);
    return deadlines;
}

function DeadlineRow({ deadline }) {
    const urgency = getDeadlineUrgency(deadline.start_due_date);
    const countdown = getDeadlineCountdown(deadline.start_due_date );
    return (
        <div className={`${styles.row} ${styles[urgency]}`}>
            <span className={styles.icon}>⏳</span>
            <DeadlineRowBody deadline={deadline} />
            <span className={`${styles.countdown} ${styles[urgency]}`}>{countdown}</span>
        </div>
    );
}

function DeadlineRowBody({ deadline }) {
    return (
        <div className={styles.body}>
            <div className={styles.titleRow}>
                <span className={styles.type}>{DEADLINE_LABELS[deadline.deadline_type]}</span>
                <span className={styles.title}>{deadline.title}</span>
            </div>
            <span className={styles.date}>{formatDeadlineDateTime(deadline.start_due_date)}</span>
        </div>
    );
}