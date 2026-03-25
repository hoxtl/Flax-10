/*
 * Analytics overview tab content.
 */

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AttendanceChart from '../../../components/Analytics/AttendanceChart';
import DailyBreakdownChart from '../../../components/Analytics/DailyBreakdownChart';
import { ConsistencyScore, PeakHoursCard } from '../../../components/Analytics/InsightCards';
import PlannedVsActualChart from '../../../components/Analytics/PlannedVsActualChart';
import ProductivityCards from '../../../components/Analytics/ProductivityCards';
import StudyHeatmap from '../../../components/Analytics/StudyHeatmap';
import StudyHoursChart from '../../../components/Analytics/StudyHoursChart';
import SummaryCards from '../../../components/Analytics/SummaryCards';
import ThemeUsageChart from '../../../components/Analytics/ThemeUsageChart';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import { fadeUp } from '../pageConfig';
import styles from '../AnalyticsPage.module.css';

const MotionDiv = motion.div;
const MotionSection = motion.section;

const getChartItems = (data, progressData, themeStats, isTeacher) => [
  { index: 2, title: 'Study Hours', element: <StudyHoursChart data={data.daily_breakdown} /> },
  { index: 3, title: 'Daily Breakdown', element: <DailyBreakdownChart data={data.daily_breakdown} /> },
  getProgressChart(progressData),
  { index: 5, title: 'Focus Heatmap', element: <StudyHeatmap heatmapData={data.heatmap} />, wide: true },
  getThemeChart(themeStats),
  !isTeacher ? { index: 7, title: 'Attendance', element: <AttendanceChart /> } : null,
].filter(Boolean);

function getProgressChart(progressData) {
  if (!progressData) return null;
  return {
    index: 4,
    title: 'Planned vs Actual',
    element: <div className={styles.chartContainerMin}><PlannedVsActualChart data={progressData.daily_progress} /></div>,
    wide: true,
  };
}

function getThemeChart(themeStats) {
  if (!themeStats) return null;
  return { index: 6, title: 'Theme Usage', element: <ThemeUsageChart themeStats={themeStats} /> };
}

function AnimatedSection({ children, index }) {
  return (
    <MotionSection custom={index} variants={fadeUp} initial="hidden" animate="visible">
      {children}
    </MotionSection>
  );
}

function InsightsSection({ data, progressData }) {
  return (
    <MotionDiv className={styles.twoCol} custom={1} variants={fadeUp} initial="hidden" animate="visible">
      <div className={styles.card}>
        <p className={styles.cardLabel}>Productivity</p>
        <ProductivityCards data={data} progressData={progressData} />
      </div>
      <div className={styles.card}>
        <p className={styles.cardLabel}>Insights</p>
        <div className={styles.insightRow}>
          <ConsistencyScore data={data} />
          <PeakHoursCard data={data} />
        </div>
      </div>
    </MotionDiv>
  );
}

function ChartCard({ title, element, index, wide }) {
  return (
    <MotionDiv
      className={`${styles.card} ${wide ? styles.wide : ''}`}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <p className={styles.cardLabel}>{title}</p>
      {element}
    </MotionDiv>
  );
}

function ChartsGrid({ data, progressData, themeStats, isTeacher }) {
  return (
    <div className={styles.chartsGrid}>
      {getChartItems(data, progressData, themeStats, isTeacher).map(({ title, element, index, wide }) => (
        <ChartCard key={title} title={title} element={element} index={index} wide={wide} />
      ))}
    </div>
  );
}

function hasStudyData(data) {
  const summary = data?.summary ?? {};
  return Number(summary.total_sessions || 0) > 0 || Number(summary.total_study_hours || 0) > 0;
}

function AnalyticsEmptyState() {
  return (
    <div className={`${styles.card} ${styles.emptyOverviewCard}`}>
      <EmptyState
        icon={<BarChart3 size={22} strokeWidth={2} />}
        title="No analytics yet"
        description="Analytics turns Timer sessions into study trends, focus heatmaps, and planning insights. Start a study session and this page will fill in automatically."
        action={(
          <div className={styles.emptyOverviewActions}>
            <Link to="/timer" className={styles.emptyOverviewLink}>Open Timer</Link>
            <Link to="/calendar" className={`${styles.emptyOverviewLink} ${styles.emptyOverviewLinkSecondary}`}>See Calendar</Link>
          </div>
        )}
      />
    </div>
  );
}

export default function AnalyticsOverview({ data, progressData, themeStats, isTeacher }) {
  if (!hasStudyData(data)) return <AnalyticsEmptyState />;
  return (
    <div className={styles.overviewWrap}>
      <AnimatedSection index={0}><SummaryCards data={data} /></AnimatedSection>
      <InsightsSection data={data} progressData={progressData} />
      <ChartsGrid data={data} progressData={progressData} themeStats={themeStats} isTeacher={isTeacher} />
    </div>
  );
}
