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
import { PersonaCard, StudyDNA, MiniHeatmap, ThisWeek, BadgesSection, SocietiesSection } from "./components/ProfileWidgets";

function useModuleNameMap() {
  const [nameMap, setNameMap] = useState({});
  useEffect(() => {
    getModules().then(data => {
      const list = Array.isArray(data) ? data : data?.results || [];
      setNameMap(Object.fromEntries(list.filter(m => m.module_code).map(m => [m.module_code, m.module_name])));
    }).catch(() => { });
  }, []);
  return nameMap;
}

function ModulesGrid({ modules, onNavigate }) {
  const nameMap = useModuleNameMap();
  if (!modules?.length) return null;
  return (
    <div className={styles.modulesGrid}>
      {modules.map((code, i) => (
        <button key={i} className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
          <span className={styles.moduleIcon}>📚</span><span className={styles.moduleCode}>{code}</span>
          {nameMap[code] && <span className={styles.moduleName}>{nameMap[code]}</span>}
        </button>
      ))}
    </div>
  );
}

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

function ProfileHome({ onNavigate, visibility, viewedUserId }) {
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const analyticsData = useProfileAnalytics(visibility.canViewAnalytics);
  const [showAchievements, setShowAchievements] = useState(false);
  const peakHour = useMemo(() => computePeakHour(analyticsData?.heatmap?.data), [analyticsData]);

  if (loading) return <Skeleton />;

  return (
    <div className={styles.profileHome}>
      {visibility.isSelf && <PersonaCard persona={summary?.persona} peakHour={peakHour} />}
      <ProfileColumns summary={summary} analyticsData={analyticsData} visibility={visibility} onNavigate={onNavigate} refetch={refetch} onShowAchievements={() => setShowAchievements(true)} />
      {showAchievements && <AchievementsModal badges={summary?.badges} onClose={() => setShowAchievements(false)} />}
    </div>
  );
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + (row[h] || 0), 0));
  return Math.max(...totals) > 0 ? totals.indexOf(Math.max(...totals)) : null;
}

function ProfileColumns({ summary, analyticsData, visibility, onNavigate, refetch, onShowAchievements }) {
  if (!visibility.isSelf) {
    return (
      <div className={styles.singleCol}>
        {visibility.canViewAchievements && <BadgesSection badges={summary?.badges} onOpen={onShowAchievements} />}
        {visibility.canViewSocieties && <SocietiesSection societies={summary?.societies} onNavigate={onNavigate} />}
      </div>
    );
  }
  return (
    <div className={styles.twoCol}>
      <div className={styles.leftCol}>
        <ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} onGoalSave={n => fetchApi('/profile/', { method: 'PATCH', body: JSON.stringify({ weekly_goal_hours: n }) }).then(refetch)} />
        <StudyDNA heatmap={analyticsData?.heatmap} />
        <MiniHeatmap heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
      </div>
      <div className={styles.rightCol}>
        <BadgesSection badges={summary?.badges} onOpen={onShowAchievements} />
        <SocietiesSection societies={summary?.societies} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function ProfileContent({ user, state, visibility, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);
  return (
    <div className={styles.content}>
      <ProfileHeader user={profileData || user} profileData={profileData} upcomingEventCount={upcomingEventCount} handlers={handlers} visibility={visibility} />
      <ModulesGrid modules={modules} onNavigate={onNavigate} />
      <ProfileHome onNavigate={onNavigate} visibility={visibility} viewedUserId={state.viewedUserId} />
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
