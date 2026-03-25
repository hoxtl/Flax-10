/**
 * Landing page top pills.
 */

import React from "react";

function LandingTopPills({ styles, topPills }) {
  if (!topPills.length) {
    return null;
  }

  return (
    <div className={styles.pageTopPills} aria-label="Key features">
      <p className={styles.pageTopText}>{topPills.map(renderPill(styles))}</p>
    </div>
  );
}

function renderPill(styles) {
  return function pillItem(pill, index) {
    return (
      <span key={pill} className={styles.pageTopItem}>
        {index > 0 ? " \u00b7 " : ""}
        {pill}
      </span>
    );
  };
}

export default LandingTopPills;
