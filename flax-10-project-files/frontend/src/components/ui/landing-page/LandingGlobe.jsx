/**
 * Landing page globe shell.
 */

import React from "react";

function LandingGlobe({ children, displayTransform, globeOpacity, styles }) {
  return (
    <div className={styles.globeWrap} style={{ opacity: globeOpacity, transform: displayTransform }}>
      <div className={styles.globeInner}>{children}</div>
    </div>
  );
}

export default LandingGlobe;
