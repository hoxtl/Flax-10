/*
 * Analytics page shell.
 */

import AppPage from '../../components/common/app_page/AppPage';
import { SegmentedControl, Tabs } from '../../components/common';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb.jsx';
import { useAuth } from '../../context/AuthContext';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import getAnalyticsTabs from './components/AnalyticsPageTabs';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import EmptyState from '../../components/common/empty_state/EmptyState';
import { BackToTop } from '../../components/pagination/Pagination';
<<<<<<< HEAD
import { PERIODS } from './utils/pageConfig';
import { useAnalyticsPageState } from './hooks/pageState';
import styles from './styles/AnalyticsPage.module.css';
=======
import { PERIODS } from './pageConfig';
import { useAnalyticsPageState } from './pageState';
import styles from './AnalyticsPage.module.css';
>>>>>>> main

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

function NoSessionsEmptyState() {
  return (
    <EmptyState
      icon="📊"
      title="No study data yet"
      description="Start a session with the Timer and your analytics will appear here — study patterns, focus habits, and performance trends."
      action={
        <button
          className={styles.emptyStateBtn}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "timer" }))}
        >
          Open Timer
        </button>
      }
    />
  );
}

function AnalyticsContent({ tabs, activeTab, handleTabChange, error, loading, hasNoData }) {
  if (!loading && hasNoData) return <NoSessionsEmptyState />;
  return (
    <>
      <ErrorBanner error={error} />
      <LoadingState loading={loading} />
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        layoutId="analyticsTab"
        tabVariant="heading"
        className={styles.analyticsTabs}
        tabClassName={styles.analyticsTabButton}
      />
      <BackToTop />
    </>
  );
}

export default function AnalyticsPage() {
  const { activeTab, handlePeriodChange, handleTabChange, period } = useAnalyticsPageState();
  const { data, error, loading, progressData, themeStats } = useAnalyticsOverview(period);
  const { profile } = useAuth();
  const tabs = getAnalyticsTabs({ data, loading, period, progressData, themeStats, isTeacher: profile?.role === "teacher" });
  const hasNoData = !loading && !error && Number(data?.summary?.total_sessions ?? 0) === 0;
  return (
    <AppPage width="xl" className={styles.page} title="Analytics" subtitle={analyticsSubtitle} action={<PeriodAction period={period} onChange={handlePeriodChange} />}>
      <Breadcrumb crumbs={[{ label: "Analytics" }]} />
      <AnalyticsContent tabs={tabs} activeTab={activeTab} handleTabChange={handleTabChange} error={error} loading={loading} hasNoData={hasNoData} />
    </AppPage>
  );
}
