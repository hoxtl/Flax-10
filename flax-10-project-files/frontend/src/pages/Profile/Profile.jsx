<<<<<<< HEAD
/**
 * Profile page composition and layout.
 */

import { useEffect } from "react";
import BackButton from "../../components/common/back_button/BackButton.jsx";
import EmptyState from "../../components/common/empty_state/EmptyState";
import ScrollToTop from "../../components/common/scroll_to_top/ScrollToTop";
import { useAuth } from "../../context/AuthContext";
import AchievementsModal from "./AchievementsModal";
=======
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import AchievementsModal from "./AchievementsModal";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import styles from "./Profile.module.css";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import ProfileModals from "./ProfileModals";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
import { saveWeeklyGoal, useCurrentUserSummary, usePeakHour, useProfileAnalytics, useSuggestionState } from "./hooks/useProfileInsights";
import { useProfileSummary } from "./hooks/useProfileSummary";
import { useProfileVisibility } from "./hooks/useProfileVisibility";
<<<<<<< HEAD
import ProfileModals, { SocietiesModal } from "./ProfileModals";
import { useProfileHeaderState } from "./useProfileHeaderState";
=======
import analyticsService from "../../api/analyticsApi";
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function SkelBlock({ className }) {
  return <div className={`${styles.skel} ${className || ""}`} />;
}

<<<<<<< HEAD
function SkeletonGrid() {
  return ["Persona", "Week", "Dna", "Heatmap"].map((type) => (
    <SkelBlock key={type} className={styles[`skel${type}`]} />
  ));
=======
/** Inner skeleton — shown while profile summary data loads (after header is visible) */
function Skeleton() {
  return (
    <div className={styles.skeletonWrap}>
      {['Persona', 'Week', 'Dna', 'Heatmap'].map(ty => (
        <SkelBlock key={ty} className={styles[`skel${ty}`]} />
      ))}
      <div className={styles.skelBadgeRow}>
        {[...Array(5)].map((_, i) => <SkelBlock key={i} className={styles.skelBadge} />)}
      </div>
    </div>
  );
}

/** Full-page skeleton — shown immediately when the profile route loads */
function ProfileSkeleton() {
  return (
    <div className={`${styles.container} ${styles.fullSkelContainer}`}>
      {/* Header */}
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
      {/* Two-column body */}
      <div className={styles.skelBody}>
        <div className={styles.skelLeftCol}>
          {['Persona', 'Week', 'Dna', 'Heatmap'].map(ty => (
            <SkelBlock key={ty} className={styles[`skel${ty}`]} />
          ))}
        </div>
        <div className={styles.skelRightCol}>
          {[...Array(3)].map((_, i) => <SkelBlock key={i} className={styles.skelWidget} />)}
        </div>
      </div>
    </div>
  );
}

function useProfileAnalytics(isSelf) {
  const [data, setData] = useState(null);
  useEffect(() => { if (isSelf) analyticsService.getSummary(90).then(setData).catch(() => { }); }, [isSelf]);
  return data;
}

function ProfileHome({ onNavigate, visibility, viewedUserId, modules, role, onBadgesReady, viewedUsername, onPersonaReady, onSocietiesReady }) {
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const analyticsData = useProfileAnalytics(visibility.canViewAnalytics);
  const peakHour = useMemo(() => computePeakHour(analyticsData?.heatmap?.data), [analyticsData]);

  const { profile: currentUserProfile } = useAuth();
  const currentUserModules = currentUserProfile?.modules || [];
  const [currentUserSummary, setCurrentUserSummary] = useState(null);

  useEffect(() => {
    if (visibility.isSelf) return;
    fetchApi('/profile/summary/')
      .then(d => setCurrentUserSummary(d))
      .catch(() => { });
  }, [visibility.isSelf]);

  useEffect(() => {
    if (summary?.badges) onBadgesReady?.(summary.badges);
  }, [summary?.badges, onBadgesReady]);

  useEffect(() => {
    if (summary?.persona) onPersonaReady?.(summary.persona, peakHour);
  }, [summary?.persona, peakHour, onPersonaReady]);

  useEffect(() => {
    if (summary?.societies !== undefined) onSocietiesReady?.(summary.societies || []);
  }, [summary?.societies, onSocietiesReady]);

  if (loading) return <Skeleton />;

  return (
    <div className={styles.profileHome}>
      <ProfileColumns
        key={viewedUserId || 'self'}
        summary={summary}
        analyticsData={analyticsData}
        visibility={visibility}
        onNavigate={onNavigate}
        refetch={refetch}
        modules={modules}
        role={role}
        viewedUsername={viewedUsername}
        currentUserModules={currentUserModules}
        currentUserSummary={currentUserSummary}
        viewedUserId={viewedUserId}
      />
    </div>
  );
}

function computePeakHour(grid) {
  if (!grid) return null;
  const totals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + (row[h] || 0), 0));
  return Math.max(...totals) > 0 ? totals.indexOf(Math.max(...totals)) : null;
}

