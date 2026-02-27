import styles from "./EmptyStateCard.module.css";

/**
 * Original tuxedo cat — kept for non-homepage uses.
 */
function ZenGardenIllustration({ className }) {
  return (
    <svg
      className={className}
      width="140"
      height="88"
      viewBox="0 0 140 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="70" cy="58" rx="28" ry="18" fill="#2d2d2d" stroke="#1a1a1a" strokeWidth="1" />
      <path
        d="M42 58 Q42 48 52 46 L88 46 Q98 48 98 58 L98 68 Q70 72 70 72 Q70 72 42 68 Z"
        fill="#f8f6f2"
        stroke="#1a1a1a"
        strokeWidth="1"
      />
      <circle cx="70" cy="34" r="20" fill="#2d2d2d" stroke="#1a1a1a" strokeWidth="1" />
      <path d="M55 34 Q70 28 85 34 Q70 42 55 34 Z" fill="#f8f6f2" stroke="#1a1a1a" strokeWidth="0.8" />
      <path d="M52 20 L58 8 L64 20 Z" fill="#2d2d2d" stroke="#1a1a1a" strokeWidth="1" />
      <path d="M76 20 L82 8 L88 20 Z" fill="#2d2d2d" stroke="#1a1a1a" strokeWidth="1" />
      <path d="M54 18 L58 10 L62 18 Z" fill="#4a4a4a" />
      <path d="M78 18 L82 10 L86 18 Z" fill="#4a4a4a" />
      <ellipse cx="62" cy="32" rx="3" ry="4" fill="#5a6c3d" />
      <ellipse cx="78" cy="32" rx="3" ry="4" fill="#5a6c3d" />
      <ellipse cx="62.5" cy="31" rx="1" ry="1.2" fill="#2d352d" />
      <ellipse cx="78.5" cy="31" rx="1" ry="1.2" fill="#2d352d" />
      <g>
        <path d="M48 34 H42 M50 38 H43 M50 30 H43" stroke="#3d3d3d" strokeWidth="0.6" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 34; 0 50 34; 15 50 34; -10 50 34; 6 50 34; 0 50 34"
          keyTimes="0; 0.62; 0.70; 0.78; 0.86; 1.0"
          dur="4s" begin="1s" repeatCount="indefinite" />
      </g>
      <g>
        <path d="M92 34 H98 M90 38 H97 M90 30 H97" stroke="#3d3d3d" strokeWidth="0.6" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate"
          values="0 90 34; 0 90 34; -15 90 34; 10 90 34; -6 90 34; 0 90 34"
          keyTimes="0; 0.62; 0.70; 0.78; 0.86; 1.0"
          dur="4s" begin="1.15s" repeatCount="indefinite" />
      </g>
      <path d="M70 36 L68 39 L72 39 Z" fill="#4a3421" stroke="#3d3d3d" strokeWidth="0.5" />
      <path d="M98 52 Q112 44 108 58 Q104 68 98 64" stroke="#2d2d2d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M98 52 Q112 44 108 58 Q104 68 98 64" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Warm earthy-brown tabby cat — matches the Flax app theme (#6B5344 restoration earth).
 * Used for the Day Progress "nothing done yet" state.
 */
function BrownCatIllustration({ className }) {
  return (
    <svg
      className={className}
      width="140"
      height="88"
      viewBox="0 0 140 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Body — restoration earth brown */}
      <ellipse cx="70" cy="58" rx="28" ry="18" fill="#6B5344" />
      {/* Belly patch — warm tan */}
      <path
        d="M52 52 Q52 46 60 45 L80 45 Q88 46 88 52 L88 64 Q70 68 70 68 Q70 68 52 64 Z"
        fill="#C8A882"
      />
      {/* Head */}
      <circle cx="70" cy="34" r="20" fill="#6B5344" />
      {/* Muzzle area */}
      <path d="M58 34 Q70 30 82 34 Q70 42 58 34 Z" fill="#C8A882" />
      {/* Ears */}
      <path d="M52 20 L58 8 L64 20 Z" fill="#6B5344" />
      <path d="M76 20 L82 8 L88 20 Z" fill="#6B5344" />
      {/* Inner ears */}
      <path d="M54 18 L58 10 L62 18 Z" fill="#A07050" />
      <path d="M78 18 L82 10 L86 18 Z" fill="#A07050" />
      {/* Eyes — sage green (same character as original) */}
      <ellipse cx="62" cy="32" rx="3" ry="4" fill="#84A98C" />
      <ellipse cx="78" cy="32" rx="3" ry="4" fill="#84A98C" />
      <ellipse cx="62.5" cy="31" rx="1" ry="1.2" fill="#2d352d" />
      <ellipse cx="78.5" cy="31" rx="1" ry="1.2" fill="#2d352d" />
      {/* Subtle tabby forehead stripes */}
      <path d="M64 22 Q70 20 76 22" stroke="#5c4533" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M62 18 Q70 16 78 18" stroke="#5c4533" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Whiskers */}
      <g>
        <path d="M48 34 H42 M50 38 H43 M50 30 H43" stroke="#5c4d3e" strokeWidth="0.6" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 34; 0 50 34; 15 50 34; -10 50 34; 6 50 34; 0 50 34"
          keyTimes="0; 0.62; 0.70; 0.78; 0.86; 1.0"
          dur="4s" begin="1s" repeatCount="indefinite" />
      </g>
      <g>
        <path d="M92 34 H98 M90 38 H97 M90 30 H97" stroke="#5c4d3e" strokeWidth="0.6" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate"
          values="0 90 34; 0 90 34; -15 90 34; 10 90 34; -6 90 34; 0 90 34"
          keyTimes="0; 0.62; 0.70; 0.78; 0.86; 1.0"
          dur="4s" begin="1.15s" repeatCount="indefinite" />
      </g>
      {/* Nose */}
      <path d="M70 36 L68 39 L72 39 Z" fill="#4A3421" />
      {/* Curled tail */}
      <path
        d="M98 52 Q112 44 108 58 Q104 68 98 64"
        stroke="#6B5344"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M98 52 Q112 44 108 58 Q104 68 98 64"
        stroke="#5c4533"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tail tip — lighter */}
      <circle cx="98" cy="64" r="3.5" fill="#A07050" />
    </svg>
  );
}

/**
 * Animated seedling — grows in and gently sways.
 * Used for the Day Progress "100% complete" state.
 */
function SeedlingIllustration({ className, animated = false }) {
  return (
    <svg
      className={`${className}${animated ? ` ${styles.illustrationAnimated}` : ""}`}
      width="80"
      height="64"
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Pot — static */}
      <path
        d="M24 32 L28 56 L52 56 L56 32 Z"
        fill="#e8e0d5"
        stroke="#6B5344"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      <line x1="28" y1="44" x2="52" y2="44" stroke="#6B5344" strokeWidth="0.8" strokeOpacity="0.3" />
      {/* Soil */}
      <ellipse cx="40" cy="32" rx="14" ry="4" fill="#8B7355" fillOpacity="0.6" />
      {/* Plant group — animated */}
      <g className={animated ? styles.plantGroup : undefined}>
        {/* Stem */}
        <path d="M40 28 Q40 16 38 8" stroke="#5a6c3d" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Left leaf */}
        <path d="M38 18 Q30 14 28 20 Q36 22 38 18" fill="#84A98C" stroke="#5a6c3d" strokeWidth="0.6" />
        {/* Right leaf */}
        <path d="M42 18 Q50 12 52 20 Q44 22 42 18" fill="#84A98C" stroke="#5a6c3d" strokeWidth="0.6" />
        {/* Top leaf */}
        <path d="M40 10 Q36 4 40 2 Q44 4 40 10" fill="#84A98C" stroke="#5a6c3d" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

export default function EmptyStateCard({
  displayName,
  sub = "No overdue or due-soon tasks.",
  message: messageOverride,
  action,
  illustrationVariant,
}) {
  const name = (displayName || "").trim() || "friend";
  const message = messageOverride ?? `The garden is at peace. You've earned your rest, ${name}.`;

  let IllustrationEl;
  if (illustrationVariant === "seedling") {
    IllustrationEl = <SeedlingIllustration className={styles.illustration} animated />;
  } else if (illustrationVariant === "brownCat") {
    IllustrationEl = <BrownCatIllustration className={styles.illustration} />;
  } else {
    IllustrationEl = <ZenGardenIllustration className={styles.illustration} />;
  }

  return (
    <div className={styles.wrap}>
      {IllustrationEl}
      <p className={styles.message}>{message}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
