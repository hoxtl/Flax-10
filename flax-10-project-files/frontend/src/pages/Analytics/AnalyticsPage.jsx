import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import analyticsService from '../../api/analyticsService';
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
import styles from './AnalyticsPage.module.css';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const TABS = [
  { id: 'Overview', icon: '📊' },
  { id: 'AI Insights', icon: '✨' },
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
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [themeStats, setThemeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summary, progress, theme] = await Promise.all([
          analyticsService.getSummary(period),
          analyticsService.getProgress(period),
          analyticsService.getThemeStats(period),
        ]);
        setData(summary);
        setProgressData(progress);
        setThemeStats(theme);
      } catch (err) {
        const message = err?.message || 'Failed to load analytics data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [period]);

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
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <motion.div
        className={styles.tabBar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <span>{icon}</span>
            <span>{id}</span>
            {activeTab === id && (
              <motion.div className={styles.tabIndicator} layoutId="tabIndicator" />
            )}
          </button>
        ))}
      </motion.div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading && (
        <div className={styles.skeletonWrap}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!loading && data && activeTab === 'Overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={styles.overviewWrap}
          >
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
                {
                  title: 'Study Hours',
                  el: <StudyHoursChart data={data.daily_breakdown} />,
                  i: 2,
                },
                {
                  title: 'Daily Breakdown',
                  el: <DailyBreakdownChart data={data.daily_breakdown} />,
                  i: 3,
                },
                progressData && {
                  title: 'Planned vs Actual',
                  el: (
                    <div className={styles.chartContainerMin}>
                      <PlannedVsActualChart data={progressData.daily_progress} />
                    </div>
                  ),
                  i: 4,
                  wide: true,
                },
                {
                  title: 'Focus Heatmap',
                  el: <StudyHeatmap heatmapData={data.heatmap} />,
                  i: 5,
                  wide: true,
                },
                themeStats && {
                  title: 'Theme Usage',
                  el: <ThemeUsageChart themeStats={themeStats} />,
                  i: 6,
                },
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
          </motion.div>
        )}

        {!loading && activeTab === 'AI Insights' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <AIInsightsTab period={period} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
