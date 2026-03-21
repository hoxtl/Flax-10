import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import AchievementsModal from "./AchievementsModal";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import styles from "./Profile.module.css";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import ProfileModals from "./ProfileModals";
import { ProfileCalendar } from "./ProfileCalendar";
import { useProfileState, useProfileBodyData, useProfileContent } from "./hooks/useProfile";
import { useProfileSummary } from "./hooks/useProfileSummary";
import { useProfileVisibility } from "./hooks/useProfileVisibility";
import analyticsService from "../../api/analyticsService";
import { fetchApi } from "../../api/client";
import ProfileHeader from "./components/ProfileHeader";
import { SocietiesModal } from "./ProfileModals";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import {
  CompactAttendanceTile,
  CompactStreakTile,
  FocusHeatmapWidget,
  StudyDNA,
  ThisWeek,
  ModulesSection,
  QuickStatsRail,
  CommonGroundSection,
  CompatibilityScore,
} from "./components/ProfileWidgets";

function SkelBlock({ className }) {
  return <div className={`${styles.skel} ${className || ""}`} />;
}

function Skeleton() {
  return (
    <div className={styles.skeletonWrap}>
      {["Persona", "Week", "Dna", "Heatmap"].map(ty => (
        <SkelBlock key={ty} className={styles[`skel${ty}`]} />
      ))}
      <div className={styles.skelBadgeRow}>
        {[...Array(5)].map((_, i) => <SkelBlock key={i} className={styles.skelBadge} />)}
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className={styles.skelHeader}>
      <SkelBlock className={styles.skelAvatar} />
      <div className={styles.skelHeaderInfo}>
        <SkelBlock className={styles.skelName} />
        <SkelBlock className={styles.skelBio} />
        <div className={styles.skelStatsRow}>
          {[...Array(3)].map((_, i) => <SkelBlock key={i} className={styles.skelStat} />)}
        </div>
      </div>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className={styles.skelBody}>
      <div className={styles.skelLeftCol}>
        {["Persona", "Week", "Dna", "Heatmap"].map(ty => (
          <SkelBlock key={ty} className={styles[`skel${ty}`]} />
        ))}
      </div>
      <div className={styles.skelRightCol}>
        {[...Array(3)].map((_, i) => <SkelBlock key={i} className={styles.skelWidget} />)}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className={`${styles.container} ${styles.fullSkelContainer}`}>
      <SkeletonHeader />
      <SkeletonBody />
    </div>
  );
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + (row[h] || 0), 0));
  return Math.max(...totals) > 0 ? totals.indexOf(Math.max(...totals)) : null;
}

function useProfileAnalytics(isSelf) {
  const [data, setData] = useState(null);
  useEffect(() => { if (isSelf) analyticsService.getSummary(90).then(setData).catch(() => {}); }, [isSelf]);
  return data;
}

function useCurrentUserSummary(isSelf) {
  const [currentUserSummary, setCurrentUserSummary] = useState(null);
  useEffect(() => {
    if (isSelf) return;
    fetchApi("/profile/summary/").then(setCurrentUserSummary).catch(() => {});
  }, [isSelf]);
  return currentUserSummary;
}

function useSummaryCallbacks(summary, peakHour, onBadgesReady, onPersonaReady, onSocietiesReady) {
  useEffect(() => { if (summary?.badges) onBadgesReady?.(summary.badges); }, [summary?.badges, onBadgesReady]);
  useEffect(() => { if (summary?.persona) onPersonaReady?.(summary.persona, peakHour); }, [summary?.persona, peakHour, onPersonaReady]);
  useEffect(() => { if (summary?.societies !== undefined) onSocietiesReady?.(summary.societies || []); }, [summary?.societies, onSocietiesReady]);
}

