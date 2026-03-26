/**
 * Landing page scroll progress bar.
 */

import React from "react";

function LandingProgress({ scrollProgress, styles }) {
  return (
    <div className={styles.progressWrap} aria-hidden>
      <div className={styles.progressBar} style={{ transform: `scaleX(${scrollProgress})` }} />
    </div>
  );
}

export default LandingProgress;
