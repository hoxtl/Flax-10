/**
 * EstTimeHelpBanner — short banner above quick add suggesting users ask Flax.
 * Dismissible (persisted). Clicking "Ask Flax" opens chat with optional initial prompt.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./EstTimeHelpBanner.module.css";

const STORAGE_KEY = "flax-est-time-banner-dismissed-v2";

function openFlaxChat(initialMessage) {
  try {
    window.dispatchEvent(
      new CustomEvent("flax-open-chat", {
        detail: typeof initialMessage === "string" && initialMessage.trim() ? { initialMessage: initialMessage.trim() } : {},
      })
    );
  } catch (_) {}
}

export default function EstTimeHelpBanner({
  message = "Not sure how long it'll take? Ask Flax for a suggestion.",
  ctaLabel = "Ask Flax",
  initialMessage = "",
  persistDismiss = true,
  className = "",
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!persistDismiss) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setDismissed(true);
    } catch (_) {}
  }, [persistDismiss]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    if (persistDismiss) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (_) {}
    }
  };

  if (dismissed) return null;

  return (
    <motion.div
      className={`${styles.banner} ${className}`}
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className={styles.icon} aria-hidden>💡</span>
      <p className={styles.text}>{message}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cta}
          onClick={() => openFlaxChat(initialMessage)}
        >
          {ctaLabel}
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