function ProfileHome({ onNavigate, visibility, viewedUserId, modules, role, onBadgesReady, viewedUsername, onPersonaReady, onSocietiesReady }) {
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const analyticsData = useProfileAnalytics(visibility.canViewAnalytics);
  const peakHour = useMemo(() => computePeakHour(analyticsData?.heatmap?.data), [analyticsData]);
  const { profile: currentUserProfile } = useAuth();
  const currentUserModules = currentUserProfile?.modules || [];
  const currentUserSummary = useCurrentUserSummary(visibility.isSelf);
  useSummaryCallbacks(summary, peakHour, onBadgesReady, onPersonaReady, onSocietiesReady);
  if (loading) return <Skeleton />;
  return (
    <div className={styles.profileHome}>
      <ProfileColumns key={viewedUserId || "self"} summary={summary} analyticsData={analyticsData} visibility={visibility} onNavigate={onNavigate} refetch={refetch} modules={modules} role={role} viewedUsername={viewedUsername} currentUserModules={currentUserModules} currentUserSummary={currentUserSummary} viewedUserId={viewedUserId} />
    </div>
  );
}

function useStudySuggestion(viewedUserId) {
  const [suggestionState, setSuggestionState] = useState("idle");
  const handleSuggestStudySession = async () => {
    if (!viewedUserId || suggestionState === "sending") return;
    setSuggestionState("sending");
    try {
      await fetchApi("/profile/study-together/", { method: "POST", body: JSON.stringify({ target_user_id: viewedUserId }) });
      setSuggestionState("sent");
    } catch {
      setSuggestionState("error");
    }
  };
  return { suggestionState, handleSuggestStudySession };
}

function OtherUserView({ summary, modules, currentUserModules, currentUserSummary, viewedUsername, role, onNavigate, suggestionState, onSuggestStudySession }) {
  return (
    <div className={styles.singleCol}>
      <CompatibilityScore viewedSummary={summary} currentUserSummary={currentUserSummary} sharedModuleCount={(modules || []).filter(m => (currentUserModules || []).includes(m)).length} totalModuleCount={Math.max((modules || []).length, 1)} viewedUsername={viewedUsername} mutualConnections={summary?.mutual_connections} activitySparkline={summary?.activity_sparkline} onSuggestStudySession={onSuggestStudySession} suggestionState={suggestionState} />
      <QuickStatsRail totalHours={summary?.total_hours} sessionCount={summary?.session_count} moduleCount={modules?.length || 0} />
      {role === "teacher" ? <ModulesSection modules={modules} onNavigate={onNavigate} role="teacher" /> : <CommonGroundSection viewedModules={modules} viewedSocieties={summary?.societies} currentUserModules={currentUserModules} currentUserSocieties={currentUserSummary?.societies} viewedUsername={viewedUsername} onNavigate={onNavigate} />}
    </div>
  );
}

function SelfView({ summary, analyticsData, onNavigate, refetch }) {
  return (
    <div className={styles.leftCol}>
      <div className={styles.leftTopMetricsRow}>
          <CompactAttendanceTile onNavigate={onNavigate} />
          <div className={styles.leftTopSideCol}>
            <div className={styles.leftTopStreakCard}>
              <CompactStreakTile streaks={summary?.streaks} />
            </div>
            <div className={styles.leftTopWeekCard}>
              <ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} showStreak={false} onGoalSave={n => fetchApi("/profile/", { method: "PATCH", body: JSON.stringify({ weekly_goal_hours: n }) }).then(refetch)} />
            </div>
            <StudyDNA heatmap={analyticsData?.heatmap} className={styles.leftTopStudyDnaCard} />
          </div>
        </div>
      <FocusHeatmapWidget heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
    </div>
  );
}

function ProfileColumns({ summary, analyticsData, visibility, onNavigate, refetch, modules, role, viewedUsername, currentUserModules, currentUserSummary, viewedUserId }) {
  const { suggestionState, handleSuggestStudySession } = useStudySuggestion(viewedUserId);
  if (!visibility.isSelf) {
    return <OtherUserView summary={summary} modules={modules} currentUserModules={currentUserModules} currentUserSummary={currentUserSummary} viewedUsername={viewedUsername} role={role} onNavigate={onNavigate} suggestionState={suggestionState} onSuggestStudySession={handleSuggestStudySession} />;
  }
  return <SelfView summary={summary} analyticsData={analyticsData} onNavigate={onNavigate} refetch={refetch} />;
}

