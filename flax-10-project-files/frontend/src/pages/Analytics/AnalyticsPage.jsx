/*
 * Analytics page shell.
 */

import AIInsightsTab from '../../components/Analytics/AIInsightsTab';
import AppPage from '../../components/common/AppPage/AppPage';
import { SegmentedControl, Tabs } from '../../components/common';
import AnalyticsOverview from './components/AnalyticsOverview';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import { BackToTop } from '../../components/Pagination/Pagination';
import { PERIODS, TABS } from './pageConfig';
import { useAnalyticsPageState } from './pageState';
import styles from './AnalyticsPage.module.css';

const analyticsSubtitle = (
  <>
    See your <em>study patterns</em>, <em>focus habits</em>, and <em>performance trends</em>.
  </>
);

const getOverviewContent = (loading, data, progressData, themeStats) =>
  (!loading && data ? <AnalyticsOverview data={data} progressData={progressData} themeStats={themeStats} /> : null);

const getTabContent = (loading, period) => (!loading ? <AIInsightsTab period={period} /> : null);

const getTabs = (loading, period, data, progressData, themeStats) => [
  {
    ...TABS[0],
    content: getOverviewContent(loading, data, progressData, themeStats)
  },
  {
    ...TABS[1],
    content: getTabContent(loading, period)
  },
];

function ErrorBanner({ error }) {
  return error ? <div className={styles.errorBanner}>{error}</div> : null;
}

function LoadingState({ loading }) {
  return loading ? <AnalyticsSkeleton /> : null;
}

export default function AnalyticsPage() {
  const { activeTab, handlePeriodChange, handleTabChange, period } = useAnalyticsPageState();
  const { data, error, loading, progressData, themeStats } = useAnalyticsOverview(period);
  const tabs = getTabs(loading, period, data, progressData, themeStats);
  return (
    <AppPage
      width="xl"
      className={styles.page}
      title="Analytics"
      subtitle={analyticsSubtitle}
      action={<SegmentedControl options={PERIODS} value={period} onChange={handlePeriodChange} />}>
      <ErrorBanner error={error} />
      <LoadingState loading={loading} />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} layoutId="analyticsTab" tabVariant="heading" />
      <BackToTop />
    </AppPage>
  );
}
