<<<<<<< HEAD
/*
 * CompatibilityScore widget – study time match, sparkline, and study-together CTA.
 */

import compatStyles from "./ProfileCompat.module.css";
import { motion } from "framer-motion";
import { useCountUp } from "../../../../hooks/useCountUp";
=======
import compatStyles from "./ProfileCompat.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const PERSONA_TIME_MAP = {
  night_owl: "night", early_bird: "morning", afternoon_peak: "afternoon",
  consistent: "all", sprint: "neutral", marathon: "neutral",
};

function computeTimeCompat(a, b) {
<<<<<<< HEAD
=======
  if (!a || !b) return 50;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (a === "all" || b === "all") return 80;
  if (a === b) return 100;
  if (a === "neutral" || b === "neutral") return 60;
  const opposites = { morning: "night", night: "morning" };
  if (opposites[a] === b) return 20;
  return 50;
}

function computeCompatibility(viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount) {
  const moduleScore = totalModuleCount > 0 ? (sharedModuleCount / totalModuleCount) * 100 : 0;
  const viewedTime = PERSONA_TIME_MAP[viewedSummary?.persona?.id] || "neutral";
  const currentTime = PERSONA_TIME_MAP[currentUserSummary?.persona?.id] || "neutral";
  const timeScore = computeTimeCompat(viewedTime, currentTime);
  const personaMatch = viewedSummary?.persona?.id === currentUserSummary?.persona?.id ? 100 : 40;
  return { total: Math.round(moduleScore * 0.5 + timeScore * 0.3 + personaMatch * 0.2), viewedTime, currentTime };
}

<<<<<<< HEAD
const MotionCircle = motion.circle;

function CompatRing({ total }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, total)) / 100) * circumference;
  return (
    <svg viewBox="0 0 120 120" className={compatStyles.compatRing} aria-hidden="true">
      <circle className={compatStyles.compatRingTrack} cx="60" cy="60" r={radius} />
      <MotionCircle className={compatStyles.compatRingProgress} cx="60" cy="60" r={radius}
        style={{ strokeDasharray: circumference }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
=======
function CompatRing({ total }) {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.min(total, 100) / 100) * circ;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className={compatStyles.compatRing}>
      <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="38" cy="38" r={radius} fill="none"
        stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      />
    </svg>
  );
}

<<<<<<< HEAD
function buildRhythmTextForMatch(total) {
  if (total >= 75) return "Your focus windows line up really well";
  if (total >= 50) return "You tend to study around similar hours";
  return "There are a few overlapping study windows";
}

function buildRhythmTextForMismatch(total) {
  if (total >= 60) return "You still have some overlap in your routine";
  if (total >= 40) return "Different study rhythms, but a few shared windows";
  return "Very different study rhythms";
}

function buildCompatDetailText(total, sharedModuleCount, viewedTime, currentTime) {
  const rhythmText = viewedTime === currentTime ? buildRhythmTextForMatch(total) : buildRhythmTextForMismatch(total);
  const sharedLabel = sharedModuleCount > 0 ? `${sharedModuleCount} module${sharedModuleCount > 1 ? "s" : ""} in common` : null;
  return [rhythmText, sharedLabel].filter(Boolean).join(" · ");
}

