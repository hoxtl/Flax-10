/*
 * Analytics page tabs content.
 */

<<<<<<< HEAD
import AIInsightsTab from "../../../components/analytics/components/AIInsightsTab";
=======
import AIInsightsTab from "../../../components/analytics/AIInsightsTab";
>>>>>>> main

import AnalyticsOverview from "./AnalyticsOverview";
import { TABS } from "../utils/pageConfig";

const getOverviewContent = (loading, data, progressData, themeStats, isTeacher) =>
  (!loading && data ? <AnalyticsOverview data={data} progressData={progressData} themeStats={themeStats} isTeacher={isTeacher} /> : null);

const getInsightsContent = (loading, period) =>
  (!loading ? <AIInsightsTab period={period} /> : null);

export default function getAnalyticsTabs({ data, loading, period, progressData, themeStats, isTeacher }) {
  return [
    { ...TABS[0], content: getOverviewContent(loading, data, progressData, themeStats, isTeacher) },
    { ...TABS[1], content: getInsightsContent(loading, period) },
  ];
}
