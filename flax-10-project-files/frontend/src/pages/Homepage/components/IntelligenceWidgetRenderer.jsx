/**
 * Intelligence widget renderer registry.
 */

import React from "react";
import { BarChart3, LayoutGrid, Presentation, TrendingUp, Zap } from "lucide-react";
import { getEventType } from "../../../components/Calendar/utils/eventUtils";
import SharedWidgetHeader from "../../../components/Common/WidgetHeader/WidgetHeader";
import styles from "./IntelligenceRow.module.css";
import { IntelligenceHero } from "./IntelligenceWidgets";
import { RightNowWidget } from "./RightNowWidget";
import { HomepageTimelineSection } from "./HomepageTimelineSection";
import SemesterOverviewWidget from "./SemesterOverviewWidget";
import StudyStreakWidget from "./StudyStreakWidget";
import WeeklyGoalWidget from "./WeeklyGoalWidget";
import PhotoWidget from "./PhotoWidget";
import ProductivityCards from "../../../components/Analytics/ProductivityCards";
import DailyBreakdownChart from "../../../components/Analytics/DailyBreakdownChart";
import StudyHeatmap from "../../../components/Analytics/StudyHeatmap";
import AttendanceChart from "../../../components/Analytics/AttendanceChart";
import { ConsistencyScore, PeakHoursCard } from "../../../components/Analytics/InsightCards";
import { TinyTimelineWidget } from "./TinyTimelineWidget";

export function renderIntelligenceWidget(id, props, size) {
  return (widgetRegistry[id] || renderUnknown)(props, size);
}

const widgetRegistry = {
  hero: renderHero,
  rightNow: renderRightNow,
  todayTasks: renderTodayTasks,
  deadlines: renderDeadlines,
  tinyTimeline: renderTinyTimeline,
  bigTimeline: renderBigTimeline,
  semesterOverview: renderSemester,
  studyStreak: renderStudyStreak,
  weeklyGoal: renderWeeklyGoal,
  photo: renderPhoto,
  analyticsProductivity: renderProductivity,
  analyticsInsights: renderInsights,
  analyticsDailyBreakdown: renderDailyBreakdown,
  analyticsHeatmap: renderHeatmap,
  analyticsAttendance: renderAttendance,
};

function renderHero(props) {
  const isTeacher = props.profile?.role === "teacher";
  return (
    <IntelligenceHero
      displayName={props.displayName}
      attendancePct={props.dashboard.attendance.pct}
      classesCount={props.dashboard.live.classesCount}
      liveContext={props.dashboard.live.liveContext}
      tasksCount={props.dashboard.live.tasksCount}
      deadlinesCount={countUpcomingDeadlines(props.upcomingDeadlines)}
      upcomingSocietyEventsCount={countUpcomingSocietyEvents(props.calendarEvents?.length ? props.calendarEvents : props.slot5Data?.sortedEvents, props.profile?.summary?.societies, props.slot5Data?.now)}
      courseChangeRequest={props.dashboard.courseChangeRequest}
      teacherRequestPending={props.dashboard.teacherRequestPending}
      onDismissCourseChange={() => props.dashboard.setShowCourseChange(false)}
      onDismissTeacherRequest={() => props.dashboard.setShowTeacherRequest(false)}
      isTeacher={isTeacher}
    />
  );
}

function renderRightNow(props) {
  return <RightNowWidget {...props.slot5Data} tflDelays={props.dashboard.tflDelays} />;
}

function renderTodayTasks(props, size) {
  return cloneSlot(props.slot1TodayTasks, size.row);
}

function renderDeadlines(props, size) {
  return cloneSlot(props.slot3Urgent, size.row);
}

function renderTinyTimeline(props, size) {
  return <TinyTimelineWidget {...props.slot5Data} row={size.row} />;
}

function renderBigTimeline(props, size) {
  if (props.timelineProps) {
    return <HomepageTimelineSection {...props.timelineProps} row={size.row} isWidget />;
  }
  return cloneSlot(props.slot6Timeline, size.row, { isWidget: true });
}

function renderSemester(_props, size) {
  return <SemesterOverviewWidget row={size.row} />;
}

function renderStudyStreak() {
  return <StudyStreakWidget />;
}

