/*
 * Header for the study coach panel.
 */

import { Sparkles, X } from "lucide-react";
import styles from "./studyCoachStyles";

export default function StudyCoachHeader({ title, subtitle, hasMessages, onClear, onClose }) {
  return (
    <div className={styles.header}>
      <HeaderIdentity title={title} subtitle={subtitle} />
      <HeaderActions hasMessages={hasMessages} onClear={onClear} onClose={onClose} />
    </div>
  );
}

function HeaderIdentity({ title, subtitle }) {
  return (
    <div className={styles.headerLeft}>
      <span className={styles.headerIcon} aria-hidden="true">
        <Sparkles size={16} />
      </span>
      <div>
        <h3 className={styles.headerTitle}>{title}</h3>
        <p className={styles.headerSub}>{subtitle}</p>
      </div>
    </div>
  );
}

function HeaderActions({ hasMessages, onClear, onClose }) {
  return (
    <div className={styles.headerActions}>
      {hasMessages && (
        <button className={styles.clearBtn} onClick={onClear}>
          Clear
        </button>
      )}
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close chat">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
