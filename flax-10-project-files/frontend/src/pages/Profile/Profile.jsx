import { useState, useEffect, useRef } from "react";
import AchievementsModal from "./AchievementsModal";
import styles from "./Profile.module.css";
import { buildInitials, buildFullName } from "./utils/profileHelpers";
import { useProfileState, useProfileBodyData, useProfileContent } from "./hooks/useProfile";
import ProfileModals from "./ProfileModals";
import { ProfileCalendar } from "./ProfileCalendar";
import { useProfileSummary } from "./hooks/useProfileSummary";
import analyticsService from "../../api/analyticsService";
import { fetchApi } from "../../api/client";
import ShareButton from '../../components/Social/ShareButton';
import { getModules } from "../../api/moduleApi";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function ProfileAvatar({ user, profilePhotoUrl }) {
  return (
    <div className={styles.avatar}>
      {profilePhotoUrl
        ? <img src={profilePhotoUrl} alt="Profile" className={styles.avatarImage} />
        : buildInitials(user)}
    </div>
  );
}

function StatItem({ value, label, onClick }) {
  return (
    <button className={styles.statButton} onClick={onClick}>
      <span className={styles.statValue}>{value}</span> {label}
    </button>
  );
}

function ProfileStats({ profileData, upcomingEventCount, handlers, isMutualOrSelf, isSelf }) {
  const { onModulesClick, onTasksClick, onEventsClick, onSharedWithClick, onSharedByClick } = handlers;
  return (
    <div className={styles.stats}>
      <StatItem value={profileData?.module_count || 0} label="modules" onClick={onModulesClick} />
      {isSelf && (
        <>
          <StatItem value={profileData?.shared_with_count || 0} label="shared with" onClick={onSharedWithClick} />
        </>
      )}
    </div>
  );
}

function ProfileBio({ user, profileData }) {
  const year = profileData?.year || user?.year || "";
  const major = profileData?.major || user?.major || "";
  return (
    <div className={styles.bio}>
      <div className={styles.fullName}>{buildFullName(user)}</div>
      <div className={styles.description}>{year} · {major}</div>
      {profileData?.bio && <div className={styles.reminder}>{profileData.bio}</div>}
    </div>
  );
}

function ProfileHeaderTop({ user, onEditProfile, isSelf }) {
  return (
    <div className={styles.headerTop}>
      <h1 className={styles.username}>{user?.username || "guest"}</h1>
      {isSelf ? (
        <button className={styles.btnEdit} onClick={onEditProfile}>Edit profile</button>
      ) : (
        <div className={styles.shareAction}>
          <ShareButton
            userId={user?.id}
            initialIsSharing={user?.is_sharing}
            onToggle={(newState) => {
              user?.setOptimisticShare?.(newState);
              user?.reload?.();
            }}
          />
        </div>
      )}
    </div>
  );
}

function ProfileHeaderInfo({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf, isSelf }) {
  return (
    <div className={styles.headerInfo}>
      <ProfileHeaderTop user={user} onEditProfile={isSelf ? handlers.onEditProfile : undefined} isSelf={isSelf} />
      <ProfileStats
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
        isSelf={isSelf}
      />
      <ProfileBio user={user} profileData={profileData} />
    </div>
  );
}

function ProfileHeader({ user, profileData, upcomingEventCount, handlers, isMutualOrSelf, isSelf }) {
  const year = profileData?.year || user?.year || "";
  const major = profileData?.major || user?.major || "";
  const username = (profileData || user)?.username || "guest";
  return (
    <>
      {/* Desktop header */}
      <div className={`${styles.header} ${styles.desktopOnly}`}>
        <ProfileAvatar user={user} profilePhotoUrl={profileData?.profile_photo_url} />
        <ProfileHeaderInfo
          user={{ ...user, reload: handlers.reload, setOptimisticShare: handlers.setOptimisticShare }}
          profileData={profileData}
          upcomingEventCount={upcomingEventCount}
          handlers={handlers}
          isMutualOrSelf={isMutualOrSelf}
          isSelf={isSelf}
        />
      </div>

      {/* Mobile hero header */}
      <div className={`${styles.mobileHeaderWrap} ${styles.mobileOnly}`}>
        <div className={styles.mobileHero}>
          <div className={styles.mobileAvatar}>
            {profileData?.profile_photo_url
              ? <img src={profileData.profile_photo_url} alt="Profile" className={styles.avatarImage} />
              : buildInitials(user)}
          </div>
          <h1 className={styles.mobileUsername}>{username}</h1>
          <p className={styles.mobileBio}>{year} {year && major ? '·' : ''} {major}</p>
          <div className={styles.mobileActions}>
            {isSelf
              ? <button className={styles.mobileBtnEdit} onClick={handlers.onEditProfile}>Edit Profile</button>
              : <ShareButton userId={user?.id} initialIsSharing={user?.is_sharing} />}
          </div>
        </div>
        <div className={styles.mobileStatsGrid}>
          <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onModulesClick}>
            <span className={styles.mobileStatValue}>{profileData?.module_count || 0}</span>
            <span className={styles.mobileStatLabel}>Modules</span>
          </div>
          <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onTasksClick}>
            <span className={styles.mobileStatValue}>{profileData?.task_count || 0}</span>
            <span className={styles.mobileStatLabel}>Tasks</span>
          </div>
          <div className={`${styles.mobileStatCard} ${styles.glassCard}`} onClick={handlers.onEventsClick}>
            <span className={styles.mobileStatValue}>{upcomingEventCount || 0}</span>
            <span className={styles.mobileStatLabel}>Events</span>
          </div>
        </div>
      </div>
    </>
  );
}

