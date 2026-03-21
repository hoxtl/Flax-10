/*
 * My modules dashboard with stats, deadlines, and readings.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { getUpcomingDeadlines } from '../../api/deadlineApi';
import { getSuggestedReadings } from '../../api/readingApi';
import { UpcomingDeadlinesWidget } from '../../components/Modules/Deadlines/UpcomingDeadlinesWidget';
import { isEnrolledIn } from '../../components/Modules/utils/moduleUtils';
import { useCountUp } from '../../hooks/useCountUp';
import StatStrip from '../../components/common/StatStrip/StatStrip';
import SmartNudge from './SmartNudge';
import ReadingsPanel from './ReadingsPanel';
import dashStyles from './MyModulesDashboard.module.css';
import rowStyles from './DashboardRows.module.css';
const styles = { ...dashStyles, ...rowStyles };

const DEADLINES_INITIAL_SHOWN = 4;

function DeadlinesPanel({ deadlines }) {
    return (
        <UpcomingDeadlinesWidget deadlines={deadlines} initialShown={DEADLINES_INITIAL_SHOWN} />
    );
}

function useModuleData() {
    const [deadlines, setDeadlines] = useState([]);
    const [readings, setReadings] = useState([]);

    useEffect(() => {
        getUpcomingDeadlines()
            .then(list => setDeadlines(list || []))
            .catch(() => setDeadlines([]));
        getSuggestedReadings()
            .then(list => setReadings(list || []))
            .catch(() => setReadings([]));
    }, []);

    const handleReadingAdded = useCallback((readingId) => {
        setReadings(prev => prev.filter(r => r.id !== readingId));
    }, []);

    return { deadlines, readings, handleReadingAdded };
}

function countEnrolled(modules, enrollments) {
    if (!modules || !enrollments) return 0;
    return modules.filter(m => isEnrolledIn(m.id, enrollments)).length;
}

function useStatItems(modules, enrollments, deadlineCount, readingCount) {
    const enrolledCount = useMemo(() => countEnrolled(modules, enrollments), [modules, enrollments]);
    const enrolledRef = useCountUp(enrolledCount, 1200);
    const deadlinesRef = useCountUp(deadlineCount, 1200);
    const readingsRef = useCountUp(readingCount, 1200);
    return [
        { key: 'enrolled-modules', label: 'Enrolled modules', value: enrolledCount, valueRef: enrolledRef },
        { key: 'upcoming-deadlines', label: 'Upcoming assignment deadlines', value: deadlineCount, valueRef: deadlinesRef },
        { key: 'readings-to-do', label: 'Readings to do', value: readingCount, valueRef: readingsRef },
    ];
}

export default function MyModulesDashboard({ modules, enrollments }) {
    const { deadlines, readings, handleReadingAdded } = useModuleData();
    const statItems = useStatItems(modules, enrollments, deadlines.length, readings.length);
    return (
        <Motion.div className={styles.dashboard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <SmartNudge deadlines={deadlines} readings={readings} onReadingAdded={handleReadingAdded} />
            <StatStrip items={statItems} />
            <div className={styles.widgetRow}>
                <DeadlinesPanel deadlines={deadlines} />
                <ReadingsPanel readings={readings} onReadingAdded={handleReadingAdded} />
            </div>
        </Motion.div>
    );
}
