/*
 * Analytics page tabs content.
 */

import AIInsightsTab from "../../../components/Analytics/AIInsightsTab";

import AnalyticsOverview from "./AnalyticsOverview";
import { TABS } from "../pageConfig";

const getOverviewContent = (loading, data, progressData, themeStats) =>
  (!loading && data ? <AnalyticsOverview data={data} progressData={progressData} themeStats={themeStats} /> : null);

const getInsightsContent = (loading, period) =>
  (!loading ? <AIInsightsTab period={period} /> : null);

export default function getAnalyticsTabs({ data, loading, period, progressData, themeStats }) {
  return [
    { ...TABS[0], content: getOverviewContent(loading, data, progressData, themeStats) },
    { ...TABS[1], content: getInsightsContent(loading, period) },
  ];
}