function renderWeeklyGoal() {
  return <WeeklyGoalWidget />;
}

function renderPhoto(props) {
  return <PhotoWidget editMode={props.dashboard.edit} />;
}

function renderProductivity(props) {
  return <AnalyticsShell empty="No productivity data yet." icon={TrendingUp} loading={props.dashboard.analytics.loading} title="PRODUCTIVITY">{props.dashboard.analytics.data?.summary ? <div className={styles.analyticsScrollable}><ProductivityCards balanced data={props.dashboard.analytics.data} progressData={props.dashboard.analytics.progressData} /></div> : null}</AnalyticsShell>;
}

function renderInsights(props) {
  return <AnalyticsShell empty="No insights data yet." icon={Zap} loading={props.dashboard.analytics.loading} title="INSIGHTS">{props.dashboard.analytics.data?.summary ? <div className={styles.analyticsInsightsRow}><ConsistencyScore data={props.dashboard.analytics.data} /><PeakHoursCard data={props.dashboard.analytics.data} /></div> : null}</AnalyticsShell>;
}

function renderDailyBreakdown(props) {
  return <AnalyticsShell empty="No daily-breakdown data yet." icon={BarChart3} loading={props.dashboard.analytics.loading} title="DAILY BREAKDOWN">{Array.isArray(props.dashboard.analytics.data?.daily_breakdown) && props.dashboard.analytics.data.daily_breakdown.length > 0 ? <DailyBreakdownChart data={props.dashboard.analytics.data.daily_breakdown} /> : null}</AnalyticsShell>;
}

function renderHeatmap(props) {
  return <AnalyticsShell empty="No focus heatmap data yet." icon={LayoutGrid} loading={props.dashboard.analytics.loading} title="FOCUS HEATMAP">{props.dashboard.analytics.data?.heatmap?.data?.length ? <StudyHeatmap heatmapData={props.dashboard.analytics.data.heatmap} /> : null}</AnalyticsShell>;
}

function renderAttendance() {
  return <AnalyticsShell empty={null} icon={Presentation} loading={false} title="ATTENDANCE"><AttendanceChart /></AnalyticsShell>;
}

function AnalyticsShell({ children, empty, icon: Icon, loading, title }) {
  return (
    <div className={styles.analyticsWidgetShell}>
      <AnalyticsHeader Icon={Icon} title={title} />
      {loading ? <div className={styles.analyticsWidgetLoading}>Loading analytics…</div> : children || <div className={styles.analyticsWidgetEmpty}>{empty}</div>}
    </div>
  );
}

function AnalyticsHeader({ Icon, title }) {
  return <SharedWidgetHeader icon={Icon} title={title} />;
}

function cloneSlot(slot, row, extraProps = {}) {
  return React.isValidElement(slot) ? React.cloneElement(slot, { row, ...extraProps }) : slot;
}

function renderUnknown() {
  return null;
}

function countUpcomingDeadlines(deadlines = []) {
  return deadlines.filter((deadline) => deadline?.start_due_date).length;
}

function countUpcomingSocietyEvents(events = [], societies = [], now = new Date()) {
  const membershipIds = new Set((societies || []).map((society) => society?.society_id ?? society?.id).filter((value) => value != null).map(String));
  const membershipNames = new Set((societies || []).map((society) => String(society?.name || "").trim().toLowerCase()).filter(Boolean));
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + 14);
  return events.filter((event) => isMatchingSocietyEvent(event, membershipIds, membershipNames) && isWithinUpcomingWindow(event, start, end)).length;
}

function isWithinUpcomingWindow(event, start, end) {
  if (!event?.start_time) return false;
  const eventStart = new Date(event.start_time);
  return eventStart >= start && eventStart <= end;
}

function isMatchingSocietyEvent(event, membershipIds, membershipNames) {
  const isSocietyEvent = getEventType(event) === "society" || event?.society_id || event?.society_name;
  if (!isSocietyEvent) return false;
  if (membershipIds.size === 0 && membershipNames.size === 0) return true;
  const societyId = event?.society_id != null ? String(event.society_id) : "";
  const societyName = String(event?.society_name || "").trim().toLowerCase();
  return (societyId && membershipIds.has(societyId)) || (societyName && membershipNames.has(societyName));
}
