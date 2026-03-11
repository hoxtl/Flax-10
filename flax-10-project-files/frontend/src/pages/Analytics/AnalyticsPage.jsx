import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader/PageHeader';
import SummaryCards from '../../components/Analytics/SummaryCards';
import ProductivityCards from '../../components/Analytics/ProductivityCards';
import StudyHoursChart from '../../components/Analytics/StudyHoursChart';
import DailyBreakdownChart from '../../components/Analytics/DailyBreakdownChart';
import StudyHeatmap from '../../components/Analytics/StudyHeatmap';
import PlannedVsActualChart from '../../components/Analytics/PlannedVsActualChart';
import ThemeUsageChart from '../../components/Analytics/ThemeUsageChart';
import AIInsightsTab from '../../components/Analytics/AIInsightsTab';
import { ConsistencyScore, PeakHoursCard } from '../../components/Analytics/InsightCards';
import PageSkeleton from '../../components/common/LoadingState/PageSkeleton';
import Tabs from '../../components/common/Tabs/Tabs';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import styles from './AnalyticsPage.module.css';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const TABS = [
  { id: 'Overview', icon: '📊', label: 'Overview' },
  { id: 'AI Insights', icon: '✨', label: 'AI Insights' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPeriod = Number(searchParams.get('period'));
  const requestedTab = searchParams.get('tab');
  const resolvedPeriod = useMemo(
    () => (PERIODS.some((item) => item.value === requestedPeriod) ? requestedPeriod : 30),
    [requestedPeriod],
  );
  const resolvedTab = useMemo(
    () => (TABS.some((item) => item.id === requestedTab) ? requestedTab : 'Overview'),
    [requestedTab],
  );
  const [period, setPeriod] = useState(resolvedPeriod);
  const [activeTab, setActiveTab] = useState(resolvedTab);
  const { data, progressData, themeStats, loading, error } = useAnalyticsOverview(period);

  useEffect(() => {
    setPeriod(resolvedPeriod);
  }, [resolvedPeriod]);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const updateSearchState = (nextPeriod, nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('period', String(nextPeriod));
    next.set('tab', nextTab);
    setSearchParams(next, { replace: true });
  };

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    updateSearchState(nextPeriod, activeTab);
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    updateSearchState(period, nextTab);
  };

  const overviewContent = !loading && data ? (
    <div className={styles.overviewWrap}>
      <motion.section custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <SummaryCards data={data} />
      </motion.section>

      <motion.div className={styles.twoCol} custom={1} variants={fadeUp} initial="hidden" animate="visible">
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
      </motion.div>

      <div className={styles.chartsGrid}>
        {[
          { title: 'Study Hours', el: <StudyHoursChart data={data.daily_breakdown} />, i: 2 },
          { title: 'Daily Breakdown', el: <DailyBreakdownChart data={data.daily_breakdown} />, i: 3 },
          progressData && {
            title: 'Planned vs Actual',
            el: <div className={styles.chartContainerMin}><PlannedVsActualChart data={progressData.daily_progress} /></div>,
            i: 4,
            wide: true,
          },
          { title: 'Focus Heatmap', el: <StudyHeatmap heatmapData={data.heatmap} />, i: 5, wide: true },
          themeStats && { title: 'Theme Usage', el: <ThemeUsageChart themeStats={themeStats} />, i: 6 },
        ].filter(Boolean).map(({ title, el, i, wide }) => (
          <motion.div
            key={title}
            className={`${styles.card} ${wide ? styles.wide : ''}`}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <p className={styles.cardLabel}>{title}</p>
            {el}
          </motion.div>
        ))}
      </div>
    </div>
  ) : null;

  const tabs = [
    { ...TABS[0], content: overviewContent },
    { ...TABS[1], content: !loading ? <AIInsightsTab period={period} /> : null },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Analytics"
        subtitle="Your study patterns & performance"
        action={
          <div className={styles.periodToggle}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                className={`${styles.periodBtn} ${period === p.value ? styles.periodActive : ''}`}
                onClick={() => handlePeriodChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <div className={styles.errorBanner}>{error}</div>}
      {loading && <PageSkeleton label="Loading analytics" cardCount={6} cardHeight="100px" columns={3} />}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} layoutId="analyticsTab" />
    </div>
  );
}
