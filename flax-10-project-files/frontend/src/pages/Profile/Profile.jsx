/**
 * Profile page composition and layout.
 */
import { useEffect, useMemo, useState } from "react";
import analyticsService from "../../api/analyticsApi";
import { fetchApi } from "../../api/client";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import { useAuth } from "../../context/AuthContext";
import AchievementsModal from "./AchievementsModal";
import { ProfileCalendar } from "./ProfileCalendar";
import styles from "./ProfilePage.module.css";
import ProfileHeader from "./components/ProfileHeader";
import ProfileSkeleton from "./components/ProfileSkeleton";
import {
  CommonGroundSection,
  CompatibilityScore,
  CompactAttendanceTile,
  CompactStreakTile,
  FocusHeatmapWidget,
  ModulesSection,
  QuickStatsRail,
  StudyDNA,
  ThisWeek,
} from "./components/ProfileWidgets";
import { useProfileBodyData, useProfileContent, useProfileState } from "./hooks/useProfile";
import { useProfileSummary } from "./hooks/useProfileSummary";
import { useProfileVisibility } from "./hooks/useProfileVisibility";
import ProfileModals, { SocietiesModal } from "./ProfileModals";
import { useProfileHeaderState } from "./useProfileHeaderState";

function SkelBlock({ className }) {
  return <div className={`${styles.skel} ${className || ""}`} />;
}

function SkeletonGrid() {
  return ["Persona", "Week", "Dna", "Heatmap"].map((type) => (
    <SkelBlock key={type} className={styles[`skel${type}`]} />
  ));
}

function useProfileAnalytics(canViewAnalytics) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!canViewAnalytics) return;
    analyticsService.getSummary(90).then(setData).catch(() => {});
  }, [canViewAnalytics]);
  return data;
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, hour) => grid.reduce((sum, row) => sum + (row[hour] || 0), 0));
  const maxTotal = Math.max(...totals);
  return maxTotal > 0 ? totals.indexOf(maxTotal) : null;
}

function useCurrentUserSummary(isSelf) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    if (isSelf) return;
    fetchApi("/profile/summary/").then(setSummary).catch(() => {});
  }, [isSelf]);
  return summary;
}

function useSuggestionState(viewedUserId) {
  const [state, setState] = useState("idle");
  const submit = async () => {
    if (!viewedUserId || state === "sending") return;
    setState("sending");
    try {
      await fetchApi("/profile/study-together/", { method: "POST", body: JSON.stringify({ target_user_id: viewedUserId }) });
      setState("sent");
    } catch {
      setState("error");
    }
  };
  return { state, submit };
}

function saveWeeklyGoal(goalHours, refetch) {
  return fetchApi("/profile/", { method: "PATCH", body: JSON.stringify({ weekly_goal_hours: goalHours }) }).then(refetch);
}

function SharedCalendarSection({ events }) {
  return (
    <div className={styles.calendarSection}>
      <div className={styles.sectionLabel}>SHARED CALENDAR</div>
      <ProfileCalendar allEvents={events || []} />
    </div>
  );
}

function SelfProfileColumns({ summary, analyticsData, onNavigate, onGoalSave }) {
  return (
    <div className={styles.leftCol}>
      <div className={styles.leftTopMetricsRow}>
        <CompactAttendanceTile onNavigate={onNavigate} />
        <div className={styles.leftTopSideCol}>
          <div className={styles.leftTopStreakCard}><CompactStreakTile streaks={summary?.streaks} /></div>
          <div className={styles.leftTopWeekCard}><ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} showStreak={false} onGoalSave={onGoalSave} /></div>
          <StudyDNA heatmap={analyticsData?.heatmap} className={styles.leftTopStudyDnaCard} />
        </div>
      </div>
      <FocusHeatmapWidget heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
    </div>
  );
}

function CompatibilityCell({ summary, currentUserSummary, sharedModuleCount, modules, onSuggestStudySession, suggestionState }) {
  return (
    <div className={styles.compatibilityCell}>
      <CompatibilityScore viewedSummary={summary} currentUserSummary={currentUserSummary} sharedModuleCount={sharedModuleCount} totalModuleCount={Math.max((modules || []).length, 1)} activitySparkline={summary?.activity_sparkline} onSuggestStudySession={onSuggestStudySession} suggestionState={suggestionState} />
    </div>
  );
}

function TeacherInsightsRow({ modules, onNavigate, ...compatProps }) {
  return (
    <div className={styles.otherInsightsRow}>
      <div className={styles.secondaryInsightCell}><ModulesSection modules={modules} onNavigate={onNavigate} role="teacher" /></div>
      <CompatibilityCell modules={modules} onNavigate={onNavigate} {...compatProps} />
    </div>
  );
}

function CommonGroundInsightsRow({ modules, summary, currentUserModules, currentUserSummary, onNavigate, ...compatProps }) {
  return (
    <div className={styles.otherInsightsRow}>
      <div className={styles.secondaryInsightCell}>
        <CommonGroundSection viewedModules={modules} viewedSocieties={summary?.societies} currentUserModules={currentUserModules} currentUserSocieties={currentUserSummary?.societies} onNavigate={onNavigate} />
      </div>
      <CompatibilityCell modules={modules} summary={summary} currentUserSummary={currentUserSummary} onNavigate={onNavigate} {...compatProps} />
    </div>
  );
}