function useModuleNameMap() {
  const [nameMap, setNameMap] = useState({});
  useEffect(() => {
    getModules()
      .then(data => {
        const list = Array.isArray(data) ? data : data?.results || [];
        const entries = list.filter(m => m.module_code).map(m => [m.module_code, m.module_name]);
        setNameMap(Object.fromEntries(entries));
      })
      .catch(() => { });
  }, []);
  return nameMap;
}

function ModuleCard({ code, name, onNavigate }) {
  return (
    <button className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
      <span className={styles.moduleIcon}>📚</span>
      <span className={styles.moduleCode}>{code}</span>
      {name && <span className={styles.moduleName}>{name}</span>}
    </button>
  );
}

function ModulesGrid({ modules, onNavigate }) {
  const nameMap = useModuleNameMap();
  if (!modules?.length) return null;
  return (
    <div className={styles.modulesGrid}>
      {modules.map((code, i) => <ModuleCard key={i} code={code} name={nameMap[code]} onNavigate={onNavigate} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Persona card — with peak hour subtext
// ---------------------------------------------------------------------------

function PersonaCard({ persona, peakHour }) {
  if (!persona) return null;
  const peakLabel = peakHour != null
    ? `Based on your ${peakHour % 12 || 12}${peakHour >= 12 ? 'pm' : 'am'} peak`
    : null;
  return (
    <div className={`${styles.glassCard} ${styles.personaCard}`}>
      <div className={styles.personaLeft}>
        <span className={styles.personaEmoji} role="img" aria-label={persona.label}>
          {persona.emoji}
        </span>
        <span className={styles.personaLabel}>{persona.label}</span>
        {peakLabel && <span className={styles.personaPeak}>{peakLabel}</span>}
      </div>
      <p className={styles.personaDesc}>{persona.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Study DNA bar
// ---------------------------------------------------------------------------

function StudyDNA({ heatmap }) {
  if (!heatmap?.data) return null;
  const { data: grid } = heatmap;

  let morning = 0, afternoon = 0, evening = 0, night = 0;
  grid.forEach(row => {
    row.forEach((mins, h) => {
      if (h >= 5 && h < 12) morning += mins;
      else if (h >= 12 && h < 17) afternoon += mins;
      else if (h >= 17 && h < 21) evening += mins;
      else night += mins;
    });
  });

  const total = morning + afternoon + evening + night || 1;
  const segments = [
    { label: "Morning", pct: morning / total, color: "#F59E0B" },
    { label: "Afternoon", pct: afternoon / total, color: "#D97706" },
    { label: "Evening", pct: evening / total, color: "#7C3AED" },
    { label: "Night", pct: night / total, color: "#1E3A5F" },
  ].filter(s => s.pct > 0.01);

  return (
    <div className={`${styles.glassCard} ${styles.dnaCard}`}>
      <div className={styles.cardLabel}>STUDY DNA</div>
      <div className={styles.dnaBar}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={styles.dnaSegment}
            style={{
              width: `${s.pct * 100}%`,
              background: s.color,
              borderRadius: i === 0
                ? '5px 0 0 5px'
                : i === segments.length - 1
                  ? '0 5px 5px 0'
                  : '0',
            }}
            title={`${s.label}: ${Math.round(s.pct * 100)}%`}
          />
        ))}
      </div>
      <div className={styles.dnaLegend}>
        {segments.map(s => (
          <div key={s.label} className={styles.dnaLegendItem}>
            <span className={styles.dnaDot} style={{ background: s.color }} />
            <span className={styles.dnaLegendLabel}>{s.label}</span>
            <span className={styles.dnaLegendPct}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini heatmap — by day of week, click → analytics
// ---------------------------------------------------------------------------

function MiniHeatmap({ heatmap, onNavigate }) {
  if (!heatmap?.data) return null;
  const { data: grid } = heatmap;

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // grid rows are individual days; group by day-of-week
  const byDow = Array.from({ length: 7 }, () => 0);
  grid.forEach((row, dayIndex) => {
    const dow = dayIndex % 7;
    byDow[dow] += row.reduce((s, v) => s + v, 0);
  });

  const maxVal = Math.max(...byDow, 1);
  const getOpacity = val => val === 0 ? 0.07 : 0.15 + (val / maxVal) * 0.85;

  const handleClick = () => onNavigate('analytics');
  const handleKeyDown = e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('analytics'); };

  return (
    <div
      className={`${styles.glassCard} ${styles.heatmapCard}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Go to full analytics"
    >
      <div className={styles.heatmapHeader}>
        <div className={styles.cardLabel}>STUDY ACTIVITY</div>
        <div className={styles.heatmapLinkBtn}>
          View full analytics
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className={styles.miniHeatmap}>
        {byDow.map((val, i) => (
          <div key={i} className={styles.heatmapCol}>
            <div
              className={styles.heatmapCell}
              style={{ opacity: getOpacity(val) }}
              title={`${DAY_LABELS[i]}: ${(val / 60).toFixed(1)}h`}
            />
            <span className={styles.heatmapDayLabel}>{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly goal ring — clickable, expands to goal editor on click
// ReactBits-inspired: smooth reveal, animated ring fill
// ---------------------------------------------------------------------------

function GoalRingEditor({ goalHours, hoursStudied, percentage, onSave, onCancel }) {
  const [val, setVal] = useState(goalHours);
  const inputRef = useRef(null);
  const max = 40; // slider max in hrs/week

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSave = () => {
    const n = parseInt(val);
    if (n >= 1 && n <= 168) onSave(n);
  };

  return (
    <div className={styles.goalEditorPanel}>
      <div className={styles.goalEditorLabel}>
        <span>Weekly target</span>
        <span className={styles.goalEditorHrs}>{val}h / week</span>
      </div>
      {/* Slider */}
      <input
        ref={inputRef}
        type="range"
        min="1"
        max={max}
        step="1"
        value={Math.min(val, max)}
        onChange={e => setVal(parseInt(e.target.value))}
        className={styles.goalSlider}
        style={{ '--slider-pct': `${(Math.min(val, max) - 1) / (max - 1) * 100}%` }}
      />
      <div className={styles.goalSliderMarks}>
        <span>1h</span><span>10h</span><span>20h</span><span>30h</span><span>40h</span>
      </div>
      <div className={styles.goalEditorActions}>
        <button className={styles.goalCancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.goalSaveBtn} onClick={handleSave}>Save goal</button>
      </div>
    </div>
  );
}

function ThisWeek({ weekly, streaks, onGoalSave }) {
  const [editing, setEditing] = useState(false);
  if (!weekly) return null;

  const { percentage, hours_studied: hoursStudied, goal_hours: goalHours } = weekly;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const capped = Math.min(percentage, 100);
  const dash = (capped / 100) * circumference;
  const gap = circumference - dash;
  const done = percentage >= 100;
  const remaining = Math.max(0, goalHours - hoursStudied).toFixed(1);
  const currentStreak = streaks?.current ?? 0;
  const longestStreak = streaks?.longest ?? 0;

  const handleSave = async (n) => {
    await onGoalSave(n);
    setEditing(false);
  };

  return (
    <div className={`${styles.glassCard} ${styles.weekCard}`}>
      <div className={styles.weekCardTop}>
        <div className={styles.cardLabel}>THIS WEEK</div>
      </div>

      <div className={styles.weekRow}>
        {/* Ring — click to edit */}
        <div className={styles.goalRingWrap}>
          <button
            className={`${styles.goalRingBtn} ${editing ? styles.goalRingActive : ''}`}
            onClick={() => setEditing(e => !e)}
            title={editing ? 'Close editor' : 'Click to change goal'}
            aria-label="Edit weekly goal"
          >
            <svg
              width="84"
              height="84"
              viewBox="0 0 84 84"
              className={styles.goalRingSvg}
            >
              {/* Track */}
              <circle
                cx="42" cy="42" r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="7"
              />
              {/* Fill */}
              <circle
                cx="42" cy="42" r={radius}
                fill="none"
                stroke={done ? "#4CAF50" : "var(--primary)"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={circumference * 0.25}
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
              />
              {/* Edit pencil hint — subtle */}
              {!done && (
                <circle
                  cx="42" cy="42" r={radius}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`3 ${circumference - 3}`}
                  strokeDashoffset={circumference * 0.25 - dash - 3}
                  opacity="0.25"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
                />
              )}
            </svg>
            <div className={styles.ringInner}>
              <span className={styles.ringValue}>{hoursStudied}h</span>
              <span className={styles.ringGoal}>/{goalHours}h</span>
            </div>
          </button>
          <span className={styles.ringCaption}>
            {editing ? 'tap to close' : 'tap to edit goal'}
          </span>
          {done
            ? <span className={styles.ringProgress} style={{ color: '#4CAF50' }}>Goal reached! 🎉</span>
            : <span className={styles.ringProgress}>{remaining}h to go</span>
          }
        </div>

        <div className={styles.weekDivider} />

        {/* Streaks */}
        <div className={styles.streakRow}>
          <div className={styles.streakItem}>
            <span className={styles.streakNum} style={currentStreak === 0 ? { color: 'var(--muted)' } : {}}>
              {currentStreak === 0 ? '—' : currentStreak}
            </span>
            <span className={styles.streakMeta}>
              <span role="img" aria-label="fire">🔥</span> current streak
            </span>
            {currentStreak === 0 && <span className={styles.streakNudge}>Start one today</span>}
          </div>
          <div className={styles.streakItem}>
            <span className={styles.streakNum} style={longestStreak === 0 ? { color: 'var(--muted)' } : {}}>
              {longestStreak === 0 ? '—' : longestStreak}
            </span>
            <span className={styles.streakMeta}>
              <span role="img" aria-label="trophy">🏆</span> best streak
            </span>
          </div>
        </div>
      </div>

      {/* Animated goal editor panel — slides in below */}
      <div className={`${styles.goalEditorWrap} ${editing ? styles.goalEditorOpen : ''}`}>
        {editing && (
          <GoalRingEditor
            goalHours={goalHours}
            hoursStudied={hoursStudied}
            percentage={percentage}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges — grouped by tier
// ---------------------------------------------------------------------------

const TIER_ORDER = ['gold', 'silver', 'bronze'];
const TIER_META = {
  gold: { label: 'Gold', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  silver: { label: 'Silver', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
  bronze: { label: 'Bronze', color: '#92400E', bg: 'rgba(146,64,14,0.1)', border: 'rgba(146,64,14,0.25)' },
};

function Badge({ badge }) {
  const meta = TIER_META[badge.tier] || TIER_META.bronze;
  return (
    <div
      className={styles.badge}
      style={{ background: meta.bg, borderColor: meta.border }}
      title={badge.description}
    >
      <span role="img" aria-label={badge.label} className={styles.badgeEmoji}>{badge.emoji}</span>
      {badge.label}
    </div>
  );
}

function BadgesSection({ badges, onOpen }) {
  const earned = badges?.length || 0;
  return (
    <div className={`${styles.glassCard} ${styles.badgesBox}`} onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.badgesBoxHeader}>
        <div className={styles.cardLabel}>ACHIEVEMENTS</div>
        <span className={styles.badgesViewAll}>View all →</span>
      </div>
      <div className={styles.badgesSummary}>
        <span className={styles.badgesCount}>{earned}</span>
        <span className={styles.badgesCountLabel}> / 26 unlocked</span>
      </div>
      {!badges?.length ? (
        <p className={styles.emptyBadges}>Complete study sessions to earn badges.</p>
      ) : (
        <div className={styles.badgesGrid}>
          {badges.slice(0, 6).map(b => {
            const meta = TIER_META[b.tier] || TIER_META.bronze;
            return (
              <div key={b.id} className={styles.badge}
                style={{ background: meta.bg, borderColor: meta.border }}
                title={b.description}
              >
                <span role="img" aria-label={b.label} className={styles.badgeEmoji}>{b.emoji}</span>
                {b.label}
              </div>
            );
          })}
          {badges.length > 6 && (
            <div className={styles.badgesMore}>+{badges.length - 6} more</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={`${styles.skel} ${styles.skelPersona}`} />
      <div className={`${styles.skel} ${styles.skelWeek}`} />
      <div className={`${styles.skel} ${styles.skelDna}`} />
      <div className={`${styles.skel} ${styles.skelHeatmap}`} />
      <div className={styles.skelBadgeRow}>
        {[...Array(5)].map((_, i) => <div key={i} className={`${styles.skel} ${styles.skelBadge}`} />)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileHome
// ---------------------------------------------------------------------------

function ProfileHome({ onNavigate, isSelf, viewedUserId }) {
  const { summary, loading, refetch } = useProfileSummary(viewedUserId);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    // Only fetch analytics if viewing self
    if (isSelf) {
      analyticsService.getSummary(90).then(setAnalyticsData).catch(() => { });
    }
  }, [isSelf]);

  const handleGoalSave = async (newGoal) => {
    try {
      await fetchApi('/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ weekly_goal_hours: newGoal }),
      });
      if (refetch) refetch();
    } catch (e) {
      console.error('Failed to save goal:', e);
    }
  };

  // Derive peak hour from heatmap for persona subtext
  const peakHour = (() => {
    if (!analyticsData?.heatmap?.data) return null;
    const grid = analyticsData.heatmap.data;
    const hourTotals = Array.from({ length: 24 }, (_, h) =>
      grid.reduce((s, row) => s + (row[h] || 0), 0)
    );
    const max = Math.max(...hourTotals);
    return max > 0 ? hourTotals.indexOf(max) : null;
  })();

  if (loading) return <Skeleton />;

  return (
    <div className={styles.profileHome}>
      {isSelf ? (
        <>
          <PersonaCard persona={summary?.persona} peakHour={peakHour} />
          <div className={styles.twoCol}>
            <div className={styles.leftCol}>
              <ThisWeek weekly={summary?.weekly} streaks={summary?.streaks} onGoalSave={handleGoalSave} />
              <StudyDNA heatmap={analyticsData?.heatmap} />
              <MiniHeatmap heatmap={analyticsData?.heatmap} onNavigate={onNavigate} />
            </div>
            <div className={styles.rightCol}>
              <BadgesSection badges={summary?.badges} onOpen={() => setShowAchievements(true)} />
            </div>
          </div>
        </>
      ) : (
        <div className={styles.badgesWrapper} style={{ marginTop: '2rem' }}>
          <BadgesSection badges={summary?.badges} onOpen={() => setShowAchievements(true)} />
        </div>
      )}
      {showAchievements && (
        <AchievementsModal
          badges={summary?.badges}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------

function ProfileContent({ user, state, isMutualOrSelf, isSelf, onNavigate }) {
  const { profileData, handlers } = useProfileContent(state);
  const { modules, upcomingEventCount, filteredEvents } = useProfileBodyData(state);

  return (
    <div className={styles.content}>
      <ProfileHeader
        user={profileData || user}
        profileData={profileData}
        upcomingEventCount={upcomingEventCount}
        handlers={handlers}
        isMutualOrSelf={isMutualOrSelf}
        isSelf={isSelf}
      />
      <ModulesGrid modules={modules} onNavigate={onNavigate} isSelf={isSelf} />

      <ProfileHome onNavigate={onNavigate} isSelf={isSelf} viewedUserId={state.viewedUserId} />
    </div>
  );
}

function ProfileBody({ user, state, onNavigate }) {
  const { filteredEvents, modules } = useProfileBodyData(state);
  const profileData = state.profileData;
  const isSelf = profileData?.username === user?.username || !profileData;
  const isSharedOrSelf = isSelf || profileData?.is_shared_with_me;

  return (
    <div className={styles.container}>
      <ProfileContent
        user={user}
        state={state}
        isMutualOrSelf={isSharedOrSelf}
        isSelf={isSelf}
        onNavigate={onNavigate}
      />
      <ProfileModals
        user={user}
        state={state}
        modules={modules}
        filteredEvents={filteredEvents}
        isMutualOrSelf={isSharedOrSelf}
        onNavChange={state.onNavChange}
      />
    </div>
  );
}

export default function Profile({ user, viewedUserId, onBack, onNavigate, onNavChange }) {
  const navFn = onNavigate || onNavChange;
  const state = useProfileState(viewedUserId);
  state.onNavChange = navFn;

  if (state.loading) return <div className={styles.container}>Loading...</div>;
  if (!state.profileData) return <div className={styles.container}>User not found.</div>;
  return <ProfileBody user={user} state={state} onNavigate={navFn} />;
}