function CompatHero({ total, sharedModuleCount, viewedTime, currentTime }) {
  const pctRef = useCountUp(total, 1200);
  const detailText = buildCompatDetailText(total, sharedModuleCount, viewedTime, currentTime);
  return (
    <div className={compatStyles.compatHero}>
      <div className={compatStyles.compatRingWrap}><CompatRing total={total} /></div>
      <div className={compatStyles.compatHeroContent}>
        <p className={compatStyles.compatHeroLabel}>Similar study times</p>
        <div className={compatStyles.compatHeroValueRow}>
          <span className={compatStyles.compatHeroValue} ref={pctRef}>0</span>
          <span className={compatStyles.compatHeroUnit}>%</span>
          <span className={compatStyles.compatHeroMatch}>match</span>
        </div>
        {detailText && <p className={compatStyles.compatDetail}>{detailText}</p>}
      </div>
=======
function CompatDetails({ total, label, viewedUsername, sharedModuleCount, viewedTime, currentTime }) {
  return (
    <div className={compatStyles.compatInfo}>
      <span className={compatStyles.compatPct}>{total}% match</span>
      {label !== "Different paths" && (
        <span className={compatStyles.compatLabel}>{label} with {viewedUsername}</span>
      )}
      <span className={compatStyles.compatDetail}>
        {sharedModuleCount > 0 && `${sharedModuleCount} shared module${sharedModuleCount > 1 ? "s" : ""}`}
        {sharedModuleCount > 0 && viewedTime === currentTime && " · "}
        {viewedTime === currentTime && "Similar study times"}
      </span>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

function StudyTogetherCta({ suggestionState, onSuggestStudySession }) {
  const ctaLabel = suggestionState === "sending"
    ? "Sending..."
    : suggestionState === "sent" ? "Suggestion Sent" : "Suggest a Study Session";
  return (
    <button
      type="button"
      className={compatStyles.studyTogetherBtn}
      disabled={suggestionState === "sending" || suggestionState === "sent"}
      onClick={onSuggestStudySession}
    >
      {ctaLabel}
    </button>
  );
}

<<<<<<< HEAD
=======
function MutualAvatar({ person, idx }) {
  return (
    <div className={compatStyles.mutualAvatarWrap} style={{ zIndex: 10 - idx }}>
      {person.profile_photo_url
        ? <img src={person.profile_photo_url} alt={person.username} className={compatStyles.mutualAvatar} />
        : <div className={compatStyles.mutualAvatarFallback}>{(person.username || "?").slice(0, 1).toUpperCase()}</div>}
    </div>
  );
}

function MutualUsersRow({ mutualConnections }) {
  const mutualUsers = mutualConnections?.users || [];
  const mutualCount = mutualConnections?.count || 0;
  if (!mutualCount) return null;
  return (
    <div className={compatStyles.mutualRow}>
      <div className={compatStyles.mutualAvatars}>
        {mutualUsers.slice(0, 4).map((person, idx) => (
          <MutualAvatar key={person.id || person.username} person={person} idx={idx} />
        ))}
      </div>
      <span className={compatStyles.mutualText}>{mutualCount} people you both know</span>
    </div>
  );
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function ActivitySparklineRow({ activitySparkline }) {
  const sparkPoints = Array.isArray(activitySparkline) ? activitySparkline.slice(0, 7) : [];
  if (sparkPoints.length !== 7) return null;
  return (
    <div className={compatStyles.sparklineWrap}>
      <span className={compatStyles.sparklineLabel}>Study momentum</span>
      <div className={compatStyles.sparklineDots}>
        {sparkPoints.map((point, idx) => {
          const level = Math.max(0, Math.min(4, Number(point.level) || 0));
          return (
            <span
              key={`${point.date || "day"}-${idx}`}
              className={`${compatStyles.sparkDot} ${compatStyles[`sparkDot${level}`] || ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

<<<<<<< HEAD
=======
function getCompatibilityLabel(total) {
  if (total >= 75) return "Great match";
  if (total >= 50) return "Some overlap";
  return "Different paths";
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function buildCompatibilityViewModel(props) {
  const { total, viewedTime, currentTime } = computeCompatibility(
    props.viewedSummary,
    props.currentUserSummary,
    props.sharedModuleCount,
    props.totalModuleCount,
  );
  return {
    total,
    viewedTime,
    currentTime,
<<<<<<< HEAD
=======
    label: getCompatibilityLabel(total),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    showCta: total >= 75 && typeof props.onSuggestStudySession === "function",
  };
}

<<<<<<< HEAD
function CompatibilityBody({ viewModel, sharedModuleCount, activitySparkline, suggestionState, onSuggestStudySession }) {
  return (
    <>
      <CompatHero total={viewModel.total} sharedModuleCount={sharedModuleCount} viewedTime={viewModel.viewedTime} currentTime={viewModel.currentTime} />
      {viewModel.showCta && <StudyTogetherCta suggestionState={suggestionState} onSuggestStudySession={onSuggestStudySession} />}
      <div className={compatStyles.compatBottomRow}>
        <ActivitySparklineRow activitySparkline={activitySparkline} />
      </div>
=======
function CompatibilityBody({ viewModel, viewedUsername, sharedModuleCount, mutualConnections, activitySparkline, suggestionState, onSuggestStudySession }) {
  return (
    <>
      <div className={compatStyles.compatTopRow}>
        <CompatRing total={viewModel.total} />
        <CompatDetails total={viewModel.total} label={viewModel.label} viewedUsername={viewedUsername} sharedModuleCount={sharedModuleCount} viewedTime={viewModel.viewedTime} currentTime={viewModel.currentTime} />
      </div>
      {viewModel.showCta && <StudyTogetherCta suggestionState={suggestionState} onSuggestStudySession={onSuggestStudySession} />}
      <MutualUsersRow mutualConnections={mutualConnections} />
      <ActivitySparklineRow activitySparkline={activitySparkline} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </>
  );
}

export function CompatibilityScore(props) {
<<<<<<< HEAD
  const { viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, activitySparkline, onSuggestStudySession, suggestionState = "idle" } = props;
=======
  const { viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, viewedUsername, mutualConnections, activitySparkline, onSuggestStudySession, suggestionState = "idle" } = props;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (!viewedSummary || !currentUserSummary) return null;
  const viewModel = buildCompatibilityViewModel({ viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, onSuggestStudySession });
  return (
    <div className={compatStyles.compatCard}>
      <CompatibilityBody
        viewModel={viewModel}
<<<<<<< HEAD
        sharedModuleCount={sharedModuleCount}
=======
        viewedUsername={viewedUsername}
        sharedModuleCount={sharedModuleCount}
        mutualConnections={mutualConnections}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        activitySparkline={activitySparkline}
        suggestionState={suggestionState}
        onSuggestStudySession={onSuggestStudySession}
      />
    </div>
  );
}