function ProfileColumns({ summary, analyticsData, visibility, onNavigate, refetch, modules, role, viewedUsername, currentUserModules, currentUserSummary, viewedUserId }) {
  const [suggestionState, setSuggestionState] = useState('idle');

  const handleSuggestStudySession = async () => {
    if (!viewedUserId || suggestionState === 'sending') return;
    setSuggestionState('sending');
    try {
      await fetchApi('/profile/study-together/', {
        method: 'POST',
        body: JSON.stringify({ target_user_id: viewedUserId }),
      });
      setSuggestionState('sent');
    } catch {
      setSuggestionState('error');
    }
  };

  if (!visibility.isSelf) {
    return (
      <div className={styles.singleCol}>
        <QuickStatsRail
          totalHours={summary?.total_hours}
          sessionCount={summary?.session_count}
          moduleCount={modules?.length || 0}
        />
        <CompatibilityScore
          viewedSummary={summary}
          currentUserSummary={currentUserSummary}
          sharedModuleCount={(modules || []).filter(m => (currentUserModules || []).includes(m)).length}
          totalModuleCount={Math.max((modules || []).length, 1)}
          viewedUsername={viewedUsername}
          mutualConnections={summary?.mutual_connections}
          activitySparkline={summary?.activity_sparkline}
          onSuggestStudySession={handleSuggestStudySession}
          suggestionState={suggestionState}
        />
        {role === 'teacher' ? (
          <ModulesSection modules={modules} onNavigate={onNavigate} role="teacher" />
        ) : (
          <CommonGroundSection
            viewedModules={modules}
            viewedSocieties={summary?.societies}
            currentUserModules={currentUserModules}
            currentUserSocieties={currentUserSummary?.societies}
            viewedUsername={viewedUsername}
            onNavigate={onNavigate}
          />
        )}
      </div>
    );
  }

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

function ProfileContent({ user, state, visibility, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);
  const [headerBadges, setHeaderBadges] = useState([]);
  const [headerPersona, setHeaderPersona] = useState(null);
  const [headerPeakHour, setHeaderPeakHour] = useState(null);
  const [headerSocieties, setHeaderSocieties] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSocieties, setShowSocieties] = useState(false);

  const handlePinBadge = async (badgeId) => {
    if (!visibility.canEditProfile) return;
    const currentPinnedBadgeId = profileData?.pinned_badge_id || '';
    const nextBadgeId = String(currentPinnedBadgeId) === String(badgeId) ? '' : String(badgeId || '');
    try {
      await fetchApi('/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ pinned_badge_id: nextBadgeId }),
      });
      handlers.reload?.();
    } catch (error) {
      console.error('Failed to pin badge', error);
    }
  };

  const pinnedBadgeId = profileData?.pinned_badge_id || '';

  return (
    <div className={styles.content}>
      <ProfileHeader user={profileData || user} profileData={profileData} taskCount={state.taskCount} upcomingEventCount={upcomingEventCount} handlers={handlers} visibility={visibility} badges={headerBadges} pinnedBadgeId={pinnedBadgeId} onPinBadge={handlePinBadge} onViewAllBadges={() => setShowAchievements(true)} persona={headerPersona} peakHour={headerPeakHour} societies={headerSocieties} onNavigate={onNavigate} onSocietiesClick={() => setShowSocieties(true)} />
      <ProfileHome onNavigate={onNavigate} visibility={visibility} viewedUserId={state.viewedUserId} modules={modules} role={profileData?.role || user?.role} onBadgesReady={setHeaderBadges} onPersonaReady={(p, ph) => { setHeaderPersona(p); setHeaderPeakHour(ph); }} onSocietiesReady={setHeaderSocieties} viewedUsername={profileData?.username || user?.username} />
      {visibility.canViewCalendar && <SharedCalendarSection events={filteredEvents} />}
      {showAchievements && <AchievementsModal badges={headerBadges} onClose={() => setShowAchievements(false)} />}
      {showSocieties && <SocietiesModal isOpen societies={headerSocieties} onClose={() => setShowSocieties(false)} onNavigate={onNavigate} />}
    </div>
  );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function SharedCalendarSection({ events }) {
  return (
    <div className={styles.calendarSection}>
      <div className={styles.sectionLabel}>SHARED CALENDAR</div>
      <ProfileCalendar allEvents={events || []} />
    </div>
  );
}

