/*
 * CompatibilityScore widget – study time match, sparkline, and study-together CTA.
 */

import compatStyles from "./ProfileCompat.module.css";
import { motion } from "framer-motion";
import { useCountUp } from "../../../../hooks/useCountUp";

const PERSONA_TIME_MAP = {
  night_owl: "night", early_bird: "morning", afternoon_peak: "afternoon",
  consistent: "all", sprint: "neutral", marathon: "neutral",
};

export function computeTimeCompat(a, b) {
  if (a === "all" || b === "all") return 80;
  if (a === b) return 100;
  if (a === "neutral" || b === "neutral") return 60;
  const opposites = { morning: "night", night: "morning" };
  if (opposites[a] === b) return 20;
  return 50;
}

export function computeCompatibility(viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount) {
  const moduleScore = totalModuleCount > 0 ? (sharedModuleCount / totalModuleCount) * 100 : 0;
  const viewedTime = PERSONA_TIME_MAP[viewedSummary?.persona?.id] || "neutral";
  const currentTime = PERSONA_TIME_MAP[currentUserSummary?.persona?.id] || "neutral";
  const timeScore = computeTimeCompat(viewedTime, currentTime);
  const personaMatch = viewedSummary?.persona?.id === currentUserSummary?.persona?.id ? 100 : 40;
  return { total: Math.round(moduleScore * 0.5 + timeScore * 0.3 + personaMatch * 0.2), viewedTime, currentTime };
}

const MotionCircle = motion.circle;

export function buildSparkPointKey(point, idx) {
  return `${point.date || "day"}-${idx}`;
}

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
      />
    </svg>
  );
}

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
              key={buildSparkPointKey(point, idx)}
              className={`${compatStyles.sparkDot} ${compatStyles[`sparkDot${level}`] || ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

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
    showCta: total >= 75 && typeof props.onSuggestStudySession === "function",
  };
}

function CompatibilityBody({ viewModel, sharedModuleCount, activitySparkline, suggestionState, onSuggestStudySession }) {
  return (
    <>
      <CompatHero total={viewModel.total} sharedModuleCount={sharedModuleCount} viewedTime={viewModel.viewedTime} currentTime={viewModel.currentTime} />
      {viewModel.showCta && <StudyTogetherCta suggestionState={suggestionState} onSuggestStudySession={onSuggestStudySession} />}
      <div className={compatStyles.compatBottomRow}>
        <ActivitySparklineRow activitySparkline={activitySparkline} />
      </div>
    </>
  );
}

export function CompatibilityScore(props) {
  const { viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, activitySparkline, onSuggestStudySession, suggestionState = "idle" } = props;
  if (!viewedSummary || !currentUserSummary) return null;
  const viewModel = buildCompatibilityViewModel({ viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, onSuggestStudySession });
  return (
    <div className={compatStyles.compatCard}>
      <CompatibilityBody
        viewModel={viewModel}
        sharedModuleCount={sharedModuleCount}
        activitySparkline={activitySparkline}
        suggestionState={suggestionState}
        onSuggestStudySession={onSuggestStudySession}
      />
    </div>
  );
}