function useHeaderState() {
  const [headerBadges, setHeaderBadges] = useState([]);
  const [headerPersona, setHeaderPersona] = useState(null);
  const [headerPeakHour, setHeaderPeakHour] = useState(null);
  const [headerSocieties, setHeaderSocieties] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSocieties, setShowSocieties] = useState(false);
  return { headerBadges, setHeaderBadges, headerPersona, setHeaderPersona, headerPeakHour, setHeaderPeakHour, headerSocieties, setHeaderSocieties, showAchievements, setShowAchievements, showSocieties, setShowSocieties };
}

function buildPinBadgeHandler(visibility, handlers, profileData) {
  return async (badgeId) => {
    if (!visibility.canEditProfile) return;
    const current = String(profileData?.pinned_badge_id || "");
    const next = current === String(badgeId) ? "" : String(badgeId || "");
    try {
      await fetchApi("/profile/", { method: "PATCH", body: JSON.stringify({ pinned_badge_id: next }) });
      handlers.reload?.();
    } catch (err) {
      console.error("Failed to pin badge", err);
    }
  };
}

function SharedCalendarSection({ events }) {
  return (
    <div className={styles.calendarSection}>
      <div className={styles.cardLabel}>SHARED CALENDAR</div>
      <ProfileCalendar allEvents={events || []} />
    </div>
  );
}

function ProfileContent({ user, state, visibility, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);
  const hs = useHeaderState();
  const pinnedBadgeId = profileData?.pinned_badge_id || "";
  const handlePinBadge = buildPinBadgeHandler(visibility, handlers, profileData);
  return (
    <div className={styles.content}>
      <ProfileHeader user={profileData || user} profileData={profileData} taskCount={state.taskCount} upcomingEventCount={upcomingEventCount} handlers={handlers} visibility={visibility} badges={hs.headerBadges} pinnedBadgeId={pinnedBadgeId} onPinBadge={handlePinBadge} onViewAllBadges={() => hs.setShowAchievements(true)} persona={hs.headerPersona} peakHour={hs.headerPeakHour} societies={hs.headerSocieties} onNavigate={onNavigate} onSocietiesClick={() => hs.setShowSocieties(true)} />
      <ProfileHome onNavigate={onNavigate} visibility={visibility} viewedUserId={state.viewedUserId} modules={modules} role={profileData?.role || user?.role} onBadgesReady={hs.setHeaderBadges} onPersonaReady={(p, ph) => { hs.setHeaderPersona(p); hs.setHeaderPeakHour(ph); }} onSocietiesReady={hs.setHeaderSocieties} viewedUsername={profileData?.username || user?.username} />
      {visibility.canViewCalendar && <SharedCalendarSection events={filteredEvents} />}
      {hs.showAchievements && <AchievementsModal badges={hs.headerBadges} onClose={() => hs.setShowAchievements(false)} />}
      {hs.showSocieties && <SocietiesModal isOpen societies={hs.headerSocieties} onClose={() => hs.setShowSocieties(false)} onNavigate={onNavigate} />}
    </div>
  );
}

function ProfileNotFound() {
  return (
    <EmptyState
      icon="👤"
      title="Profile unavailable"
      description="Could not load this profile. Try logging out and back in, or return to the home page."
    />
  );
}

export default function Profile({ user, viewedUserId, onNavigate, onNavChange, onBack, backLabel = "Back" }) {
  const navFn = onNavigate || onNavChange;
  const state = useProfileState(viewedUserId);
  const visibility = useProfileVisibility(state.profileData, user);
  const { filteredEvents, modules } = useProfileBodyData(state);
  if (state.loading) return <ProfileSkeleton />;
  if (!state.profileData) return <div className={styles.container}><ProfileNotFound /></div>;
  return (
    <div className={styles.container}>
      {onBack && <BackButton onClick={onBack} label={backLabel} className={styles.backButton} />}
      <ProfileContent user={user} state={state} visibility={visibility} onNavigate={navFn} />
      <ProfileModals user={user} state={state} modules={modules} filteredEvents={filteredEvents} visibility={visibility} onNavChange={navFn} />
      <ScrollToTop containerSelector="[data-dashboard-main]" />
    </div>
  );
}
