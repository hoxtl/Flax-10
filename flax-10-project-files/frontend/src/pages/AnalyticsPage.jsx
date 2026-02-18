import { useState, useEffect } from 'react';
import analyticsService from '../api/analyticsService';
import SummaryCards from '../components/Analytics/SummaryCards';
import ProductivityCards from '../components/Analytics/ProductivityCards';
import StudyHoursChart from '../components/Analytics/StudyHoursChart';
import DailyBreakdownChart from '../components/Analytics/DailyBreakdownChart';
import StudyHeatmap from '../components/Analytics/StudyHeatmap';
import PlannedVsActualChart from '../components/Analytics/PlannedVsActualChart';
import ThemeUsageChart from '../components/Analytics/ThemeUsageChart';
import AIInsightsTab from '../components/Analytics/AIInsightsTab';
import { ConsistencyScore, PeakHoursCard } from '../components/Analytics/InsightCards';
import styles from './AnalyticsPage.module.css';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'ai', label: '🤖 AI Insights' },
];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [analyticsData, progress, themeStats] = await Promise.all([
          analyticsService.getSummary(period),
          analyticsService.getProgress(period),
          analyticsService.getThemeStats(period),
        ]);
        setData(analyticsData);
        setProgressData(progress);
        setThemeData(themeStats);
        setError(null);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [period]);

  if (loading) return <div className={styles.loading}>Loading analytics...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.noData}>No data available</div>;

  return (
    <div className={styles.analyticsPage}>
      <div className={styles.header}>
        <h1>Study Analytics</h1>
        <div className={styles.periodSelector}>
          {[7, 30, 90].map(d => (
            <button key={d} className={period === d ? styles.active : ''} onClick={() => setPeriod(d)}>
              {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <SummaryCards summary={data.summary} />
          </section>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Productivity</h2>
            <ProductivityCards summary={data.summary} progressSummary={progressData?.summary} />
          </section>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Insights</h2>
            <div className={styles.insightCardsRow}>
              <ConsistencyScore summary={data.summary} progressSummary={progressData?.summary} periodDays={period} />
              <PeakHoursCard heatmapData={data.heatmap.data} />
            </div>
          </section>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h2>Study Hours Over Time</h2>
              <StudyHoursChart data={data.daily_breakdown} />
            </div>
            <div className={styles.chartCard}>
              <h2>Daily Work vs Break</h2>
              <DailyBreakdownChart data={data.daily_breakdown} />
            </div>
            {progressData && (
              <div className={styles.chartCard}>
                <h2>Planned vs Actual Study Time</h2>
                <PlannedVsActualChart data={progressData.daily_progress} />
              </div>
            )}
            <div className={styles.chartCard}>
              <h2>Study Pattern Heatmap</h2>
              <StudyHeatmap heatmapData={data.heatmap} />
            </div>
            {themeData && (
              <div className={styles.chartCard}>
                <h2>Light vs Dark Mode Usage</h2>
                <ThemeUsageChart themeStats={themeData} />
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'ai' && <AIInsightsTab period={period} />}
    </div>
  );
};

export default AnalyticsPage;