<<<<<<< HEAD
function SelfProfileColumns({ summary, analyticsData, onNavigate, onGoalSave, role }) {
  const isTeacher = role === "teacher";
  return (
    <div className={styles.leftCol}>
      <div className={isTeacher ? styles.leftTopMetricsRowTeacher : styles.leftTopMetricsRow}>
        {!isTeacher && <CompactAttendanceTile onNavigate={onNavigate} />}
        <div className={styles.leftTopSideCol}>
          <div className={styles.leftTopStreakCard}><CompactStreakTile streaks={summary?.streaks} /></div>
          <div className={styles.leftTopWeekCard}><ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} showStreak={false} onGoalSave={onGoalSave} /></div>
          <StudyDNA heatmap={analyticsData?.heatmap} className={styles.leftTopStudyDnaCard} />
        </div>
      </div>
      <FocusHeatmapWidget heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
    </div>
=======

export default function Profile({ user, viewedUserId, onNavigate, onNavChange, onBack, backLabel = "Back" }) {
  const navFn = onNavigate || onNavChange;
  const state = useProfileState(viewedUserId);

  const visibility = useProfileVisibility(state.profileData, user);
  const { filteredEvents, modules } = useProfileBodyData(state);

  if (state.loading) return <ProfileSkeleton />;
  if (!state.profileData) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon="👤"
          title="Profile unavailable"
          description="Could not load this profile. Try logging out and back in, or return to the home page."
        />
      </div>
    );
  }

  return (
    <>
      {onBack && (
        <div className={styles.backButtonWrapper}>
          <BackButton onClick={onBack} label={backLabel} className={styles.backButton} />
        </div>
      )}
      <div className={styles.container}>
        <ProfileContent user={user} state={state} visibility={visibility} onNavigate={navFn} />
      </div>
      <ProfileModals user={user} state={state} modules={modules} filteredEvents={filteredEvents} visibility={visibility} onNavChange={navFn} />
      <ScrollToTop containerSelector="[data-dashboard-main]" />
    </>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
  const peakHour = usePeakHour(analyticsData?.heatmap?.data);
  const currentUserModules = currentUserProfile?.modules || [];
  const suggestion = useSuggestionState(viewedUserId);
  useEffect(() => onBadgesReady?.(summary?.badges || []), [onBadgesReady, summary?.badges]);
  useEffect(() => onPersonaReady?.(summary?.persona || null, peakHour), [onPersonaReady, peakHour, summary?.persona]);
  useEffect(() => onSocietiesReady?.(summary?.societies || []), [onSocietiesReady, summary?.societies]);
  if (loading) return <ProfileSkeleton blocks={<SkeletonGrid />} />;
  if (visibility.isSelf) return <SelfProfileColumns summary={summary} analyticsData={analyticsData} onNavigate={onNavigate} onGoalSave={(goal) => saveWeeklyGoal(goal, refetch)} role={role} />;
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
