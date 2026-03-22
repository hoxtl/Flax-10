/*
 * Analytics page shell.
 */

import AppPage from '../../components/common/AppPage/AppPage';
import { SegmentedControl, Tabs } from '../../components/common';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import getAnalyticsTabs from './components/AnalyticsPageTabs';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import { BackToTop } from '../../components/Pagination/Pagination';
import { PERIODS } from './pageConfig';
import { useAnalyticsPageState } from './pageState';
import styles from './AnalyticsPage.module.css';

const analyticsSubtitle = (
  <>
    See your <em>study patterns</em>, <em>focus habits</em>, and{" "}
    <em>performance trends</em>.
  </>
);

function ErrorBanner({ error }) {
  return error ? <div className={styles.errorBanner}>{error}</div> : null;
}

function LoadingState({ loading }) {
  return loading ? <AnalyticsSkeleton /> : null;
}

function PeriodAction({ onChange, period }) {
  return <SegmentedControl options={PERIODS} value={period} onChange={onChange} />;
}

export default function AnalyticsPage() {
  const { activeTab, handlePeriodChange, handleTabChange, period } = useAnalyticsPageState();
  const { data, error, loading, progressData, themeStats } = useAnalyticsOverview(period);
  const tabs = getAnalyticsTabs({ data, loading, period, progressData, themeStats });
  return (
    <AppPage
      width="xl"
      className={styles.page}
      title="Analytics"
      subtitle={analyticsSubtitle}
      action={<PeriodAction period={period} onChange={handlePeriodChange} />}
    >
      <ErrorBanner error={error} />
      <LoadingState loading={loading} />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} layoutId="analyticsTab" tabVariant="heading" />
      <BackToTop />
    </AppPage>
  );
}
