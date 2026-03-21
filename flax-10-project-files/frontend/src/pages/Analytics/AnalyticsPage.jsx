/*
 * Analytics page shell.
 */

<<<<<<< HEAD
import AppPage from '../../components/common/app_page/AppPage';
import { SegmentedControl, Tabs } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import getAnalyticsTabs from './components/AnalyticsPageTabs';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import { BackToTop } from '../../components/pagination/Pagination';
import { PERIODS } from './pageConfig';
=======
import AIInsightsTab from '../../components/Analytics/AIInsightsTab';
import AppPage from '../../components/common/AppPage/AppPage';
import { TabBar, TabContent, SegmentedControl } from '../../components/common';
import AnalyticsOverview from './components/AnalyticsOverview';
import AnalyticsSkeleton from './components/AnalyticsSkeleton';
import useAnalyticsOverview from './hooks/useAnalyticsOverview';
import { BackToTop } from '../../components/Pagination/Pagination';
import { PERIODS, TABS } from './pageConfig';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useAnalyticsPageState } from './pageState';
import styles from './AnalyticsPage.module.css';

const analyticsSubtitle = (
  <>
<<<<<<< HEAD
    See your <em>study patterns</em>, <em>focus habits</em>, and{" "}
    <em>performance trends</em>.
  </>
);
=======
    See your <em>study patterns</em>, <em>focus habits</em>, and <em>performance trends</em>.
  </>
);

const getOverviewContent = (loading, data, progressData, themeStats) =>
  (!loading && data ? <AnalyticsOverview data={data} progressData={progressData} themeStats={themeStats} /> : null);

const getTabContent = (loading, period) => (!loading ? <AIInsightsTab period={period} /> : null);

const getTabs = (loading, period, data, progressData, themeStats) => [
  {
    ...TABS[0],
    label: <span className={styles.tabLabel}><span>{TABS[0].icon}</span> {TABS[0].label}</span>,
    content: getOverviewContent(loading, data, progressData, themeStats)
  },
  {
    ...TABS[1],
    label: <span className={styles.tabLabel}><span>{TABS[1].icon}</span> {TABS[1].label}</span>,
    content: getTabContent(loading, period)
  },
];
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function ErrorBanner({ error }) {
  return error ? <div className={styles.errorBanner}>{error}</div> : null;
}

function LoadingState({ loading }) {
  return loading ? <AnalyticsSkeleton /> : null;
}

<<<<<<< HEAD
function PeriodAction({ onChange, period }) {
  return <SegmentedControl options={PERIODS} value={period} onChange={onChange} />;
}

function AnalyticsContent({ tabs, activeTab, handleTabChange, error, loading }) {
  return (
    <>
      <ErrorBanner error={error} />
      <LoadingState loading={loading} />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} layoutId="analyticsTab" tabVariant="heading" />
      <BackToTop />
    </>
  );
}

export default function AnalyticsPage() {
  const { activeTab, handlePeriodChange, handleTabChange, period } = useAnalyticsPageState();
  const { data, error, loading, progressData, themeStats } = useAnalyticsOverview(period);
  const { profile } = useAuth();
  const tabs = getAnalyticsTabs({ data, loading, period, progressData, themeStats, isTeacher: profile?.role === "teacher" });
  return (
    <AppPage width="xl" className={styles.page} title="Analytics" subtitle={analyticsSubtitle} action={<PeriodAction period={period} onChange={handlePeriodChange} />}>
      <AnalyticsContent tabs={tabs} activeTab={activeTab} handleTabChange={handleTabChange} error={error} loading={loading} />
=======
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
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} layoutId="analyticsTab" variant="heading" />
      <TabContent activeTab={activeTab}>
        {tabs.find(t => t.id === activeTab)?.content}
      </TabContent>
      <BackToTop />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </AppPage>
  );
}
