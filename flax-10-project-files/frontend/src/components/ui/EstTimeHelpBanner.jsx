/**
 * Est-time help banner component.
 */

import { motion } from "framer-motion";
import styles from "./EstTimeHelpBanner.module.css";
import { useEstTimeHelpBanner } from "./est_time_help_banner/useEstTimeHelpBanner";
import { openFlaxChat } from "./est_time_help_banner/estTimeHelpBannerUtils";

const MotionDiv = motion.div;

export default function EstTimeHelpBanner({
  message = "Not sure how long it'll take? Ask Flax for a suggestion.",
  ctaLabel = "Ask Flax",
  initialMessage = "",
  persistDismiss = true,
  className = "",
}) {
  const { dismissBanner, dismissed } = useEstTimeHelpBanner(persistDismiss);

  if (dismissed) return null;

  return (
    <MotionDiv className={`${styles.banner} ${className}`} role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
      <span className={styles.icon} aria-hidden>💡</span>
      <p className={styles.text}>{message}</p>
      <BannerActions ctaLabel={ctaLabel} dismissBanner={dismissBanner} initialMessage={initialMessage} />
    </MotionDiv>
  );
}

function BannerActions({ ctaLabel, dismissBanner, initialMessage }) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.cta} onClick={() => openFlaxChat(initialMessage)}>
        {ctaLabel}
      </button>
      <button type="button" className={styles.dismiss} onClick={dismissBanner} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
