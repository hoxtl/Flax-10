import { useState, useEffect, useMemo } from "react";
import AchievementsModal from "./AchievementsModal";
import styles from "./Profile.module.css";
import ProfileModals from "./ProfileModals";
import { ProfileCalendar } from "./ProfileCalendar";
import { useProfileState, useProfileBodyData, useProfileContent } from "./hooks/useProfile";
import { useProfileSummary } from "./hooks/useProfileSummary";
import { useProfileVisibility } from "./hooks/useProfileVisibility";
import analyticsService from "../../api/analyticsService";
import { fetchApi } from "../../api/client";
import { getModules } from "../../api/moduleApi";
import ProfileHeader from "./components/ProfileHeader";
import {
  PersonaCard,
  StudyDNA,
  MiniHeatmap,
  ThisWeek,
  BadgesSection,
  SocietiesSection,
  ModulesSection
} from "./components/ProfileWidgets";

function Skeleton() {
  return (
    <div className={styles.skeletonWrap}>
      {['Persona', 'Week', 'Dna', 'Heatmap'].map(ty => <div key={ty} className={`${styles.skel} ${styles[`skel${ty}`]}`} />)}
      <div className={styles.skelBadgeRow}>{[...Array(5)].map((_, i) => <div key={i} className={`${styles.skel} ${styles.skelBadge}`} />)}</div>
    </div>
  );
}

function useProfileAnalytics(isSelf) {
  const [data, setData] = useState(null);
  useEffect(() => { if (isSelf) analyticsService.getSummary(90).then(setData).catch(() => { }); }, [isSelf]);
  return data;
}

function ProfileHome({ onNavigate, visibility, viewedUserId, modules }) {
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const analyticsData = useProfileAnalytics(visibility.canViewAnalytics);
  const [showAchievements, setShowAchievements] = useState(false);
  const peakHour = useMemo(() => computePeakHour(analyticsData?.heatmap?.data), [analyticsData]);

  if (loading) return <Skeleton />;

  return (
    <div className={styles.profileHome}>
      <ProfileColumns
        summary={summary}
        analyticsData={analyticsData}
        visibility={visibility}
        onNavigate={onNavigate}
        refetch={refetch}
        onShowAchievements={() => setShowAchievements(true)}
        modules={modules}
        peakHour={peakHour}
      />
      {showAchievements && <AchievementsModal badges={summary?.badges} onClose={() => setShowAchievements(false)} />}
    </div>
  );
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + (row[h] || 0), 0));
  return Math.max(...totals) > 0 ? totals.indexOf(Math.max(...totals)) : null;
}

function ProfileColumns({ summary, analyticsData, visibility, onNavigate, refetch, onShowAchievements, modules, peakHour }) {
  const bentoStack = (
    <>
      <ModulesSection modules={modules} onNavigate={onNavigate} />
      {visibility.canViewSocieties && <SocietiesSection societies={summary?.societies} onNavigate={onNavigate} />}
      {visibility.canViewAchievements && <BadgesSection badges={summary?.badges} onOpen={onShowAchievements} />}
    </>
  );

  if (!visibility.isSelf) {
    return <div className={styles.singleCol}>{bentoStack}</div>;
  }

  return (
    <div className={styles.twoCol}>
      <div className={styles.leftCol}>
        <PersonaCard persona={summary?.persona} peakHour={peakHour} />
        <ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} onGoalSave={n => fetchApi('/profile/', { method: 'PATCH', body: JSON.stringify({ weekly_goal_hours: n }) }).then(refetch)} />
        <StudyDNA heatmap={analyticsData?.heatmap} />
        <MiniHeatmap heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
      </div>
      <div className={styles.rightCol}>{bentoStack}</div>
    </div>
  );
}

function ProfileContent({ user, state, visibility, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);
  return (
    <div className={styles.content}>
      <ProfileHeader user={profileData || user} profileData={profileData} upcomingEventCount={upcomingEventCount} handlers={handlers} visibility={visibility} />
      <ProfileHome onNavigate={onNavigate} visibility={visibility} viewedUserId={state.viewedUserId} modules={modules} />
      {visibility.canViewCalendar && <SharedCalendarSection events={filteredEvents} />}
    </div>
  );
}

function SharedCalendarSection({ events }) {
  return (
    <div className={styles.calendarSection}>
      <div className={styles.cardLabel}>SHARED CALENDAR</div>
      <ProfileCalendar allEvents={events || []} />
    </div>
  );
}

export default function Profile({ user, viewedUserId, onNavigate, onNavChange }) {
  const navFn = onNavigate || onNavChange;
  const state = useProfileState(viewedUserId);
  state.onNavChange = navFn;

  const visibility = useProfileVisibility(state.profileData, user);
  const { filteredEvents, modules } = useProfileBodyData(state);

  if (state.loading) return <div className={styles.container}>Loading...</div>;
  if (!state.profileData) return <div className={styles.container}>User not found.</div>;

  return (
    <div className={styles.container}>
      <ProfileContent user={user} state={state} visibility={visibility} onNavigate={navFn} />
      <ProfileModals user={user} state={state} modules={modules} filteredEvents={filteredEvents} visibility={visibility} onNavChange={navFn} />
    </div>
  );
}
