import compatStyles from "./ProfileCompat.module.css";

const PERSONA_TIME_MAP = {
  night_owl: "night", early_bird: "morning", afternoon_peak: "afternoon",
  consistent: "all", sprint: "neutral", marathon: "neutral",
};

function computeTimeCompat(a, b) {
  if (!a || !b) return 50;
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
      />
    </svg>
  );
}

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

function getCompatibilityLabel(total) {
  if (total >= 75) return "Great match";
  if (total >= 50) return "Some overlap";
  return "Different paths";
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
    label: getCompatibilityLabel(total),
    showCta: total >= 75 && typeof props.onSuggestStudySession === "function",
  };
}

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
    </>
  );
}

export function CompatibilityScore(props) {
  const { viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, viewedUsername, mutualConnections, activitySparkline, onSuggestStudySession, suggestionState = "idle" } = props;
  if (!viewedSummary || !currentUserSummary) return null;
  const viewModel = buildCompatibilityViewModel({ viewedSummary, currentUserSummary, sharedModuleCount, totalModuleCount, onSuggestStudySession });
  return (
    <div className={compatStyles.compatCard}>
      <CompatibilityBody
        viewModel={viewModel}
        viewedUsername={viewedUsername}
        sharedModuleCount={sharedModuleCount}
        mutualConnections={mutualConnections}
        activitySparkline={activitySparkline}
        suggestionState={suggestionState}
        onSuggestStudySession={onSuggestStudySession}
      />
    </div>
  );
}