function OtherProfileColumns(props) {
  const { summary, modules, currentUserModules, currentUserSummary, role, onNavigate, onSuggestStudySession, suggestionState } = props;
  const sharedModuleCount = (modules || []).filter((mc) => (currentUserModules || []).includes(mc)).length;
  const hasCommonGround = role !== "teacher" && ((modules || []).length > 0 || (summary?.societies || []).length > 0);
  const showTeacherInsights = role === "teacher" && (modules?.length > 0 || (summary && currentUserSummary));
  const compatProps = { summary, currentUserSummary, sharedModuleCount, onSuggestStudySession, suggestionState };
  return (
    <div className={styles.singleCol}>
      <QuickStatsRail totalHours={summary?.total_hours} sessionCount={summary?.session_count} moduleCount={modules?.length || 0} hideZeroItems={role === "teacher"} />
      {showTeacherInsights && <TeacherInsightsRow modules={modules} onNavigate={onNavigate} {...compatProps} />}
      {!showTeacherInsights && !hasCommonGround && <CompatibilityCell modules={modules} onNavigate={onNavigate} {...compatProps} />}
      {!showTeacherInsights && hasCommonGround && <CommonGroundInsightsRow modules={modules} summary={summary} currentUserModules={currentUserModules} currentUserSummary={currentUserSummary} onNavigate={onNavigate} {...compatProps} />}
    </div>
  );
}

function ProfileHome(props) {
  const { onNavigate, visibility, viewedUserId, viewedUser, modules, role, viewedUsername, onBadgesReady, onPersonaReady, onSocietiesReady } = props;
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const analyticsData = useProfileAnalytics(visibility.canViewAnalytics);
  const currentUserSummary = useCurrentUserSummary(visibility.isSelf);
  const { profile: currentUserProfile } = useAuth();
  const peakHour = useMemo(() => computePeakHour(analyticsData?.heatmap?.data), [analyticsData]);
  const currentUserModules = currentUserProfile?.modules || [];
  const suggestion = useSuggestionState(viewedUserId);
  useEffect(() => onBadgesReady?.(summary?.badges || []), [onBadgesReady, summary?.badges]);
  useEffect(() => onPersonaReady?.(summary?.persona || null, peakHour), [onPersonaReady, peakHour, summary?.persona]);
  useEffect(() => onSocietiesReady?.(summary?.societies || []), [onSocietiesReady, summary?.societies]);
  if (loading) return <ProfileSkeleton blocks={<SkeletonGrid />} />;
  if (visibility.isSelf) return <SelfProfileColumns summary={summary} analyticsData={analyticsData} onNavigate={onNavigate} onGoalSave={(goal) => saveWeeklyGoal(goal, refetch)} />;
  return <OtherProfileColumns summary={summary} modules={modules} currentUserModules={currentUserModules} currentUserSummary={currentUserSummary} viewedUsername={viewedUsername} viewedUser={viewedUser} role={role} onNavigate={onNavigate} onSuggestStudySession={suggestion.submit} suggestionState={suggestion.state} />;
}

function ProfileHeaderSection({ user, profileData, state, visibility, onNavigate }) {
  const header = useProfileHeaderState(profileData, visibility, state.handlers.reload);
  return (
    <>
      <ProfileHeader user={profileData || user} profileData={profileData} handlers={state.handlers} visibility={visibility} badges={header.badges} pinnedBadgeId={header.pinnedBadgeId} onPinBadge={header.handlePinBadge} onViewAllBadges={header.openAchievements} persona={header.persona} peakHour={header.peakHour} societies={header.societies} onNavigate={onNavigate} onSocietiesClick={header.openSocieties} />
      <ProfileHome onNavigate={onNavigate} visibility={visibility} viewedUserId={state.viewedUserId} viewedUser={profileData || user} modules={state.modules} role={profileData?.role || user?.role} viewedUsername={profileData?.username || user?.username} onBadgesReady={header.setBadges} onPersonaReady={header.setPersonaState} onSocietiesReady={header.setSocieties} />
      {visibility.canViewCalendar && <SharedCalendarSection events={state.filteredEvents} />}
      {header.showAchievements && <AchievementsModal badges={header.badges} onClose={header.closeAchievements} />}
      {header.showSocieties && <SocietiesModal isOpen societies={header.societies} onClose={header.closeSocieties} onNavigate={onNavigate} />}
    </>
  );
}

function ProfileBody({ user, state, visibility, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);
  const contentState = { ...state, handlers, modules, upcomingEventCount, filteredEvents, profileData };
  return <ProfileHeaderSection user={user} profileData={profileData} state={contentState} visibility={visibility} onNavigate={onNavigate} />;
}

function ProfileFrame({ user, state, visibility, onNavigate, backLabel, onBack }) {
  if (state.loading) return <ProfileSkeleton blocks={<SkeletonGrid />} />;
  if (!state.profileData && !user) return <EmptyState title="Profile unavailable" message="We couldn't load this profile right now." />;
  return (
    <div className={styles.container}>
      <ScrollToTop />
      {onBack && <div className={styles.backButtonWrapper}><BackButton label={backLabel} onClick={onBack} /></div>}
      <div className={styles.content}><ProfileBody user={user} state={state} visibility={visibility} onNavigate={onNavigate} /></div>
    </div>
  );
}

export default function Profile({ user, viewedUserId, onNavigate, onNavChange, onBack, backLabel = "Back" }) {
  const navigate = onNavigate || onNavChange;
  const state = useProfileState(viewedUserId);
  const body = useProfileBodyData(state);
  const visibility = useProfileVisibility(user, state.profileData, viewedUserId);
  return (
    <>
      <ProfileFrame user={user} state={state} visibility={visibility} onNavigate={navigate} backLabel={backLabel} onBack={onBack} />
      <ProfileModals user={user} state={state} modules={body.modules} filteredEvents={body.filteredEvents} visibility={visibility} onNavChange={navigate} />
    </>
  );
}
